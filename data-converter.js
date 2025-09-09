/**
 * 多维表格数据转换工具
 * 将飞书多维表格数据转换为插件所需格式
 */

class DataConverter {
  constructor() {
    // 省份名称标准化映射
    this.provinceMapping = {
      '北京市': '北京',
      '天津市': '天津',
      '河北省': '河北',
      '山西省': '山西',
      '内蒙古自治区': '内蒙古',
      '辽宁省': '辽宁',
      '吉林省': '吉林',
      '黑龙江省': '黑龙江',
      '上海市': '上海',
      '江苏省': '江苏',
      '浙江省': '浙江',
      '安徽省': '安徽',
      '福建省': '福建',
      '江西省': '江西',
      '山东省': '山东',
      '河南省': '河南',
      '湖北省': '湖北',
      '湖南省': '湖南',
      '广东省': '广东',
      '广西壮族自治区': '广西',
      '海南省': '海南',
      '重庆市': '重庆',
      '四川省': '四川',
      '贵州省': '贵州',
      '云南省': '云南',
      '西藏自治区': '西藏',
      '陕西省': '陕西',
      '甘肃省': '甘肃',
      '青海省': '青海',
      '宁夏回族自治区': '宁夏',
      '新疆维吾尔自治区': '新疆',
      '台湾省': '台湾',
      '香港特别行政区': '香港',
      '澳门特别行政区': '澳门'
    };
  }

  /**
   * 标准化省份名称
   */
  normalizeProvinceName(name) {
    if (!name) return null;
    
    // 直接映射
    if (this.provinceMapping[name]) {
      return this.provinceMapping[name];
    }
    
    // 移除常见后缀
    const cleaned = name.replace(/市|省|自治区|特别行政区|维吾尔自治区|回族自治区|壮族自治区/g, '');
    
    // 特殊处理
    const specialMappings = {
      '内蒙': '内蒙古',
      '广西': '广西',
      '西藏': '西藏',
      '宁夏': '宁夏',
      '新疆': '新疆'
    };
    
    return specialMappings[cleaned] || cleaned;
  }

