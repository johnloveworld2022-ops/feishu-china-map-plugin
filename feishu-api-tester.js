/**
 * 飞书多维表格API集成测试工具
 * 用于测试插件与真实飞书多维表格的集成
 */

const https = require('https');
const DataConverter = require('./data-converter.js');
const { runTests } = require('./test-plugin-integration.js');

class FeishuAPITester {
  constructor(config) {
    this.appToken = config.appToken;
    this.tableId = config.tableId;
    this.userToken = config.userToken;
    this.baseURL = 'https://open.feishu.cn';
    this.converter = new DataConverter();
  }

  /**
   * 发送HTTP请求
   */
  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: 'open.feishu.cn',
        port: 443,
        path: path,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${this.userToken || this.appToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

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

  /**
   * 获取表格信息
   */
  async getTableInfo() {
    console.log('📋 获取表格基本信息...');
    
    try {
      const response = await this.makeRequest(
        `/open-apis/bitable/v1/apps/${this.appToken}/tables/${this.tableId}`
      );

      if (response.data.code === 0) {
        console.log('✅ 表格信息获取成功');
        return response.data.data;
      } else {
        throw new Error(`API错误: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('❌ 获取表格信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取表格字段信息
   */
  async getTableFields() {
    console.log('📝 获取表格字段信息...');
    
    try {
      const response = await this.makeRequest(
        `/open-apis/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/fields`
      );

      if (response.data.code === 0) {
        console.log('✅ 字段信息获取成功');
        return response.data.data.items;
      } else {
        throw new Error(`API错误: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('❌ 获取字段信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取表格记录
   */
  async getTableRecords(pageSize = 100) {
    console.log('📊 获取表格记录...');
    
    try {
      const response = await this.makeRequest(
        `/open-apis/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/records?page_size=${pageSize}`
      );

      if (response.data.code === 0) {
        console.log(`✅ 记录获取成功，共 ${response.data.data.items.length} 条`);
        return response.data.data.items;
      } else {
        throw new Error(`API错误: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('❌ 获取记录失败:', error.message);
      throw error;
    }
  }

  /**
   * 分析字段映射
   */
  analyzeFields(fields) {
    console.log('🔍 分析字段映射...');
    
    const fieldAnalysis = {
      allFields: [],
      potentialProvinceFields: [],
      potentialValueFields: [],
      potentialManagerFields: [],
      potentialOrgFields: []
    };

    fields.forEach(field => {
      fieldAnalysis.allFields.push({
        name: field.field_name,
        type: field.type,
        id: field.field_id
      });

      const name = field.field_name.toLowerCase();
      
      // 省份字段检测
      if (name.includes('省') || name.includes('地区') || name.includes('region') || 
          name.includes('province') || name.includes('area')) {
        fieldAnalysis.potentialProvinceFields.push(field.field_name);
      }
      
      // 数值字段检测
      if ((field.type === 2 || field.type === 'number') && 
          (name.includes('数量') || name.includes('金额') || name.includes('count') || 
           name.includes('amount') || name.includes('value'))) {
        fieldAnalysis.potentialValueFields.push(field.field_name);
      }
      
      // 负责人字段检测
      if (name.includes('负责人') || name.includes('manager') || name.includes('负责')) {
        fieldAnalysis.potentialManagerFields.push(field.field_name);
      }
      
      // 机构字段检测
      if (name.includes('机构') || name.includes('公司') || name.includes('organization') || 
          name.includes('company') || name.includes('部门')) {
        fieldAnalysis.potentialOrgFields.push(field.field_name);
      }
    });

    console.log('📋 字段分析结果:');
    console.log('  所有字段:', fieldAnalysis.allFields.map(f => f.name));
    console.log('  可能的省份字段:', fieldAnalysis.potentialProvinceFields);
    console.log('  可能的数值字段:', fieldAnalysis.potentialValueFields);
    console.log('  可能的负责人字段:', fieldAnalysis.potentialManagerFields);
    console.log('  可能的机构字段:', fieldAnalysis.potentialOrgFields);

    return fieldAnalysis;
  }

  /**
   * 转换记录数据
   */
  convertRecords(records, fieldMapping) {
    console.log('🔄 转换记录数据...');
    
    const convertedRecords = records.map(record => {
      const convertedRecord = {};
      
      Object.keys(record.fields).forEach(fieldId => {
        // 通过字段ID找到字段名
        const fieldName = this.getFieldNameById(fieldId, fieldMapping);
        if (fieldName) {
          convertedRecord[fieldName] = record.fields[fieldId];
        }
      });
      
      return { fields: convertedRecord };
    });

    return convertedRecords;
  }

  /**
   * 通过字段ID获取字段名
   */
  getFieldNameById(fieldId, fieldMapping) {
    const field = fieldMapping.find(f => f.field_id === fieldId);
    return field ? field.field_name : null;
  }

  /**
   * 完整测试流程
   */
  async runFullTest(fieldMapping) {
    console.log('🚀 开始飞书多维表格完整测试...\n');
    
    try {
      // 1. 获取表格信息
      const tableInfo = await this.getTableInfo();
      console.log('📋 表格信息:', {
        name: tableInfo.name,
        revision: tableInfo.revision
      });
      console.log('');

      // 2. 获取字段信息
      const fields = await this.getTableFields();
      const fieldAnalysis = this.analyzeFields(fields);
      console.log('');

      // 3. 获取记录数据
      const records = await this.getTableRecords();
      console.log('');

      // 4. 转换数据格式
      const convertedRecords = this.convertRecords(records, fields);
      const conversionResult = this.converter.convertBitableData(convertedRecords, fieldMapping);
      console.log('');

      // 5. 运行插件测试
      if (conversionResult.data.length > 0) {
        console.log('🧪 运行插件集成测试...');
        const testResults = await runTests(conversionResult.data);
        console.log('');

        // 6. 生成测试报告
        const report = {
          tableInfo,
          fieldAnalysis,
          recordCount: records.length,
          conversionResult,
          testResults,
          timestamp: new Date().toISOString()
        };

        console.log('📊 测试完成！生成详细报告...');
        return report;
      } else {
        console.log('❌ 数据转换失败，无法进行插件测试');
        return null;
      }

    } catch (error) {
      console.error('❌ 测试过程中出现错误:', error.message);
      throw error;
    }
  }

  /**
   * 生成测试报告
   */
  generateReport(report) {
    const reportText = `
# 飞书多维表格集成测试报告

## 📋 基本信息
- **表格名称**: ${report.tableInfo.name}
- **测试时间**: ${report.timestamp}
- **记录总数**: ${report.recordCount}

## 📝 字段分析
- **所有字段**: ${report.fieldAnalysis.allFields.map(f => f.name).join(', ')}
- **建议省份字段**: ${report.fieldAnalysis.potentialProvinceFields.join(', ') || '未检测到'}
- **建议数值字段**: ${report.fieldAnalysis.potentialValueFields.join(', ') || '未检测到'}

## 🔄 数据转换结果
- **转换成功**: ${report.conversionResult.summary.success}/${report.conversionResult.summary.total}
- **成功率**: ${((report.conversionResult.summary.success / report.conversionResult.summary.total) * 100).toFixed(1)}%
- **覆盖省份**: ${report.conversionResult.summary.provinces.join(', ')}
- **数值范围**: ${report.conversionResult.summary.valueRange.min} - ${report.conversionResult.summary.valueRange.max}

## 🧪 插件测试结果
- **数据格式验证**: ${report.testResults.formatValidation.valid ? '✅ 通过' : '❌ 失败'}
- **地区映射**: ${report.testResults.mappingResults.matched.length}个成功, ${report.testResults.mappingResults.unmatched.length}个失败
- **性能测试**: ${report.testResults.performance.processingTime}ms

## 📊 结论
${report.testResults.formatValidation.valid ? 
  '✅ 插件可以正常处理你的多维表格数据！' : 
  '❌ 数据格式需要调整才能正常使用插件。'}

---
报告生成时间: ${new Date().toLocaleString()}
`;

    return reportText;
  }
}

// 使用示例
async function testWithConfig(config, fieldMapping) {
  const tester = new FeishuAPITester(config);
  
  try {
    const report = await tester.runFullTest(fieldMapping);
    if (report) {
      const reportText = tester.generateReport(report);
      console.log(reportText);
      
      // 保存报告到文件
      const fs = require('fs');
      fs.writeFileSync('feishu-test-report.md', reportText);
      console.log('📄 测试报告已保存到: feishu-test-report.md');
    }
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 导出
module.exports = FeishuAPITester;

// 如果直接运行
if (require.main === module) {
  console.log('🔧 飞书API测试工具已加载');
  console.log('请提供配置信息后调用 testWithConfig() 函数');
  console.log('');
  console.log('示例配置:');
  console.log(`
const config = {
  appToken: 'app_xxxxxxxxxxxxxxxxx',
  tableId: 'tblxxxxxxxxxxxxxxxxx',
  userToken: 'u-xxxxxxxxxxxxxxxxx' // 可选
};

const fieldMapping = {
  provinceField: '省份',
  valueField: '数量',
  managerField: '负责人',
  organizationField: '机构'
};

testWithConfig(config, fieldMapping);
  `);
}