/**
 * 飞书API调试工具
 * 用于调试API调用问题
 */

const https = require('https');

// 配置信息
const config = {
  appToken: 'PGuTbyauXavdl7s8Jpec2lUAnah',
  tableId: 'tblLawFGl4bUcqHA'
};

function debugRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${config.appToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    console.log('🔍 请求信息:');
    console.log('  URL:', `https://open.feishu.cn${path}`);
    console.log('  Method:', requestOptions.method);
    console.log('  Headers:', requestOptions.headers);
    console.log('');

    const req = https.request(requestOptions, (res) => {
      console.log('📡 响应信息:');
      console.log('  状态码:', res.statusCode);
      console.log('  响应头:', res.headers);
      console.log('');

      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📄 原始响应内容:');
        console.log(data);
        console.log('');
        console.log('📄 响应内容长度:', data.length);
        console.log('📄 前100个字符:', data.substring(0, 100));
        
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ JSON解析成功:');
          console.log(JSON.stringify(jsonData, null, 2));
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          console.log('❌ JSON解析失败:', error.message);
          console.log('📄 尝试分析响应内容...');
          
          // 分析响应内容
          if (data.includes('<html>')) {
            console.log('⚠️  响应似乎是HTML页面，可能是错误页面或重定向');
          }
          if (data.includes('404')) {
            console.log('⚠️  可能是404错误');
          }
          if (data.includes('401') || data.includes('Unauthorized')) {
            console.log('⚠️  可能是认证错误');
          }
          if (data.includes('403') || data.includes('Forbidden')) {
            console.log('⚠️  可能是权限错误');
          }
          
          resolve({
            statusCode: res.statusCode,
            error: error.message,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 请求错误:', error.message);
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function runDebugTest() {
  console.log('🔍 开始API调试测试...\n');
  
  try {
    // 测试1: 获取表格信息
    console.log('📋 测试1: 获取表格信息');
    const tableInfoPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}`;
    const result1 = await debugRequest(tableInfoPath);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 测试2: 获取字段信息
    console.log('📝 测试2: 获取字段信息');
    const fieldsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/fields`;
    const result2 = await debugRequest(fieldsPath);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 测试3: 获取记录信息
    console.log('📊 测试3: 获取记录信息');
    const recordsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records?page_size=5`;
    const result3 = await debugRequest(recordsPath);
    
    console.log('\n🎯 调试测试完成');
    
  } catch (error) {
    console.error('❌ 调试测试失败:', error.message);
  }
}

// 运行调试测试
runDebugTest();