  /**
   * 转换飞书多维表格数据
   */
  convertBitableData(records, fieldMapping) {
    console.log('🔄 开始转换多维表格数据...');
    
    const {
      provinceField = '省份',
      valueField = '数量',
      managerField = '负责人',
      organizationField = '机构'
    } = fieldMapping;

    const convertedData = [];
    const errors = [];

    records.forEach((record, index) => {
      try {
        const fields = record.fields || record;
        
        // 提取省份
        const rawProvince = fields[provinceField];
        const province = this.normalizeProvinceName(rawProvince);
        
        if (!province) {
          errors.push(`记录 ${index + 1}: 省份字段 "${provinceField}" 为空或无效`);
          return;
        }

        // 提取数值
        const rawValue = fields[valueField];
        const value = this.parseNumber(rawValue);
        
        if (value === null) {
          errors.push(`记录 ${index + 1}: 数值字段 "${valueField}" 无效: ${rawValue}`);
          return;
        }

        // 构建转换后的记录
        const convertedRecord = {
          province,
          value,
          originalProvince: rawProvince
        };

        // 添加可选字段
        if (managerField && fields[managerField]) {
          convertedRecord.manager = fields[managerField];
        }

        if (organizationField && fields[organizationField]) {
          convertedRecord.organization = fields[organizationField];
        }

        // 添加其他字段
        Object.keys(fields).forEach(key => {
          if (![provinceField, valueField, managerField, organizationField].includes(key)) {
            convertedRecord[key] = fields[key];
          }
        });

        convertedData.push(convertedRecord);

      } catch (error) {
        errors.push(`记录 ${index + 1}: 转换失败 - ${error.message}`);
      }
    });

    console.log(`✅ 转换完成: ${convertedData.length}/${records.length} 条记录成功`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} 条记录转换失败:`);
      errors.forEach(error => console.log(`  - ${error}`));
    }

    return {
      data: convertedData,
      errors,
      summary: {
        total: records.length,
        success: convertedData.length,
        failed: errors.length,
        provinces: [...new Set(convertedData.map(r => r.province))],
        valueRange: this.getValueRange(convertedData)
      }
    };
  }

  /**
   * 解析数字
   */
  parseNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }

    if (typeof value === 'string') {
      // 移除常见的非数字字符
      const cleaned = value.replace(/[,，\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  /**
   * 获取数值范围
   */
  getValueRange(data) {
    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);
    
    if (values.length === 0) {
      return { min: 0, max: 0, range: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
      min,
      max,
      range: max - min,
      average: values.reduce((sum, v) => sum + v, 0) / values.length
    };
  }

  /**
   * 转换CSV数据
   */
  convertCSVData(csvText, fieldMapping) {
    console.log('🔄 开始转换CSV数据...');
    
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV数据至少需要包含标题行和一行数据');
    }

    // 解析标题行
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // 解析数据行
    const records = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      return record;
    });

    return this.convertBitableData(records, fieldMapping);
  }

  /**
   * 生成测试数据
   */
  generateTestData(count = 10) {
    const provinces = ['北京', '上海', '广东', '浙江', '江苏', '山东', '河南', '四川', '湖北', '福建'];
    const managers = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    const organizations = ['分公司', '办事处', '营业部', '服务中心'];

    const testData = [];
    
    for (let i = 0; i < count; i++) {
      const province = provinces[i % provinces.length];
      const manager = managers[Math.floor(Math.random() * managers.length)];
      const orgType = organizations[Math.floor(Math.random() * organizations.length)];
      
      testData.push({
        province,
        value: Math.floor(Math.random() * 200) + 50,
        manager,
        organization: `${province}${orgType}`
      });
    }

    return testData;
  }

  /**
   * 验证转换结果
   */
  validateResult(result) {
    const { data, errors, summary } = result;
    
    const validation = {
      valid: true,
      issues: [],
      recommendations: []
    };

    // 检查成功率
    const successRate = summary.success / summary.total;
    if (successRate < 0.8) {
      validation.valid = false;
      validation.issues.push(`转换成功率过低: ${(successRate * 100).toFixed(1)}%`);
    }

    // 检查省份覆盖
    if (summary.provinces.length < 3) {
      validation.recommendations.push('建议增加更多省份的数据以获得更好的可视化效果');
    }

    // 检查数值范围
    if (summary.valueRange.range === 0) {
      validation.recommendations.push('所有数值相同，建议提供有差异的数据以显示颜色变化');
    }

    return validation;
  }
}

// 使用示例
function demonstrateUsage() {
  console.log('📚 数据转换工具使用示例\n');
  
  const converter = new DataConverter();

  // 示例1: 转换多维表格数据
  console.log('示例1: 多维表格数据转换');
  const bitableData = [
    { fields: { '省份': '北京市', '机构数量': '150', '负责人': '张三', '机构': '北京分公司' } },
    { fields: { '省份': '上海市', '机构数量': '120', '负责人': '李四', '机构': '上海分公司' } },
    { fields: { '省份': '广东省', '机构数量': '200', '负责人': '王五', '机构': '广州分公司' } }
  ];

  const fieldMapping = {
    provinceField: '省份',
    valueField: '机构数量',
    managerField: '负责人',
    organizationField: '机构'
  };

  const result1 = converter.convertBitableData(bitableData, fieldMapping);
  console.log('转换结果:', result1);
  console.log('');

  // 示例2: 转换CSV数据
  console.log('示例2: CSV数据转换');
  const csvData = `省份,数量,负责人,机构
北京,150,张三,北京分公司
上海,120,李四,上海分公司
广东,200,王五,广州分公司`;

  const result2 = converter.convertCSVData(csvData, fieldMapping);
  console.log('转换结果:', result2);
  console.log('');

  // 示例3: 生成测试数据
  console.log('示例3: 生成测试数据');
  const testData = converter.generateTestData(5);
  console.log('测试数据:', testData);
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataConverter;
}

// 如果直接运行
if (require.main === module) {
  demonstrateUsage();
}