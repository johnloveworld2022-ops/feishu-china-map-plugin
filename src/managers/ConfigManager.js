/**
 * 配置管理器 - 处理飞书插件配置的验证、保存和读取
 */
export class ConfigManager {
  constructor() {
    this.storageKey = '__feishu_map_plugin_config__'
  }

  /**
   * 获取配置模板
   */
  getConfigTemplate() {
    return {
      title: "",
      bitable: {
        appToken: "",
        tableId: "",
        viewId: "",
        accessToken: ""
      },
      dataMapping: {
        regionField: "所属区域",
        valueField: "机构"
      }
    }
  }

  /**
   * 验证配置完整性
   * @param {Object} config - 配置对象
   * @returns {Object} 验证结果 { isValid: boolean, errors: string[] }
   */
  validateConfig(config) {
    const errors = []
    
    if (!config || typeof config !== 'object') {
      errors.push('配置必须是一个有效的对象')
      return { isValid: false, errors }
    }

    // 验证 bitable 配置
    if (!config.bitable) {
      errors.push('缺少 bitable 配置')
    } else {
      const { appToken, tableId, viewId } = config.bitable
      
      if (!appToken || typeof appToken !== 'string' || appToken.trim() === '') {
        errors.push('appToken 不能为空')
      }
      
      if (!tableId || typeof tableId !== 'string' || tableId.trim() === '') {
        errors.push('tableId 不能为空')
      }
      
      if (!viewId || typeof viewId !== 'string' || viewId.trim() === '') {
        errors.push('viewId 不能为空')
      }

      // 验证 Token 格式
      if (appToken && !appToken.match(/^[a-zA-Z0-9_-]+$/)) {
        errors.push('appToken 格式不正确')
      }
      
      if (tableId && !tableId.match(/^tbl[a-zA-Z0-9]+$/)) {
        errors.push('tableId 格式不正确，应以 "tbl" 开头')
      }
      
      if (viewId && !viewId.match(/^vew[a-zA-Z0-9]+$/)) {
        errors.push('viewId 格式不正确，应以 "vew" 开头')
      }
    }

    // 验证标题
    if (config.title && typeof config.title !== 'string') {
      errors.push('title 必须是字符串类型')
    }

    // 验证数据映射配置
    if (config.dataMapping) {
      const { regionField, valueField } = config.dataMapping
      
      if (regionField && typeof regionField !== 'string') {
        errors.push('regionField 必须是字符串类型')
      }
      
      if (valueField && typeof valueField !== 'string') {
        errors.push('valueField 必须是字符串类型')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 检测是否在飞书仪表盘环境中
   */
  _isInDashboard() {
    return typeof window !== 'undefined' && 
           typeof window.dashboard?.getConfig === 'function' &&
           typeof window.dashboard?.saveConfig === 'function'
  }

  /**
   * 从仪表盘或本地存储读取配置
   */
  async loadConfig() {
    try {
      if (this._isInDashboard()) {
        const config = await window.dashboard.getConfig()
        return config || this.getConfigTemplate()
      }
      
      const raw = localStorage.getItem(this.storageKey)
      if (raw) {
        const config = JSON.parse(raw)
        return { ...this.getConfigTemplate(), ...config }
      }
      
      return this.getConfigTemplate()
    } catch (error) {
      console.warn('[ConfigManager] 读取配置失败，使用默认配置:', error)
      return this.getConfigTemplate()
    }
  }

  /**
   * 保存配置到仪表盘或本地存储
   * @param {Object} config - 要保存的配置
   * @returns {Promise<Object>} 保存结果 { success: boolean, message: string }
   */
  async saveConfig(config) {
    try {
      // 验证配置
      const validation = this.validateConfig(config)
      if (!validation.isValid) {
        return {
          success: false,
          message: `配置验证失败: ${validation.errors.join(', ')}`
        }
      }

      if (this._isInDashboard()) {
        await window.dashboard.saveConfig(config)
        return {
          success: true,
          message: '配置已保存到仪表盘'
        }
      } else {
        localStorage.setItem(this.storageKey, JSON.stringify(config))
        return {
          success: true,
          message: '配置已保存到本地存储（开发环境）'
        }
      }
    } catch (error) {
      console.error('[ConfigManager] 保存配置失败:', error)
      return {
        success: false,
        message: `保存失败: ${error.message}`
      }
    }
  }

  /**
   * 检查配置是否发生变化
   * @param {Object} currentConfig - 当前配置
   * @param {Object} newConfig - 新配置
   */
  hasConfigChanged(currentConfig, newConfig) {
    return JSON.stringify(currentConfig) !== JSON.stringify(newConfig)
  }

  /**
   * 合并配置，用新配置覆盖默认配置
   * @param {Object} newConfig - 新配置
   */
  mergeWithDefaults(newConfig) {
    const defaults = this.getConfigTemplate()
    return {
      ...defaults,
      ...newConfig,
      bitable: {
        ...defaults.bitable,
        ...(newConfig.bitable || {})
      },
      dataMapping: {
        ...defaults.dataMapping,
        ...(newConfig.dataMapping || {})
      }
    }
  }

  /**
   * 获取配置示例（用于用户参考）
   */
  getConfigExample() {
    return {
      title: "机构分布地图",
      bitable: {
        appToken: "MKbNbyYwPa3krisWZg8cjjnpnQe",
        tableId: "tbllK3JjHixtQCLd",
        viewId: "vewYBoCxzI",
        accessToken: "请填入您的飞书访问令牌"
      },
      dataMapping: {
        regionField: "所属区域",
        valueField: "机构"
      }
    }
  }
}