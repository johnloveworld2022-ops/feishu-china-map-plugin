/**
 * 数据预览器 - 在界面上展示多维表格数据的预览信息
 */
export class DataPreviewer {
  constructor() {
    this.container = null
    this.currentData = null
    this.viewMode = 'map' // map, summary, table, chart
    this.pageSize = 10
    this.currentPage = 0
    this.mapRenderer = null
  }

  /**
   * 初始化预览器
   * @param {string} containerId - 预览容器的ID
   */
  init(containerId) {
    this.container = document.getElementById(containerId)
    if (!this.container) {
      console.warn(`[DataPreviewer] 找不到预览容器: ${containerId}`)
    }
  }

  /**
   * 渲染数据预览
   * @param {Array} records - 记录数组
   * @param {Object} container - 容器元素
   * @param {Object} options - 渲染选项
   */
  renderPreview(records, container = null, options = {}) {
    const targetContainer = container || this.container
    if (!targetContainer) {
      console.warn('[DataPreviewer] 没有可用的容器')
      return
    }

    this.currentData = records
    const {
      title = '数据预览',
      showControls = true,
      showStats = true,
      showQuality = true
    } = options

    if (!records || !Array.isArray(records)) {
      this._renderError(targetContainer, '无效的数据格式')
      return
    }

    if (records.length === 0) {
      this._renderEmpty(targetContainer, '暂无数据')
      return
    }

    // 生成完整的预览HTML
    const previewHtml = this._generatePreviewHtml(records, {
      title,
      showControls,
      showStats,
      showQuality
    })

    targetContainer.innerHTML = previewHtml

    // 绑定事件监听器
    if (showControls) {
      this._bindEventListeners(targetContainer)
    }
  }

  /**
   * 显示数据统计信息
   * @param {Array} records - 记录数组
   * @returns {Object} 统计信息
   */
  showDataStats(records) {
    if (!records || !Array.isArray(records)) {
      return { error: '无效数据' }
    }

    const stats = {
      totalRecords: records.length,
      fields: {},
      regions: {},
      dataTypes: {},
      completeness: {}
    }

    // 分析字段和数据类型
    records.forEach(record => {
      const fields = record.fields || {}
      
      Object.entries(fields).forEach(([fieldName, value]) => {
        // 统计字段出现次数
        stats.fields[fieldName] = (stats.fields[fieldName] || 0) + 1
        
        // 统计数据类型
        const type = typeof value
        if (!stats.dataTypes[fieldName]) {
          stats.dataTypes[fieldName] = {}
        }
        stats.dataTypes[fieldName][type] = (stats.dataTypes[fieldName][type] || 0) + 1
        
        // 统计区域分布（如果是区域字段）
        if (fieldName === '所属区域' && value) {
          stats.regions[value] = (stats.regions[value] || 0) + 1
        }
      })
    })

    // 计算字段完整性
    Object.keys(stats.fields).forEach(fieldName => {
      stats.completeness[fieldName] = Math.round(
        (stats.fields[fieldName] / records.length) * 100
      )
    })

    return stats
  }

  /**
   * 显示字段信息
   * @param {Object} schema - 表格结构信息
   * @returns {string} 字段信息HTML
   */
  showFieldInfo(schema) {
    if (!schema || !schema.fields) {
      return '<p>无字段信息</p>'
    }

    const fieldsHtml = schema.fields.map(field => `
      <div class="field-info-item">
        <span class="field-name">${field.field_name}</span>
        <span class="field-type">${field.field_type}</span>
      </div>
    `).join('')

    return `
      <div class="field-info">
        <h5>字段信息</h5>
        ${fieldsHtml}
      </div>
    `
  }

  /**
   * 清空预览内容
   */
  clearPreview() {
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.currentData = null
  }

  /**
   * 设置地图渲染器
   * @param {Object} mapRenderer - 地图渲染器实例
   */
  setMapRenderer(mapRenderer) {
    this.mapRenderer = mapRenderer
  }

  /**
   * 切换视图模式
   * @param {string} mode - 视图模式: map, summary, table, chart
   */
  switchViewMode(mode) {
    if (['map', 'summary', 'table', 'chart'].includes(mode)) {
      this.viewMode = mode
      if (this.currentData) {
        this.renderPreview(this.currentData)
      }
    }
  }

  /**
   * 导出数据
   * @param {string} format - 导出格式: json, csv
   * @returns {string} 导出的数据
   */
  exportData(format = 'json') {
    if (!this.currentData) {
      return null
    }

    switch (format) {
      case 'json':
        return JSON.stringify(this.currentData, null, 2)
      
      case 'csv':
        return this._convertToCSV(this.currentData)
      
      default:
        return null
    }
  }

