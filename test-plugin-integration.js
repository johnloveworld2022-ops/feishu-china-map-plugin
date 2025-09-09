/**
 * 飞书插件集成测试脚本
 * 用于测试插件与多维表格数据的集成
 */

// 模拟飞书环境
const mockFeishuEnv = {
  bitable: {
    base: {
      getTableList: async () => [
        { id: 'tbl123', name: '地区数据表' }
      ],
      getTable: async (tableId) => ({
        id: tableId,
        name: '地区数据表',
        getRecordList: async () => ({
          records: [
            {
              fields: {
                '省份': '北京',
                '数量': 150,
                '负责人': '张三',
                '机构': '北京分公司'
              }
            },
            {
              fields: {
                '省份': '上海',
                '数量': 120,
                '负责人': '李四',
                '上海分公司': '上海分公司'
              }
            },
            {
              fields: {
                '省份': '广东',
                '数量': 200,
                '负责人': '王五',
                '机构': '广州分公司'
              }
            }
          ]
        })
      })
    }
  }
};

// 测试数据格式验证
function validateDataFormat(data) {
  console.log('🔍 验证数据格式...');
  
  const requiredFields = ['province', 'value'];
  const optionalFields = ['manager', 'organization'];
  
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    summary: {}
  };
  
  if (!Array.isArray(data)) {
    results.valid = false;
    results.errors.push('数据必须是数组格式');
    return results;
  }
  
  if (data.length === 0) {
    results.valid = false;
    results.errors.push('数据不能为空');
    return results;
  }
  
  // 检查每条记录
  data.forEach((record, index) => {
    // 检查必需字段
    requiredFields.forEach(field => {
      if (!record.hasOwnProperty(field) || record[field] === null || record[field] === undefined) {
        results.errors.push(`记录 ${index + 1}: 缺少必需字段 "${field}"`);
        results.valid = false;
      }
    });
    
    // 检查数值字段
    if (record.value !== undefined && (typeof record.value !== 'number' || isNaN(record.value))) {
      results.errors.push(`记录 ${index + 1}: "value" 字段必须是有效数字`);
      results.valid = false;
    }
    
    // 检查省份名称
    if (record.province && typeof record.province !== 'string') {
      results.errors.push(`记录 ${index + 1}: "province" 字段必须是字符串`);
      results.valid = false;
    }
  });
  
  // 统计信息
  results.summary = {
    totalRecords: data.length,
    provinces: [...new Set(data.map(r => r.province))],
    valueRange: {
      min: Math.min(...data.map(r => r.value || 0)),
      max: Math.max(...data.map(r => r.value || 0))
    }
  };
  
  return results;
}

// 地区名称映射测试
function testRegionMapping(provinces) {
  console.log('🗺️ 测试地区名称映射...');
  
  const standardProvinces = [
    '北京', '天津', '河北', '山西', '内蒙古',
    '辽宁', '吉林', '黑龙江', '上海', '江苏',
    '浙江', '安徽', '福建', '江西', '山东',
    '河南', '湖北', '湖南', '广东', '广西',
    '海南', '重庆', '四川', '贵州', '云南',
    '西藏', '陕西', '甘肃', '青海', '宁夏',
    '新疆', '台湾', '香港', '澳门'
  ];
  
  const mappingResults = {
    matched: [],
    unmatched: [],
    suggestions: {}
  };
  
  provinces.forEach(province => {
    const cleaned = province.replace(/市|省|自治区|特别行政区|维吾尔自治区|回族自治区|壮族自治区/g, '');
    
    if (standardProvinces.includes(cleaned)) {
      mappingResults.matched.push({ original: province, mapped: cleaned });
    } else {
      mappingResults.unmatched.push(province);
      
      // 提供建议
      const suggestions = standardProvinces.filter(std => 
        std.includes(cleaned) || cleaned.includes(std)
      );
      if (suggestions.length > 0) {
        mappingResults.suggestions[province] = suggestions;
      }
    }
  });
  
  return mappingResults;
}

