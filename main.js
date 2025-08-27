// main.js - Feishu China Map Plugin 入口文件（重构版本）
import './style.css'
import { ConfigManager } from './src/managers/ConfigManager.js'
import { BitableConnector } from './src/connectors/BitableConnector.js'
import { DataValidator } from './src/validators/DataValidator.js'
import { StatusManager } from './src/managers/StatusManager.js'
import { DataPreviewer } from './src/previewers/DataPreviewer.js'
import { ChinaMapRenderer } from './src/components/ChinaMapRenderer.js'

// 初始化管理器
const configManager = new ConfigManager()
const bitableConnector = new BitableConnector() // 使用相对路径的后端代理
const dataValidator = new DataValidator()
const statusManager = new StatusManager()
const dataPreviewer = new DataPreviewer()
const chinaMapRenderer = new ChinaMapRenderer()

document.querySelector('#root').innerHTML = `
  <div class="plugin-wrap">
    <h1>飞书机构分布地图插件</h1>
    
    <div class="config-card">
      <h2>配置信息</h2>
      <textarea id="cfg-input" rows="8" placeholder='请输入配置信息...'></textarea>
      <div class="config-actions">
        <button id="btn-load-example">加载示例配置</button>
        <button id="btn-validate">验证配置</button>
        <button id="btn-test-connection">测试连接</button>
        <button id="btn-save">保存到仪表盘</button>
        <button id="btn-status-panel" class="btn-secondary">状态面板</button>
      </div>
      <div id="config-status" class="status-info"></div>
      <div id="status-panel" class="status-panel hidden">
        <div class="status-panel-header">
          <h4>系统状态</h4>
          <button id="btn-close-panel" class="btn-close">×</button>
        </div>
        <div class="status-panel-content">
          <div id="status-overview"></div>
          <div id="status-history"></div>
        </div>
      </div>
    </div>

    <div class="preview">
      <h2 id="preview-title">数据预览</h2>
      <div class="preview-tabs">
        <button id="tab-map" class="tab-button active">中国地图</button>
        <button id="tab-data" class="tab-button">数据表格</button>
      </div>
      <div id="preview-map" class="preview-content active">等待配置...</div>
      <div id="preview-data" class="preview-content">等待配置...</div>
    </div>
  </div>
`

const $ = (sel) => document.querySelector(sel)
const $input = $('#cfg-input')
const $status = $('#config-status')
const $title = $('#preview-title')

/**
 * 使用连接器获取多维表格记录
 */
async function fetchBitableRecords(cfg) {
  try {
    statusManager.setDataLoadingStatus(true, 0, '开始读取多维表格数据...')
    
    const result = await bitableConnector.fetchAllRecords(cfg, (progress) => {
      // 计算进度百分比
      const progressPercent = progress.hasMore ? 
        Math.min(90, (progress.pageCount * 10)) : 100
      
      statusManager.setDataLoadingStatus(true, progressPercent, 
        `已获取 ${progress.currentCount} 条记录 (第 ${progress.pageCount} 页)`)
      
      // 更新界面显示
      const container = document.getElementById('preview-map')
      if (container) {
        container.innerHTML = `
          <div class="loading">
            正在读取多维表格数据...<br>
            <small>已获取 ${progress.currentCount} 条记录 (第 ${progress.pageCount} 页)</small>
            <div style="margin-top: 8px; width: 200px; height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden; margin-left: auto; margin-right: auto;">
              <div style="height: 100%; background: #007bff; width: ${progressPercent}%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        `
      }
    })
    
    statusManager.setDataLoadingStatus(false, 100, `成功获取 ${result.length} 条记录`)
    return result
  } catch (error) {
    statusManager.setDataLoadingStatus(false, 0, '数据获取失败')
    throw error
  }
}

/**
 * 处理和分析机构数据
 */
function processInstitutionData(records) {
  const regionStats = {}
  const regionField = '所属区域'
  
  records.forEach(record => {
    const fields = record.fields || {}
    const region = fields[regionField]
    
    if (region) {
      regionStats[region] = (regionStats[region] || 0) + 1
    }
  })
  
  return regionStats
}

/**
 * 生成数据质量报告HTML
 */