  /**
   * 生成预览HTML
   * @private
   */
  _generatePreviewHtml(records, options) {
    const { title, showControls, showStats, showQuality } = options
    
    // 生成控制面板
    const controlsHtml = showControls ? `
      <div class="preview-controls">
        <div class="view-modes">
          <button class="view-mode-btn ${this.viewMode === 'summary' ? 'active' : ''}" data-mode="summary">概览</button>
          <button class="view-mode-btn ${this.viewMode === 'table' ? 'active' : ''}" data-mode="table">表格</button>
          <button class="view-mode-btn ${this.viewMode === 'chart' ? 'active' : ''}" data-mode="chart">图表</button>
        </div>
        <div class="preview-actions">
          <button class="export-btn" data-format="json">导出JSON</button>
          <button class="export-btn" data-format="csv">导出CSV</button>
          <button class="refresh-btn">刷新</button>
        </div>
      </div>
    ` : ''

    // 生成统计信息
    const statsHtml = showStats ? this._generateStatsHtml(records) : ''

    // 生成主要内容
    let contentHtml = ''
    switch (this.viewMode) {
      case 'summary':
        contentHtml = this._generateSummaryView(records)
        break
      case 'table':
        contentHtml = this._generateTableView(records)
        break
      case 'chart':
        contentHtml = this._generateChartView(records)
        break
    }

    return `
      <div class="data-preview">
        <div class="preview-header">
          <h3>${title}</h3>
          ${controlsHtml}
        </div>
        ${statsHtml}
        <div class="preview-content">
          ${contentHtml}
        </div>
      </div>
    `
  }

  /**
   * 生成统计信息HTML
   * @private
   */
  _generateStatsHtml(records) {
    const stats = this.showDataStats(records)
    const regionCount = Object.keys(stats.regions).length
    
    return `
      <div class="preview-stats">
        <div class="stat-item">
          <span class="stat-label">总记录数</span>
          <span class="stat-value">${stats.totalRecords}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">字段数</span>
          <span class="stat-value">${Object.keys(stats.fields).length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">区域数</span>
          <span class="stat-value">${regionCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">数据完整性</span>
          <span class="stat-value">${this._calculateOverallCompleteness(stats.completeness)}%</span>
        </div>
      </div>
    `
  }

