/**
 * 状态管理器 - 管理插件的各种状态和用户反馈
 */
export class StatusManager {
  constructor() {
    this.statusContainer = null
    this.currentStatus = {
      connection: { status: 'idle', message: '', timestamp: null },
      dataLoading: { status: 'idle', progress: 0, message: '', timestamp: null },
      validation: { status: 'idle', message: '', timestamp: null },
      config: { status: 'idle', message: '', timestamp: null }
    }
    this.statusHistory = []
    this.maxHistorySize = 50
  }

  /**
   * 初始化状态管理器
   * @param {string} containerId - 状态显示容器的ID
   */
  init(containerId) {
    this.statusContainer = document.getElementById(containerId)
    if (!this.statusContainer) {
      console.warn(`[StatusManager] 找不到状态容器: ${containerId}`)
    }
  }

  /**
   * 设置连接状态
   * @param {string} status - 状态: 'idle', 'connecting', 'connected', 'failed'
   * @param {string} message - 状态消息
   * @param {Object} details - 详细信息
   */
  setConnectionStatus(status, message, details = {}) {
    const statusInfo = {
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    }

    this.currentStatus.connection = statusInfo
    this._addToHistory('connection', statusInfo)
    this._updateDisplay('connection', statusInfo)
  }

  /**
   * 设置数据加载状态
   * @param {boolean} isLoading - 是否正在加载
   * @param {number} progress - 进度百分比 (0-100)
   * @param {string} message - 状态消息
   */
  setDataLoadingStatus(isLoading, progress = 0, message = '') {
    const status = isLoading ? 'loading' : 'idle'
    const statusInfo = {
      status,
      isLoading,
      progress: Math.max(0, Math.min(100, progress)),
      message,
      timestamp: new Date().toISOString()
    }

    this.currentStatus.dataLoading = statusInfo
    this._addToHistory('dataLoading', statusInfo)
    this._updateDisplay('dataLoading', statusInfo)
  }

  /**
   * 设置验证状态
   * @param {string} status - 状态: 'idle', 'validating', 'valid', 'invalid'
   * @param {string} message - 状态消息
   * @param {Object} validationResult - 验证结果
   */
  setValidationStatus(status, message, validationResult = {}) {
    const statusInfo = {
      status,
      message,
      validationResult,
      timestamp: new Date().toISOString()
    }

    this.currentStatus.validation = statusInfo
    this._addToHistory('validation', statusInfo)
    this._updateDisplay('validation', statusInfo)
  }

  /**
   * 设置配置状态
   * @param {string} status - 状态: 'idle', 'saving', 'saved', 'error'
   * @param {string} message - 状态消息
   */
  setConfigStatus(status, message) {
    const statusInfo = {
      status,
      message,
      timestamp: new Date().toISOString()
    }

    this.currentStatus.config = statusInfo
    this._addToHistory('config', statusInfo)
    this._updateDisplay('config', statusInfo)
  }

  /**
   * 显示错误信息
   * @param {Error|string} error - 错误对象或错误消息
   * @param {Array} suggestions - 解决方案建议
   * @param {string} category - 错误类别
   */
  showError(error, suggestions = [], category = 'general') {
    const errorMessage = error instanceof Error ? error.message : error
    const errorInfo = {
      type: 'error',
      message: errorMessage,
      suggestions,
      category,
      timestamp: new Date().toISOString()
    }

    this._addToHistory('error', errorInfo)
    this._displayMessage(errorMessage, 'error', suggestions)
  }

  /**
   * 显示成功信息
   * @param {string} message - 成功消息
   * @param {number} autoHideDelay - 自动隐藏延迟（毫秒），0表示不自动隐藏
   */
  showSuccess(message, autoHideDelay = 3000) {
    const successInfo = {
      type: 'success',
      message,
      timestamp: new Date().toISOString()
    }

    this._addToHistory('success', successInfo)
    this._displayMessage(message, 'success')

    if (autoHideDelay > 0) {
      setTimeout(() => {
        this._clearDisplay()
      }, autoHideDelay)
    }
  }

  /**
   * 显示警告信息
   * @param {string} message - 警告消息
   * @param {Array} suggestions - 建议
   */
  showWarning(message, suggestions = []) {
    const warningInfo = {
      type: 'warning',
      message,
      suggestions,
      timestamp: new Date().toISOString()
    }

    this._addToHistory('warning', warningInfo)
    this._displayMessage(message, 'warning', suggestions)
  }

  /**
   * 显示信息提示
   * @param {string} message - 信息消息
   */
  showInfo(message) {
    const infoData = {
      type: 'info',
      message,
      timestamp: new Date().toISOString()
    }

    this._addToHistory('info', infoData)
    this._displayMessage(message, 'info')
  }