function generateQualityReportHtml(report) {
  const { dataQualityScore } = report.overview
  
  // 确定质量等级和样式
  let qualityClass = 'quality-poor'
  let qualityIcon = '❌'
  
  if (dataQualityScore >= 90) {
    qualityClass = 'quality-excellent'
    qualityIcon = '✅'
  } else if (dataQualityScore >= 70) {
    qualityClass = 'quality-good'
    qualityIcon = '⚠️'
  } else if (dataQualityScore >= 50) {
    qualityClass = 'quality-fair'
    qualityIcon = '⚠️'
  }

  // 生成字段统计HTML
  const fieldStatsHtml = report.fieldValidation && report.fieldValidation.fieldStats ? 
    Object.entries(report.fieldValidation.fieldStats)
      .map(([fieldName, stats]) => 
        `<div class="field-stat">
          <span class="field-name">${fieldName}</span>
          <div class="field-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${stats.completeness}%"></div>
            </div>
            <span class="progress-text">${stats.completeness}%</span>
          </div>
        </div>`
      ).join('') : ''

  // 生成建议HTML
  const recommendationsHtml = report.recommendations && report.recommendations.length > 0 ?
    `<div class="recommendations">
      <h5>改进建议</h5>
      <ul>
        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>` : ''

  // 生成未知区域警告
  const unknownRegionsHtml = report.geographicValidation && report.geographicValidation.unknownRegions.length > 0 ?
    `<div class="unknown-regions">
      <h5>⚠️ 未识别的区域</h5>
      <div class="region-tags">
        ${report.geographicValidation.unknownRegions.map(region => 
          `<span class="region-tag">${region}</span>`
        ).join('')}
      </div>
    </div>` : ''

  return `
    <div class="data-quality-report">
      <div class="quality-header ${qualityClass}">
        <h4>${qualityIcon} ${report.summary}</h4>
      </div>
      
      ${fieldStatsHtml ? `
        <div class="field-stats">
          <h5>字段完整性</h5>
          ${fieldStatsHtml}
        </div>
      ` : ''}
      
      ${unknownRegionsHtml}
      ${recommendationsHtml}
    </div>
  `
}

/**
 * 渲染数据预览
 */
function renderWithConfig(cfg = {}) {
  $title.textContent = cfg.title || '数据预览'
  const mapContainer = document.getElementById('preview-map')
  const dataContainer = document.getElementById('preview-data')

  // 检查是否配置了多维表格信息
  if (cfg.bitable?.appToken && cfg.bitable?.tableId && cfg.bitable?.viewId) {
    mapContainer.innerHTML = '<div class="loading">正在读取多维表格数据...</div>'
    dataContainer.innerHTML = '<div class="loading">正在读取多维表格数据...</div>'
    
    fetchBitableRecords(cfg)
      .then(async (items) => {
        // 数据验证
        const qualityReport = dataValidator.generateDataQualityReport(items)
        
        // 渲染中国地图
        try {
          // 创建地图容器和加载状态
          mapContainer.innerHTML = `
            <div class="map-loading">
              <div class="spinner"></div>
              正在初始化地图...
            </div>
            <div id="china-map" style="width: 100%; height: 500px; display: none;"></div>
          `
          
          // 初始化地图渲染器
          await chinaMapRenderer.init('china-map')
          
          // 隐藏加载状态，显示地图
          const loadingDiv = mapContainer.querySelector('.map-loading')
          const mapDiv = mapContainer.querySelector('#china-map')
          if (loadingDiv) loadingDiv.style.display = 'none'
          if (mapDiv) mapDiv.style.display = 'block'
          
          // 数据验证和处理
          
          // 渲染地图
          chinaMapRenderer.renderMap(items, {
            title: cfg.title || '机构分布地图',
            regionField: '所属省份', // 强制使用正确的字段名
            valueField: '机构',
            colorScheme: 'blue'
          })
          
          console.log('中国地图渲染成功')
        } catch (error) {
          console.error('地图渲染失败:', error)
          mapContainer.innerHTML = `
            <div class="error-message">
              <h3>⚠️ 地图渲染失败</h3>
              <p><strong>错误信息:</strong> ${error.message}</p>
              <div class="error-suggestions">
                <h4>可能的解决方案:</h4>
                <ul>
                  <li>刷新页面重试</li>
                  <li>检查网络连接是否正常</li>
                  <li>确保 ECharts 库能正常加载</li>
                  <li>查看控制台获取详细错误信息</li>
                </ul>
              </div>
            </div>
          `
        }
        
        // 使用数据预览器渲染数据表格
        dataPreviewer.renderPreview(items, dataContainer, {
          title: cfg.title || '机构分布数据',
          showControls: true,
          showStats: true,
          showQuality: true
        })
        
        // 在预览器渲染后添加数据质量报告
        const qualityHtml = generateQualityReportHtml(qualityReport)
        const previewContent = dataContainer.querySelector('.preview-content')
        if (previewContent) {
          // 在预览内容前插入质量报告
          const qualityDiv = document.createElement('div')
          qualityDiv.innerHTML = qualityHtml
          previewContent.insertBefore(qualityDiv.firstElementChild, previewContent.firstChild)
        }
      })
      .catch((error) => {
        console.error('读取数据失败:', error)
        const errorHtml = `
          <div class="error-message">
            <h3>❌ 数据读取失败</h3>
            <p><strong>错误信息:</strong> ${error.message}</p>
            <div class="error-suggestions">
              <h4>可能的解决方案:</h4>
              <ul>
                <li>检查 appToken、tableId、viewId 是否正确</li>
                <li>确认多维表格的访问权限</li>
                <li>检查网络连接是否正常</li>
                <li>确认后端代理服务是否正常运行</li>
              </ul>
            </div>
          </div>
        `
        mapContainer.innerHTML = errorHtml
        dataContainer.innerHTML = errorHtml
      })
  } else {
    const promptHtml = `
      <div class="config-prompt">
        <h3>⚙️ 请先配置多维表格信息</h3>
        <p>点击"加载示例配置"按钮获取配置模板，然后填入您的实际信息。</p>
      </div>
    `
    mapContainer.innerHTML = promptHtml
    dataContainer.innerHTML = promptHtml
  }
}

