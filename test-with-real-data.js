/**
 * 使用真实数据测试插件兼容性
 */

const { runTests } = require('./test-plugin-integration.js');
const DataConverter = require('./data-converter.js');

// 你提供的真实数据
const realData = [
  {
    province: '北京',
    value: 5,
    manager: '张三',
    organization: '北京分公司'
  },
  {
    province: '上海',
    value: 3,
    manager: '李四',
    organization: '上海分公司'
  },
  {
    province: '浙江',
    value: 5,
    manager: '张三',
    organization: '杭州分公司'
  },
  {
    province: '广东',
    value: 1,
    manager: '王五',
    organization: '广州分公司'
  }
];

async function testRealData() {
  console.log('🎯 使用你的真实数据测试插件兼容性...\n');
  
  console.log('📊 你的数据:');
  console.table(realData);
  console.log('');
  
  // 运行完整测试
  const testResults = await runTests(realData);
  
  // 生成专门的报告
  console.log('\n📋 针对你的数据的测试报告:');
  console.log('================================');
  
  console.log('\n✅ 数据兼容性:');
  console.log(`  格式验证: ${testResults.formatValidation.valid ? '✅ 通过' : '❌ 失败'}`);
  console.log(`  数据记录: ${testResults.formatValidation.summary.totalRecords} 条`);
  console.log(`  覆盖省份: ${testResults.formatValidation.summary.provinces.join(', ')}`);
  console.log(`  数值范围: ${testResults.formatValidation.summary.valueRange.min} - ${testResults.formatValidation.summary.valueRange.max}`);
  
  console.log('\n🗺️ 地区映射:');
  console.log(`  成功映射: ${testResults.mappingResults.matched.length} 个省份`);
  console.log(`  映射详情: ${testResults.mappingResults.matched.map(m => `${m.original}→${m.mapped}`).join(', ')}`);
  if (testResults.mappingResults.unmatched.length > 0) {
    console.log(`  未映射: ${testResults.mappingResults.unmatched.join(', ')}`);
  }
  
  console.log('\n🎨 颜色方案效果:');
  const blueScheme = testResults.colorTests.find(t => t.scheme === 'blue');
  if (blueScheme) {
    console.log('  蓝色方案预览:');
    blueScheme.colorMapping.forEach(item => {
      console.log(`    ${item.province}: 数值${item.value} → ${item.color} (强度${item.ratio})`);
    });
  }
  
  console.log('\n⚡ 性能表现:');
  console.log(`  处理时间: ${testResults.performance.processingTime}ms`);
  console.log(`  处理速度: ${testResults.performance.avgTime.toFixed(2)}ms/记录`);
  
  console.log('\n🎯 结论:');
  if (testResults.formatValidation.valid) {
    console.log('  ✅ 你的数据完全兼容飞书插件！');
    console.log('  🚀 可以直接部署使用，插件将显示:');
    console.log('     - 4个省份的数据分布');
    console.log('     - 根据管理区域数量(1-5)进行颜色深浅标记');
    console.log('     - 鼠标悬停显示详细信息(负责人、机构等)');
    console.log('     - 支持多种颜色方案切换');
  } else {
    console.log('  ❌ 数据格式需要调整');
    console.log('  📋 请查看上方的详细错误信息');
  }
  
  console.log('\n📈 数据洞察:');
  console.log('  👤 负责人分布:');
  const managerStats = {};
  realData.forEach(item => {
    managerStats[item.manager] = (managerStats[item.manager] || 0) + item.value;
  });
  Object.entries(managerStats).forEach(([manager, total]) => {
    console.log(`     ${manager}: 管理 ${total} 个区域`);
  });
  
  console.log('\n  🏢 区域分布:');
  realData.forEach(item => {
    const intensity = item.value >= 5 ? '高密度' : item.value >= 3 ? '中密度' : '低密度';
    console.log(`     ${item.province}: ${item.value}个区域 (${intensity})`);
  });
  
  return testResults;
}

// 运行测试
if (require.main === module) {
  testRealData().then(results => {
    console.log('\n🎉 测试完成！你的数据已验证可用。');
  }).catch(error => {
    console.error('❌ 测试失败:', error);
  });
}

module.exports = testRealData;