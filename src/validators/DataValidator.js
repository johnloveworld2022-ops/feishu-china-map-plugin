/**
 * 数据验证器 - 验证从多维表格获取的数据格式和完整性
 */
export class DataValidator {
  constructor() {
    // 预定义的中国区域列表
    this.validRegions = [
      '华北', '华东', '华南', '华中', '西南', '西北', '东北',
      '北京', '天津', '河北', '山西', '内蒙古',
      '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
      '广东', '广西', '海南',
      '河南', '湖北', '湖南',
      '重庆', '四川', '贵州', '云南', '西藏',
      '陕西', '甘肃', '青海', '宁夏', '新疆',
      '辽宁', '吉林', '黑龙江'
    ]

    // 必需字段配置
    this.requiredFields = {
      '机构': { type: 'string', required: true },
      '所属区域': { type: 'string', required: true },
      '所属省份': { type: 'string', required: false },
      '负责人': { type: 'string', required: false }
    }
  }

  /**
   * 验证数据结构
   * @param {Array} records - 记录数组
   * @returns {Object} 验证结果
   */
  validateDataStructure(records) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        emptyRecords: 0
      }
    }

    if (!Array.isArray(records)) {
      result.isValid = false
      result.errors.push('数据不是数组格式')
      return result
    }

    if (records.length === 0) {
      result.warnings.push('数据为空')
      return result
    }

    result.summary.totalRecords = records.length

    records.forEach((record, index) => {
      const recordValidation = this._validateSingleRecord(record, index)
      
      if (recordValidation.isValid) {
        result.summary.validRecords++
      } else {
        result.summary.invalidRecords++
        result.errors.push(...recordValidation.errors)
      }

      if (recordValidation.isEmpty) {
        result.summary.emptyRecords++
      }

      result.warnings.push(...recordValidation.warnings)
    })

    // 如果有无效记录，整体验证失败
    if (result.summary.invalidRecords > 0) {
      result.isValid = false
    }

    return result
  }

  /**
   * 检查必需字段
   * @param {Array} records - 记录数组
   * @param {Object} mapping - 字段映射配置
   * @returns {Object} 检查结果
   */
  checkRequiredFields(records, mapping = {}) {
    const result = {
      isValid: true,
      missingFields: [],
      fieldStats: {},
      recommendations: []
    }

    if (!Array.isArray(records) || records.length === 0) {
      result.isValid = false
      result.missingFields.push('无有效数据记录')
      return result
    }

    // 获取实际的字段映射
    const fieldMapping = {
      regionField: mapping.regionField || '所属区域',
      valueField: mapping.valueField || '机构',
      provinceField: mapping.provinceField || '所属省份',
      managerField: mapping.managerField || '负责人'
    }

    // 统计字段出现情况
    const fieldCounts = {}
    const totalRecords = records.length

    records.forEach(record => {
      const fields = record.fields || {}
      
      Object.values(fieldMapping).forEach(fieldName => {
        if (!fieldCounts[fieldName]) {
          fieldCounts[fieldName] = { present: 0, missing: 0, empty: 0 }
        }

        if (fields.hasOwnProperty(fieldName)) {
          if (fields[fieldName] && fields[fieldName].toString().trim() !== '') {
            fieldCounts[fieldName].present++
          } else {
            fieldCounts[fieldName].empty++
          }
        } else {
          fieldCounts[fieldName].missing++
        }
      })
    })

    // 分析字段完整性
    Object.entries(fieldCounts).forEach(([fieldName, stats]) => {
      const completeness = (stats.present / totalRecords) * 100
      
      result.fieldStats[fieldName] = {
        ...stats,
        completeness: Math.round(completeness * 100) / 100,
        total: totalRecords
      }

      // 检查必需字段
      if (fieldName === fieldMapping.regionField || fieldName === fieldMapping.valueField) {
        if (completeness < 90) {
          result.isValid = false
          result.missingFields.push(`${fieldName} (完整度: ${completeness.toFixed(1)}%)`)
        }
      }

      // 生成建议
      if (completeness < 50) {
        result.recommendations.push(`建议检查字段 "${fieldName}" 的数据完整性`)
      } else if (completeness < 90) {
        result.recommendations.push(`字段 "${fieldName}" 存在部分缺失数据`)
      }
    })

    return result
  }

  /**
   * 验证地理位置数据
   * @param {Array} records - 记录数组
   * @returns {Object} 验证结果
   */
  validateGeographicData(records) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      regionStats: {},
      unknownRegions: [],
      suggestions: []
    }

    if (!Array.isArray(records) || records.length === 0) {
      result.isValid = false
      result.errors.push('无有效数据记录')
      return result
    }

    const regionField = '所属区域'
    const provinceField = '所属省份'

    records.forEach((record, index) => {
      const fields = record.fields || {}
      const region = fields[regionField]
      const province = fields[provinceField]

      // 验证区域字段
      if (region) {
        const regionStr = region.toString().trim()
        
        if (!result.regionStats[regionStr]) {
          result.regionStats[regionStr] = 0
        }
        result.regionStats[regionStr]++

        // 检查区域是否在预定义列表中
        if (!this.validRegions.includes(regionStr)) {
          if (!result.unknownRegions.includes(regionStr)) {
            result.unknownRegions.push(regionStr)
            result.warnings.push(`未知区域: "${regionStr}"`)
          }
        }
      } else {
        result.errors.push(`记录 ${index + 1}: 缺少区域信息`)
      }

      // 验证省份字段（如果存在）
      if (province) {
        const provinceStr = province.toString().trim()
        if (!this.validRegions.includes(provinceStr)) {
          result.warnings.push(`记录 ${index + 1}: 可能的无效省份 "${provinceStr}"`)
        }
      }
    })

    // 生成建议
    if (result.unknownRegions.length > 0) {
      result.suggestions.push('建议检查以下区域名称是否正确: ' + result.unknownRegions.join(', '))
    }

    if (Object.keys(result.regionStats).length < 3) {
      result.suggestions.push('数据覆盖的区域较少，建议增加更多区域的数据')
    }

    // 如果有严重错误，标记为无效
    if (result.errors.length > records.length * 0.1) { // 超过10%的记录有错误
      result.isValid = false
    }

    return result
  }

  /**
   * 生成数据质量报告
   * @param {Array} records - 记录数组
   * @returns {Object} 数据质量报告
   */
  generateDataQualityReport(records) {
    const report = {
      timestamp: new Date().toISOString(),
      overview: {
        totalRecords: 0,
        validRecords: 0,
        dataQualityScore: 0
      },
      structureValidation: null,
      fieldValidation: null,
      geographicValidation: null,
      recommendations: [],
      summary: ''
    }

    if (!Array.isArray(records)) {
      report.summary = '❌ 数据格式错误：不是有效的数组'
      return report
    }

    report.overview.totalRecords = records.length

    if (records.length === 0) {
      report.summary = '⚠️ 数据为空，无法生成质量报告'
      return report
    }

    // 执行各项验证
    report.structureValidation = this.validateDataStructure(records)
    report.fieldValidation = this.checkRequiredFields(records)
    report.geographicValidation = this.validateGeographicData(records)

    // 计算有效记录数
    report.overview.validRecords = report.structureValidation.summary.validRecords

    // 计算数据质量分数 (0-100)
    const structureScore = report.structureValidation.isValid ? 40 : 0
    const fieldScore = report.fieldValidation.isValid ? 30 : 0
    const geoScore = report.geographicValidation.isValid ? 30 : 0
    
    report.overview.dataQualityScore = structureScore + fieldScore + geoScore

    // 收集所有建议
    report.recommendations = [
      ...report.fieldValidation.recommendations,
      ...report.geographicValidation.suggestions
    ]

    // 生成总结
    report.summary = this._generateQualitySummary(report)

    return report
  }

  /**
   * 验证单条记录
   * @private
   */
  _validateSingleRecord(record, index) {
    const result = {
      isValid: true,
      isEmpty: false,
      errors: [],
      warnings: []
    }

    // 检查记录基本结构
    if (!record || typeof record !== 'object') {
      result.isValid = false
      result.errors.push(`记录 ${index + 1}: 不是有效的对象`)
      return result
    }

    // 检查是否有 fields 字段
    if (!record.fields || typeof record.fields !== 'object') {
      result.isValid = false
      result.errors.push(`记录 ${index + 1}: 缺少 fields 字段`)
      return result
    }

    const fields = record.fields
    const fieldKeys = Object.keys(fields)

    // 检查是否为空记录
    if (fieldKeys.length === 0) {
      result.isEmpty = true
      result.warnings.push(`记录 ${index + 1}: 字段为空`)
      return result
    }

    // 验证必需字段
    Object.entries(this.requiredFields).forEach(([fieldName, config]) => {
      if (config.required && !fields.hasOwnProperty(fieldName)) {
        result.isValid = false
        result.errors.push(`记录 ${index + 1}: 缺少必需字段 "${fieldName}"`)
      } else if (fields.hasOwnProperty(fieldName)) {
        const value = fields[fieldName]
        
        // 检查字段类型
        if (config.type === 'string' && typeof value !== 'string') {
          result.warnings.push(`记录 ${index + 1}: 字段 "${fieldName}" 类型不正确`)
        }

        // 检查字段是否为空
        if (config.required && (!value || value.toString().trim() === '')) {
          result.isValid = false
          result.errors.push(`记录 ${index + 1}: 必需字段 "${fieldName}" 为空`)
        }
      }
    })

    return result
  }

  /**
   * 生成质量总结
   * @private
   */
  _generateQualitySummary(report) {
    const { totalRecords, validRecords, dataQualityScore } = report.overview
    const validPercentage = totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 0

    let summary = ''
    
    if (dataQualityScore >= 90) {
      summary = `✅ 数据质量优秀 (${dataQualityScore}分)`
    } else if (dataQualityScore >= 70) {
      summary = `⚠️ 数据质量良好 (${dataQualityScore}分)`
    } else if (dataQualityScore >= 50) {
      summary = `⚠️ 数据质量一般 (${dataQualityScore}分)`
    } else {
      summary = `❌ 数据质量较差 (${dataQualityScore}分)`
    }

    summary += ` - 总记录数: ${totalRecords}, 有效记录: ${validRecords} (${validPercentage}%)`

    if (report.recommendations.length > 0) {
      summary += `, 建议改进 ${report.recommendations.length} 项`
    }

    return summary
  }

  /**
   * 获取数据清洗建议
   * @param {Array} records - 记录数组
   * @returns {Array} 清洗建议列表
   */
  getDataCleaningSuggestions(records) {
    const suggestions = []
    
    if (!Array.isArray(records) || records.length === 0) {
      return ['无有效数据，请检查数据源']
    }

    const report = this.generateDataQualityReport(records)
    
    // 基于验证结果生成具体建议
    if (!report.structureValidation.isValid) {
      suggestions.push('修复数据结构问题：确保所有记录都有正确的 fields 字段')
    }

    if (!report.fieldValidation.isValid) {
      suggestions.push('补充缺失的必需字段：' + report.fieldValidation.missingFields.join(', '))
    }

    if (report.geographicValidation.unknownRegions.length > 0) {
      suggestions.push('标准化区域名称：' + report.geographicValidation.unknownRegions.join(', '))
    }

    if (suggestions.length === 0) {
      suggestions.push('数据质量良好，无需特殊处理')
    }

    return suggestions
  }
}