/**
 * 显示状态信息（保持向后兼容）
 */
function showStatus(message, type = 'info') {
  switch (type) {
    case 'success':
      statusManager.showSuccess(message)
      break
    case 'error':
      statusManager.showError(message)
      break
    case 'warning':
      statusManager.showWarning(message)
      break
    default:
      statusManager.showInfo(message)
  }
}

/**
 * 检查配置是否为有效的真实配置（非模板配置）
 */
function isValidRealConfig(config) {
  if (!config || !config.bitable) return false
  
  const { appToken, tableId, viewId, accessToken } = config.bitable
  
  // 检查是否为空值或模板值
  if (!appToken || !tableId || !viewId) return false
  if (appToken.trim() === '' || tableId.trim() === '' || viewId.trim() === '') return false
  
  // 如果有accessToken，就认为是真实配置（即使使用示例的appToken等）
  if (accessToken && accessToken.trim() !== '' && accessToken !== '请填入您的飞书访问令牌') {
    return true
  }
  
  // 检查是否为示例配置中的值（没有accessToken的情况下）
  const example = configManager.getConfigExample()
  if (appToken === example.bitable.appToken && 
      tableId === example.bitable.tableId && 
      viewId === example.bitable.viewId) {
    return false
  }
  
  return true
}

/**
 * 初始化应用
 */
;(async function bootstrap() {
  try {
    // 初始化管理器
    statusManager.init('config-status')
    dataPreviewer.init('preview-data')
    
    // 设置配置加载状态
    statusManager.setConfigStatus('loading', '正在加载配置...')
    
    const saved = await configManager.loadConfig()
    console.log('[Bootstrap] 加载的配置:', saved)
    $input.value = JSON.stringify(saved, null, 2)
    
    // 只有在配置是真实有效的配置时才渲染数据
    if (isValidRealConfig(saved)) {
      renderWithConfig(saved)
      statusManager.setConfigStatus('saved', '配置已加载')
      statusManager.showSuccess('配置已加载')
    } else {
      // 显示配置提示，不渲染数据
      const mapContainer = document.getElementById('preview-map')
      const dataContainer = document.getElementById('preview-data')
      const promptHtml = `
        <div class="config-prompt">
          <h3>⚙️ 请先配置多维表格信息</h3>
          <p>点击"加载示例配置"按钮获取配置模板，然后填入您的实际信息。</p>
          <p><small>注意：请使用您自己的 appToken、tableId 和 viewId，不要使用示例中的值。</small></p>
        </div>
      `
      mapContainer.innerHTML = promptHtml
      dataContainer.innerHTML = promptHtml
      
      statusManager.setConfigStatus('saved', '请配置真实的多维表格信息')
      statusManager.showInfo('请配置您的多维表格信息以查看数据')
    }
  } catch (error) {
    console.error('初始化失败:', error)
    statusManager.setConfigStatus('error', '初始化失败')
    statusManager.showError(error, ['检查网络连接', '刷新页面重试'])
  }
})()