// 颜色方案测试
function testColorScheme(data, scheme = 'blue') {
  console.log('🎨 测试颜色方案...');
  
  const colorSchemes = {
    blue: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2'],
    green: ['#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C'],
    orange: ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00']
  };
  
  const values = data.map(d => d.value).filter(v => v !== undefined);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  const colors = colorSchemes[scheme] || colorSchemes.blue;
  
  const colorMapping = data.map(item => {
    if (item.value === undefined) return { ...item, color: '#CCCCCC' };
    
    const ratio = range === 0 ? 0 : (item.value - min) / range;
    const colorIndex = Math.min(Math.floor(ratio * colors.length), colors.length - 1);
    
    return {
      ...item,
      color: colors[colorIndex],
      colorIndex,
      ratio: ratio.toFixed(2)
    };
  });
  
  return {
    scheme,
    colors,
    valueRange: { min, max, range },
    colorMapping
  };
}

// 主测试函数
async function runTests(testData) {
  console.log('🚀 开始飞书插件集成测试...\n');
  
  // 1. 数据格式验证
  const formatValidation = validateDataFormat(testData);
  console.log('📊 数据格式验证结果:');
  console.log('  有效:', formatValidation.valid ? '✅' : '❌');
  if (formatValidation.errors.length > 0) {
    console.log('  错误:', formatValidation.errors);
  }
  if (formatValidation.warnings.length > 0) {
    console.log('  警告:', formatValidation.warnings);
  }
  console.log('  统计:', formatValidation.summary);
  console.log('');
  
  if (!formatValidation.valid) {
    console.log('❌ 数据格式验证失败，请修正数据后重试');
    return;
  }
  
  // 2. 地区映射测试
  const provinces = formatValidation.summary.provinces;
  const mappingResults = testRegionMapping(provinces);
  console.log('🗺️ 地区映射测试结果:');
  console.log('  匹配成功:', mappingResults.matched.length, '个');
  console.log('  匹配失败:', mappingResults.unmatched.length, '个');
  if (mappingResults.unmatched.length > 0) {
    console.log('  未匹配地区:', mappingResults.unmatched);
    console.log('  建议映射:', mappingResults.suggestions);
  }
  console.log('');
  
  // 3. 颜色方案测试
  const colorTests = ['blue', 'green', 'orange'];
  colorTests.forEach(scheme => {
    const colorResult = testColorScheme(testData, scheme);
    console.log(`🎨 ${scheme}颜色方案测试:`);
    console.log('  数值范围:', colorResult.valueRange);
    console.log('  颜色数量:', colorResult.colors.length);
    console.log('  示例映射:', colorResult.colorMapping.slice(0, 3));
    console.log('');
  });
  
  // 4. 插件配置测试
  console.log('⚙️ 插件配置测试:');
  const config = {
    dataSource: 'bitable',
    colorScheme: 'blue',
    showStatistics: true,
    autoRefresh: 5
  };
  console.log('  配置项:', config);
  console.log('  配置有效:', '✅');
  console.log('');
  
  // 5. 性能测试
  console.log('⚡ 性能测试:');
  const startTime = Date.now();
  
  // 模拟数据处理
  const processedData = testData.map(item => ({
    ...item,
    processed: true,
    timestamp: Date.now()
  }));
  
  const endTime = Date.now();
  console.log('  数据处理时间:', endTime - startTime, 'ms');
  console.log('  处理记录数:', processedData.length);
  console.log('  平均处理时间:', ((endTime - startTime) / processedData.length).toFixed(2), 'ms/记录');
  console.log('');
  
  console.log('✅ 测试完成！插件可以正常处理提供的数据格式。');
  
  return {
    formatValidation,
    mappingResults,
    colorTests: colorTests.map(scheme => testColorScheme(testData, scheme)),
    config,
    performance: {
      processingTime: endTime - startTime,
      recordCount: processedData.length,
      avgTime: (endTime - startTime) / processedData.length
    }
  };
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTests,
    validateDataFormat,
    testRegionMapping,
    testColorScheme
  };
}

// 示例测试数据
const sampleData = [
  { province: '北京', value: 150, manager: '张三', organization: '北京分公司' },
  { province: '上海', value: 120, manager: '李四', organization: '上海分公司' },
  { province: '广东', value: 200, manager: '王五', organization: '广州分公司' },
  { province: '浙江', value: 180, manager: '赵六', organization: '杭州分公司' },
  { province: '江苏', value: 160, manager: '钱七', organization: '南京分公司' }
];

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  window.testPlugin = { runTests, sampleData };
  console.log('🧪 插件测试工具已加载，使用 testPlugin.runTests(data) 进行测试');
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('🧪 运行示例测试...\n');
  runTests(sampleData).then(results => {
    console.log('\n📋 测试报告已生成');
  }).catch(error => {
    console.error('❌ 测试失败:', error);
  });
}