  /**
   * 生成概览视图
   * @private
   */
  _generateSummaryView(records) {
    const stats = this.showDataStats(records)
    
    // 生成区域分布
    const regionStatsHtml = Object.entries(stats.regions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // 只显示前10个区域
      .map(([region, count]) => `
        <div class="region-item">
          <span class="region-name">${region}</span>
          <div class="region-bar">
            <div class="region-fill" style="width: ${(count / Math.max(...Object.values(stats.regions))) * 100}%"></div>
          </div>
          <span class="region-count">${count}</span>
        </div>
      `).join('')

    // 生成字段完整性
    const fieldCompletenessHtml = Object.entries(stats.completeness)
      .map(([fieldName, completeness]) => `
        <div class="field-completeness-item">
          <span class="field-name">${fieldName}</span>
          <div class="completeness-bar">
            <div class="completeness-fill" style="width: ${completeness}%"></div>
          </div>
          <span class="completeness-value">${completeness}%</span>
        </div>
      `).join('')

    return `
      <div class="summary-view">
        <div class="summary-section">
          <h4>区域分布</h4>
          <div class="region-stats">
            ${regionStatsHtml}
          </div>
        </div>
        
        <div class="summary-section">
          <h4>字段完整性</h4>
          <div class="field-completeness">
            ${fieldCompletenessHtml}
          </div>
        </div>
      </div>
    `
  }

  /**
   * 生成表格视图
   * @private
   */
  _generateTableView(records) {
    if (records.length === 0) {
      return '<p>暂无数据</p>'
    }

    // 获取所有字段名
    const allFields = new Set()
    records.forEach(record => {
      Object.keys(record.fields || {}).forEach(field => allFields.add(field))
    })
    const fieldNames = Array.from(allFields)

    // 计算分页
    const totalPages = Math.ceil(records.length / this.pageSize)
    const startIndex = this.currentPage * this.pageSize
    const endIndex = Math.min(startIndex + this.pageSize, records.length)
    const pageRecords = records.slice(startIndex, endIndex)

    // 生成表头
    const headerHtml = fieldNames.map(field => `<th>${field}</th>`).join('')

    // 生成表格行
    const rowsHtml = pageRecords.map((record, index) => {
      const cellsHtml = fieldNames.map(field => {
        const value = record.fields?.[field] || ''
        return `<td title="${value}">${this._truncateText(value, 30)}</td>`
      }).join('')
      
      return `<tr data-index="${startIndex + index}">${cellsHtml}</tr>`
    }).join('')

    // 生成分页控件
    const paginationHtml = totalPages > 1 ? `
      <div class="pagination">
        <button class="page-btn" data-page="prev" ${this.currentPage === 0 ? 'disabled' : ''}>上一页</button>
        <span class="page-info">第 ${this.currentPage + 1} 页，共 ${totalPages} 页</span>
        <button class="page-btn" data-page="next" ${this.currentPage >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
      </div>
    ` : ''

    return `
      <div class="table-view">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>${headerHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
        ${paginationHtml}
      </div>
    `
  }

  /**
   * 生成图表视图
   * @private
   */
  _generateChartView(records) {
    const stats = this.showDataStats(records)
    
    // 生成区域分布饼图数据
    const regionData = Object.entries(stats.regions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8) // 只显示前8个区域

    const chartHtml = `
      <div class="chart-view">
        <div class="chart-container">
          <h4>区域分布图</h4>
          <div class="pie-chart" id="region-pie-chart">
            ${this._generatePieChart(regionData)}
          </div>
        </div>
        
        <div class="chart-legend">
          ${regionData.map(([region, count], index) => `
            <div class="legend-item">
              <span class="legend-color" style="background-color: ${this._getChartColor(index)}"></span>
              <span class="legend-label">${region}</span>
              <span class="legend-value">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `

    return chartHtml
  }

  /**
   * 生成简单的饼图
   * @private
   */
  _generatePieChart(data) {
    const total = data.reduce((sum, [, count]) => sum + count, 0)
    let currentAngle = 0
    
    const segments = data.map(([region, count], index) => {
      const percentage = (count / total) * 100
      const angle = (count / total) * 360
      const largeArcFlag = angle > 180 ? 1 : 0
      
      const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180)
      const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180)
      
      currentAngle += angle
      
      const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180)
      const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180)
      
      const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
      
      return `
        <path d="${pathData}" 
              fill="${this._getChartColor(index)}" 
              stroke="white" 
              stroke-width="1"
              title="${region}: ${count} (${percentage.toFixed(1)}%)">
        </path>
      `
    }).join('')

    return `
      <svg viewBox="0 0 100 100" class="pie-chart-svg">
        ${segments}
      </svg>
    `
  }

  /**
   * 绑定事件监听器
   * @private
   */
  _bindEventListeners(container) {
    // 视图模式切换
    container.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode
        this.switchViewMode(mode)
      })
    })

    // 导出功能
    container.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const format = e.target.dataset.format
        const data = this.exportData(format)
        if (data) {
          this._downloadData(data, `data.${format}`)
        }
      })
    })

    // 分页控制
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.page
        if (action === 'prev' && this.currentPage > 0) {
          this.currentPage--
        } else if (action === 'next') {
          const totalPages = Math.ceil(this.currentData.length / this.pageSize)
          if (this.currentPage < totalPages - 1) {
            this.currentPage++
          }
        }
        this.renderPreview(this.currentData)
      })
    })

    // 刷新功能
    const refreshBtn = container.querySelector('.refresh-btn')
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (this.currentData) {
          this.renderPreview(this.currentData)
        }
      })
    }
  }

  /**
   * 渲染错误信息
   * @private
   */
  _renderError(container, message) {
    container.innerHTML = `
      <div class="preview-error">
        <h3>❌ 预览错误</h3>
        <p>${message}</p>
      </div>
    `
  }

  /**
   * 渲染空数据提示
   * @private
   */
  _renderEmpty(container, message) {
    container.innerHTML = `
      <div class="preview-empty">
        <h3>📭 ${message}</h3>
        <p>请检查数据源或重新加载数据</p>
      </div>
    `
  }

  /**
   * 计算总体完整性
   * @private
   */
  _calculateOverallCompleteness(completeness) {
    const values = Object.values(completeness)
    if (values.length === 0) return 0
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
  }

  /**
   * 截断文本
   * @private
   */
  _truncateText(text, maxLength) {
    if (!text) return ''
    const str = text.toString()
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
  }

  /**
   * 获取图表颜色
   * @private
   */
  _getChartColor(index) {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ]
    return colors[index % colors.length]
  }

  /**
   * 转换为CSV格式
   * @private
   */
  _convertToCSV(records) {
    if (!records || records.length === 0) return ''

    // 获取所有字段名
    const allFields = new Set()
    records.forEach(record => {
      Object.keys(record.fields || {}).forEach(field => allFields.add(field))
    })
    const fieldNames = Array.from(allFields)

    // 生成CSV头部
    const header = fieldNames.join(',')

    // 生成CSV行
    const rows = records.map(record => {
      return fieldNames.map(field => {
        const value = record.fields?.[field] || ''
        // 处理包含逗号的值
        return `"${value.toString().replace(/"/g, '""')}"`
      }).join(',')
    })

    return [header, ...rows].join('\n')
  }

  /**
   * 下载数据
   * @private
   */
  _downloadData(data, filename) {
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}