/**
 * 事件监听器
 */

// 标签页切换
$('#tab-map').addEventListener('click', () => {
  // 切换标签按钮状态
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'))
  $('#tab-map').classList.add('active')
  
  // 切换内容显示
  document.querySelectorAll('.preview-content').forEach(content => content.classList.remove('active'))
  $('#preview-map').classList.add('active')
})

$('#tab-data').addEventListener('click', () => {
  // 切换标签按钮状态
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'))
  $('#tab-data').classList.add('active')
  
  // 切换内容显示
  document.querySelectorAll('.preview-content').forEach(content => content.classList.remove('active'))
  $('#preview-data').classList.add('active')
})

// 加载示例配置
$('#btn-load-example').addEventListener('click', () => {
  const example = configManager.getConfigExample()
  $input.value = JSON.stringify(example, null, 2)
  statusManager.showWarning('⚠️ 这是示例配置，请替换为您自己的真实 appToken、tableId 和 viewId')
})

// 状态面板控制
$('#btn-status-panel').addEventListener('click', () => {
  const panel = document.getElementById('status-panel')
  panel.classList.toggle('hidden')
  
  if (!panel.classList.contains('hidden')) {
    updateStatusPanel()
  }
})

$('#btn-close-panel').addEventListener('click', () => {
  document.getElementById('status-panel').classList.add('hidden')
})

/**
 * 获取状态图标
 */
function getStatusIcon(status, type) {
  const icons = {
    connection: {
      idle: '⚪',
      connecting: '🔄',
      connected: '✅',
      failed: '❌'
    },
    dataLoading: {
      idle: '⚪',
      loading: '🔄'
    },
    validation: {
      idle: '⚪',
      validating: '🔍',
      valid: '✅',
      invalid: '❌'
    },
    config: {
      idle: '⚪',
      saving: '💾',
      saved: '✅',
      error: '❌'
    }
  }

  return icons[type]?.[status] || '⚪'
}

/**
 * 更新状态面板内容
 */
function updateStatusPanel() {
  const currentStatus = statusManager.getCurrentStatus()
  const statusStats = statusManager.getStatusStats()
  const recentHistory = statusManager.getStatusHistory(null, 5)
  
  // 更新状态概览
  const overviewHtml = `
    <div class="status-overview">
      <h5>当前状态</h5>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">连接:</span>
          <span class="status-value ${currentStatus.connection.status}">
            ${getStatusIcon(currentStatus.connection.status, 'connection')} 
            ${currentStatus.connection.status}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">数据加载:</span>
          <span class="status-value ${currentStatus.dataLoading.status}">
            ${getStatusIcon(currentStatus.dataLoading.status, 'dataLoading')} 
            ${currentStatus.dataLoading.status}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">验证:</span>
          <span class="status-value ${currentStatus.validation.status}">
            ${getStatusIcon(currentStatus.validation.status, 'validation')} 
            ${currentStatus.validation.status}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">配置:</span>
          <span class="status-value ${currentStatus.config.status}">
            ${getStatusIcon(currentStatus.config.status, 'config')} 
            ${currentStatus.config.status}
          </span>
        </div>
      </div>
      
      <div class="status-stats">
        <h5>统计信息</h5>
        <p>总事件: ${statusStats.total} | 最近错误: ${statusStats.recent.errors} | 最近成功: ${statusStats.recent.successes}</p>
      </div>
    </div>
  `
  
  // 更新历史记录
  const historyHtml = `
    <div class="status-history">
      <h5>最近活动</h5>
      <div class="history-list">
        ${recentHistory.map(item => `
          <div class="history-item">
            <span class="history-time">${new Date(item.timestamp).toLocaleTimeString()}</span>
            <span class="history-type">${item.type}</span>
            <span class="history-message">${JSON.stringify(item.data).substring(0, 100)}...</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
  
  document.getElementById('status-overview').innerHTML = overviewHtml
  document.getElementById('status-history').innerHTML = historyHtml
}