  /**
   * 清除当前显示的状态
   */
  clearStatus() {
    this._clearDisplay()
  }

  /**
   * 获取当前状态
   * @returns {Object} 当前状态对象
   */
  getCurrentStatus() {
    return { ...this.currentStatus }
  }

  /**
   * 获取状态历史
   * @param {string} type - 状态类型，不指定则返回所有
   * @param {number} limit - 限制返回数量
   * @returns {Array} 状态历史数组
   */
  getStatusHistory(type = null, limit = 10) {
    let history = this.statusHistory
    
    if (type) {
      history = history.filter(item => item.type === type)
    }
    
    return history.slice(-limit).reverse()
  }

  /**
   * 获取状态统计信息
   * @returns {Object} 统计信息
   */
  getStatusStats() {
    const stats = {
      total: this.statusHistory.length,
      byType: {},
      recent: {
        errors: 0,
        warnings: 0,
        successes: 0
      }
    }

    // 统计各类型数量
    this.statusHistory.forEach(item => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1
    })

    // 统计最近的状态（最近10条）
    const recentHistory = this.statusHistory.slice(-10)
    recentHistory.forEach(item => {
      if (item.type === 'error') stats.recent.errors++
      else if (item.type === 'warning') stats.recent.warnings++
      else if (item.type === 'success') stats.recent.successes++
    })

    return stats
  }

  /**
   * 重置所有状态
   */
  reset() {
    this.currentStatus = {
      connection: { status: 'idle', message: '', timestamp: null },
      dataLoading: { status: 'idle', progress: 0, message: '', timestamp: null },
      validation: { status: 'idle', message: '', timestamp: null },
      config: { status: 'idle', message: '', timestamp: null }
    }
    this.statusHistory = []
    this._clearDisplay()
  }

  /**
   * 添加到历史记录
   * @private
   */
  _addToHistory(type, data) {
    this.statusHistory.push({
      type,
      data,
      timestamp: new Date().toISOString()
    })

    // 限制历史记录大小
    if (this.statusHistory.length > this.maxHistorySize) {
      this.statusHistory = this.statusHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * 更新状态显示
   * @private
   */
  _updateDisplay(statusType, statusInfo) {
    if (!this.statusContainer) return

    // 根据状态类型和状态值确定显示样式
    let displayType = 'info'
    let displayMessage = statusInfo.message

    switch (statusType) {
      case 'connection':
        if (statusInfo.status === 'connecting') {
          displayType = 'info'
          displayMessage = '🔄 ' + statusInfo.message
        } else if (statusInfo.status === 'connected') {
          displayType = 'success'
          displayMessage = '✅ ' + statusInfo.message
        } else if (statusInfo.status === 'failed') {
          displayType = 'error'
          displayMessage = '❌ ' + statusInfo.message
        }
        break

      case 'dataLoading':
        if (statusInfo.isLoading) {
          displayType = 'info'
          displayMessage = `🔄 ${statusInfo.message} (${statusInfo.progress}%)`
        }
        break

      case 'validation':
        if (statusInfo.status === 'validating') {
          displayType = 'info'
          displayMessage = '🔍 ' + statusInfo.message
        } else if (statusInfo.status === 'valid') {
          displayType = 'success'
          displayMessage = '✅ ' + statusInfo.message
        } else if (statusInfo.status === 'invalid') {
          displayType = 'error'
          displayMessage = '❌ ' + statusInfo.message
        }
        break

      case 'config':
        if (statusInfo.status === 'saving') {
          displayType = 'info'
          displayMessage = '💾 ' + statusInfo.message
        } else if (statusInfo.status === 'saved') {
          displayType = 'success'
          displayMessage = '✅ ' + statusInfo.message
        } else if (statusInfo.status === 'error') {
          displayType = 'error'
          displayMessage = '❌ ' + statusInfo.message
        }
        break
    }

    this._displayMessage(displayMessage, displayType)
  }

  /**
   * 显示消息
   * @private
   */
  _displayMessage(message, type = 'info', suggestions = []) {
    if (!this.statusContainer) return

    this.statusContainer.textContent = message
    this.statusContainer.className = `status-info ${type}`

    // 如果有建议，添加到显示中
    if (suggestions && suggestions.length > 0) {
      const suggestionText = suggestions.join('; ')
      this.statusContainer.textContent += ` (建议: ${suggestionText})`
    }
  }

  /**
   * 清除显示
   * @private
   */
  _clearDisplay() {
    if (!this.statusContainer) return
    
    this.statusContainer.textContent = ''
    this.statusContainer.className = 'status-info'
  }

  /**
   * 获取状态图标
   * @private
   */
  _getStatusIcon(status, type) {
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
}