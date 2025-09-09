/**
 * 使用正确的认证信息测试飞书API
 */

const https = require('https');

// 你提供的正确认证信息
const config = {
  tenantAccessToken: 't-g10499jpVAVRDPDZLIQ6XNMBUEEEWIZM7YXRS5QA',
  appToken: 'PGuTbyauXavdl7s8Jpec2lUAnah',
  tableId: 'tblLawFGl4bUcqHA'
};

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${config.tenantAccessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    console.log('🔍 API请求:', `https://open.feishu.cn${path}`);

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          console.log('原始响应:', data);
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function fetchFeishuData() {
  console.log('🚀 开始获取飞书多维表格数据...\n');
  
  try {
    // 1. 获取表格字段信息
    console.log('📝 获取表格字段...');
    const fieldsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/fields`;
    const fieldsResponse = await makeRequest(fieldsPath);
    
    if (fieldsResponse.data.code !== 0) {
      throw new Error(`获取字段失败: ${fieldsResponse.data.msg}`);
    }
    
    const fields = fieldsResponse.data.data.items;
    console.log('✅ 字段获取成功:', fields.length, '个字段');
    
    // 显示字段信息
    console.log('\n📋 表格字段:');
    fields.forEach(field => {
      console.log(`  - ${field.field_name} (${field.type})`);
    });
    
    // 2. 获取表格记录
    console.log('\n📊 获取表格记录...');
    const recordsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`;
    const recordsResponse = await makeRequest(recordsPath);
    
    if (recordsResponse.data.code !== 0) {
      throw new Error(`获取记录失败: ${recordsResponse.data.msg}`);
    }
    
    const records = recordsResponse.data.data.items;
    console.log('✅ 记录获取成功:', records.length, '条记录');
    
    // 3. 转换数据格式
    console.log('\n🔄 转换数据格式...');
    const convertedData = convertRecordsToMapData(records, fields);
    
    console.log('✅ 数据转换完成');
    console.log('\n📊 转换后的数据:');
    console.table(convertedData);
    
    return convertedData;
    
  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    throw error;
  }
}

function convertRecordsToMapData(records, fields) {
  // 创建字段ID到字段名的映射
  const fieldMap = {};
  fields.forEach(field => {
    fieldMap[field.field_id] = field.field_name;
  });
  
  return records.map(record => {
    const convertedRecord = {};
    
    // 转换字段ID为字段名
    Object.keys(record.fields).forEach(fieldId => {
      const fieldName = fieldMap[fieldId];
      if (fieldName) {
        convertedRecord[fieldName] = record.fields[fieldId];
      }
    });
    
    // 标准化为插件需要的格式
    return {
      province: convertedRecord['所属省份'] || convertedRecord['省份'],
      value: parseInt(convertedRecord['管理区域']) || 0,
      manager: convertedRecord['负责人'],
      organization: convertedRecord['机构名称']
    };
  }).filter(item => item.province); // 过滤掉没有省份信息的记录
}

// 运行测试
if (require.main === module) {
  fetchFeishuData().then(data => {
    console.log('\n🎉 数据获取成功！');
    console.log('📄 数据已保存，可以用于地图展示');
    
    // 保存数据到文件供地图使用
    const fs = require('fs');
    fs.writeFileSync('feishu-map-data.json', JSON.stringify(data, null, 2));
    console.log('💾 数据已保存到: feishu-map-data.json');
    
  }).catch(error => {
    console.error('❌ 测试失败:', error.message);
  });
}

module.exports = { fetchFeishuData, config };