// 验证配置
$('#btn-validate').addEventListener('click', () => {
  try {
    statusManager.setValidationStatus('validating', '正在验证配置...')
    
    const config = $input.value.trim() ? JSON.parse($input.value) : {}
    const validation = configManager.validateConfig(config)
    
    if (validation.isValid) {
      statusManager.setValidationStatus('valid', '配置验证通过', validation)
      statusManager.showSuccess('配置验证通过')
    } else {
      statusManager.setValidationStatus('invalid', '配置验证失败', validation)
      statusManager.showError('配置验证失败: ' + validation.errors.join(', '), 
        ['检查必需字段', '验证字段格式', '参考示例配置'])
    }
  } catch (error) {
    statusManager.setValidationStatus('invalid', 'JSON 格式错误')
    statusManager.showError('JSON 格式错误: ' + error.message, 
      ['检查JSON语法', '使用JSON格式化工具'])
  }
})

// 测试连接
$('#btn-test-connection').addEventListener('click', async () => {
  try {
    const config = $input.value.trim() ? JSON.parse($input.value) : {}
    
    // 先验证配置
    const validation = configManager.validateConfig(config)
    if (!validation.isValid) {
      statusManager.setValidationStatus('invalid', '配置验证失败', validation)
      statusManager.showError('配置验证失败: ' + validation.errors.join(', '), 
        ['检查必需字段', '验证字段格式'])
      return
    }
    
    // 设置连接状态
    statusManager.setConnectionStatus('connecting', '正在测试连接...')
    
    const testResult = await bitableConnector.testConnection(config)
    
    if (testResult.success) {
      statusManager.setConnectionStatus('connected', testResult.message, testResult)
      statusManager.showSuccess(`${testResult.message} (${testResult.details})`)
    } else {
      statusManager.setConnectionStatus('failed', testResult.message, testResult)
      
      // 获取诊断信息并提供建议
      const diagnostics = await bitableConnector.getDiagnosticInfo(config)
      console.log('连接诊断信息:', diagnostics)
      
      const suggestions = [
        '检查 appToken、tableId、viewId 是否正确',
        '确认多维表格的访问权限',
        '检查网络连接'
      ]
      
      statusManager.showError(`${testResult.message}: ${testResult.details}`, suggestions)
    }
  } catch (error) {
    statusManager.setConnectionStatus('failed', '连接测试异常')
    statusManager.showError('连接测试失败: ' + error.message, 
      ['检查网络连接', '稍后重试', '查看控制台详细错误'])
  }
})

// 保存配置到仪表盘
$('#btn-save').addEventListener('click', async () => {
  try {
    statusManager.setConfigStatus('saving', '正在保存配置到仪表盘...')
    
    const config = $input.value.trim() ? JSON.parse($input.value) : {}
    console.log('[保存配置] 准备保存的配置:', config)
    
    const result = await configManager.saveConfig(config)
    console.log('[保存配置] 保存结果:', result)
    
    if (result.success) {
      statusManager.setConfigStatus('saved', result.message)
      statusManager.showSuccess(result.message)
      
      // 只有在配置是真实有效的配置时才渲染数据
      if (isValidRealConfig(config)) {
        renderWithConfig(config)
      } else {
        // 显示配置提示
        const mapContainer = document.getElementById('preview-map')
        const dataContainer = document.getElementById('preview-data')
        const promptHtml = `
          <div class="config-prompt">
            <h3>⚠️ 请使用真实的多维表格配置</h3>
            <p>检测到您使用的是示例配置或空配置。</p>
            <p>请填入您自己的 appToken、tableId 和 viewId 以查看真实数据。</p>
            <div class="error-suggestions">
              <h4>如何获取配置信息：</h4>
              <ul>
                <li>appToken: 在飞书多维表格应用中获取</li>
                <li>tableId: 多维表格的唯一标识符</li>
                <li>viewId: 表格视图的唯一标识符</li>
              </ul>
            </div>
          </div>
        `
        mapContainer.innerHTML = promptHtml
        dataContainer.innerHTML = promptHtml
        statusManager.showWarning('请使用真实的多维表格配置信息')
      }
    } else {
      statusManager.setConfigStatus('error', result.message)
      statusManager.showError(result.message, ['检查配置格式', '验证必需字段'])
    }
  } catch (error) {
    statusManager.setConfigStatus('error', 'JSON 格式错误')
    statusManager.showError('保存失败: JSON 格式错误', 
      ['检查JSON语法', '使用JSON格式化工具'])
  }
})