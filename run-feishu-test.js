/**
 * 飞书多维表格测试运行器
 * 使用配置文件运行完整的集成测试
 */

const FeishuAPITester = require('./feishu-api-tester.js');
const fs = require('fs');
const path = require('path');

async function runFeishuTest() {
  console.log('🚀 飞书多维表格集成测试启动...\n');

  // 检查配置文件
  const configPath = path.join(__dirname, 'test-config.js');
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ 未找到配置文件 test-config.js');
    console.log('');
    console.log('📋 请按以下步骤创建配置文件:');
    console.log('1. 复制 test-config.example.js 为 test-config.js');
    console.log('2. 填入你的飞书应用信息:');
    console.log('   - appToken: 应用令牌');
    console.log('   - tableId: 表格ID');
    console.log('   - userToken: 用户令牌 (可选)');
    console.log('3. 配置字段映射:');
    console.log('   - provinceField: 省份字段名');
    console.log('   - valueField: 数值字段名');
    console.log('   - managerField: 负责人字段名 (可选)');
    console.log('   - organizationField: 机构字段名 (可选)');
    console.log('');
    console.log('💡 如需帮助，请查看 飞书多维表格接入信息收集.md');
    return;
  }

  try {
    // 加载配置
    const { feishuConfig, fieldMapping } = require(configPath);
    
    console.log('📋 配置信息:');
    console.log('  App Token:', feishuConfig.appToken ? '✅ 已配置' : '❌ 未配置');
    console.log('  Table ID:', feishuConfig.tableId ? '✅ 已配置' : '❌ 未配置');
    console.log('  User Token:', feishuConfig.userToken ? '✅ 已配置' : '⚠️  未配置 (可选)');
    console.log('  字段映射:', fieldMapping);
    console.log('');

    // 验证必需配置
    if (!feishuConfig.appToken || !feishuConfig.tableId) {
      console.log('❌ 缺少必需的配置信息');
      console.log('请确保 appToken 和 tableId 已正确配置');
      return;
    }

    // 创建测试器并运行测试
    const tester = new FeishuAPITester(feishuConfig);
    const report = await tester.runFullTest(fieldMapping);
    
    if (report) {
      // 生成并保存报告
      const reportText = tester.generateReport(report);
      const reportPath = path.join(__dirname, 'feishu-test-report.md');
      fs.writeFileSync(reportPath, reportText);
      
      console.log('');
      console.log('🎉 测试完成！');
      console.log(`📄 详细报告已保存到: ${reportPath}`);
      console.log('');
      
      // 显示关键结果
      const { conversionResult, testResults } = report;
      console.log('📊 关键结果:');
      console.log(`  数据转换成功率: ${((conversionResult.summary.success / conversionResult.summary.total) * 100).toFixed(1)}%`);
      console.log(`  覆盖省份数量: ${conversionResult.summary.provinces.length}个`);
      console.log(`  插件兼容性: ${testResults.formatValidation.valid ? '✅ 兼容' : '❌ 需要调整'}`);
      
      if (testResults.formatValidation.valid) {
        console.log('');
        console.log('🎯 结论: 你的多维表格数据完全兼容插件！');
        console.log('🚀 可以直接部署插件到飞书使用。');
      } else {
        console.log('');
        console.log('⚠️  结论: 数据格式需要调整');
        console.log('📋 请查看报告中的详细建议');
      }
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:');
    console.error('  错误信息:', error.message);
    console.log('');
    console.log('🔧 可能的解决方案:');
    console.log('1. 检查网络连接');
    console.log('2. 验证 appToken 和 tableId 是否正确');
    console.log('3. 确认应用权限是否充足');
    console.log('4. 检查表格是否存在且可访问');
    console.log('');
    console.log('💡 如需帮助，请查看错误信息或联系技术支持');
  }
}

// 运行测试
if (require.main === module) {
  runFeishuTest().catch(error => {
    console.error('程序异常退出:', error);
    process.exit(1);
  });
}

module.exports = runFeishuTest;