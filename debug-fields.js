/**
 * 调试字段映射
 */
const https = require('https');

const config = {
  tenantAccessToken: 't-g1049a5SG3LCNHXTWTG426OSKQIXHKKEUKQSCDEQ',
  appToken: 'PGuTbyauXavdl7s8Jpec2lUAnah',
  tableId: 'tblLawFGl4bUcqHA'
};

function makeFeishuRequest(path) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.tenantAccessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ statusCode: res.statusCode, error: error.message, rawData: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function debugFields() {
  console.log('🔍 调试字段映射...\n');
  
  try {
    // 1. 获取字段信息
    console.log('📝 获取字段信息:');
    const fieldsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/fields`;
    const fieldsResult = await makeFeishuRequest(fieldsPath);
    
    if (fieldsResult.data && fieldsResult.data.code === 0) {
      const fields = fieldsResult.data.data.items;
      console.log('字段列表:');
      fields.forEach(field => {
        console.log(`  - ${field.field_id}: ${field.field_name} (${field.type})`);
      });
      console.log('');
    }
    
    // 2. 获取记录数据
    console.log('📊 获取记录数据:');
    const recordsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records?page_size=3`;
    const recordsResult = await makeFeishuRequest(recordsPath);
    
    if (recordsResult.data && recordsResult.data.code === 0) {
      const records = recordsResult.data.data.items;
      console.log('前3条记录的原始数据:');
      records.forEach((record, index) => {
        console.log(`记录${index + 1}:`, JSON.stringify(record.fields, null, 2));
      });
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugFields();