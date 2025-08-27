/**
 * 飞书多维表格连接器 - 处理与飞书多维表格的 API 交互
 */
export class BitableConnector {
  constructor(apiBase = '') {
    this.apiBase = apiBase
    this.timeout = 10000 // 10秒超时
  }

  /**
   * 测试与多维表格的连接
   * @param {Object} config - 配置对象
   * @returns {Promise<Object>} 连接测试结果
   */
  async testConnection(config) {
    const startTime = Date.now()
    
    try {
      // 验证配置
      if (!this._validateConfig(config)) {
        return {
          success: false,
          message: '配置信息不完整',
          details: '缺少必要的 appToken、tableId 或 viewId'
        }
      }

      // 尝试获取表格基本信息（只获取少量数据进行连接测试）
      const testResult = await this._makeRequest('/api/bitable/test', {
        appToken: config.bitable.appToken,
        tableId: config.bitable.tableId,
        viewId: config.bitable.viewId
      })

      const responseTime = Date.now() - startTime

      return {
        success: true,
        message: '连接测试成功',
        details: `响应时间: ${responseTime}ms`,
        responseTime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        success: false,
        message: '连接测试失败',
        details: this._parseErrorMessage(error),
        responseTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  /**
   * 获取表格记录
   * @param {Object} config - 配置对象
   * @param {Object} options - 获取选项
   * @returns {Promise<Array>} 记录数组
   */
  async fetchRecords(config, options = {}) {
    if (!this._validateConfig(config)) {
      throw new Error('配置信息不完整：缺少必要的 appToken、tableId 或 viewId')
    }

    const {
      pageSize = 100,
      pageToken = null,
      fields = null
    } = options

    try {
      const requestBody = {
        appToken: config.bitable.appToken,
        tableId: config.bitable.tableId,
        viewId: config.bitable.viewId,
        pageSize
      }

      if (pageToken) {
        requestBody.pageToken = pageToken
      }

      if (fields && Array.isArray(fields)) {
        requestBody.fields = fields
      }

      const data = await this._makeRequest('/api/bitable/search', requestBody)
      
      return {
        items: data?.data?.items || [],
        hasMore: data?.data?.hasMore || false,
        pageToken: data?.data?.pageToken || null,
        total: data?.data?.total || 0
      }
    } catch (error) {
      throw new Error(`获取记录失败: ${this._parseErrorMessage(error)}`)
    }
  }

  /**
   * 获取表格结构信息
   * @param {Object} config - 配置对象
   * @returns {Promise<Object>} 表格结构信息
   */
  async getTableSchema(config) {
    if (!this._validateConfig(config)) {
      throw new Error('配置信息不完整')
    }

    try {
      const data = await this._makeRequest('/api/bitable/schema', {
        appToken: config.bitable.appToken,
        tableId: config.bitable.tableId
      })

      return {
        fields: data?.data?.fields || [],
        name: data?.data?.name || '',
        tableId: config.bitable.tableId
      }
    } catch (error) {
      throw new Error(`获取表格结构失败: ${this._parseErrorMessage(error)}`)
    }
  }

  /**
   * 批量获取所有记录（自动处理分页）
   * @param {Object} config - 配置对象
   * @param {Function} onProgress - 进度回调函数
   * @returns {Promise<Array>} 所有记录
   */
  async fetchAllRecords(config, onProgress = null) {
    const allRecords = []
    let pageToken = null
    let pageCount = 0

    do {
      const result = await this.fetchRecords(config, { 
        pageSize: 100, 
        pageToken 
      })
      
      allRecords.push(...result.items)
      pageToken = result.pageToken
      pageCount++

      if (onProgress) {
        onProgress({
          currentCount: allRecords.length,
          pageCount,
          hasMore: result.hasMore
        })
      }

      // 添加延迟避免 API 限流
      if (result.hasMore) {
        await this._delay(200)
      }
    } while (pageToken)

    return allRecords
  }

  /**
   * 验证配置完整性
   * @private
   */
  _validateConfig(config) {
    return config?.bitable?.appToken && 
           config?.bitable?.tableId && 
           config?.bitable?.viewId
  }

  /**
   * 发送 API 请求
   * @private
   */
  async _makeRequest(endpoint, body) {
    // 开发环境模拟数据
    if (this._isDevelopmentMode()) {
      return this._getMockData(endpoint, body)
    }

    // 生产环境：检查是否在飞书环境中
    if (this._isInFeishuEnvironment()) {
      return this._makeFeishuSDKRequest(endpoint, body)
    }

    // 开发环境：使用代理服务器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.code && data.code !== 0) {
        throw new Error(data.msg || `API 错误 (code: ${data.code})`)
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error(`请求超时 (${this.timeout}ms)`)
      }
      
      throw error
    }
  }

  /**
   * 检查是否为开发模式
   * @private
   */
  _isDevelopmentMode() {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  }

  /**
   * 检测是否在飞书环境中
   * @private
   */
  _isInFeishuEnvironment() {
    return typeof window !== 'undefined' && 
           typeof window.bitable !== 'undefined'
  }

  /**
   * 使用飞书SDK进行API调用
   * @private
   */
  async _makeFeishuSDKRequest(endpoint, body) {
    try {
      if (!window.bitable) {
        throw new Error('飞书SDK未加载')
      }

      const { appToken, tableId, viewId, pageSize, pageToken } = body

      if (endpoint === '/api/bitable/test') {
        // 测试连接：尝试获取表格信息
        const table = await window.bitable.base.getTableById(tableId)
        const recordList = await table.getRecordList()
        
        return {
          code: 0,
          msg: 'success',
          data: {
            connected: true,
            recordCount: recordList.length
          }
        }
      } else if (endpoint === '/api/bitable/search') {
        // 获取记录：使用飞书SDK
        const table = await window.bitable.base.getTableById(tableId)
        const view = await table.getViewById(viewId)
        
        // 获取记录列表
        const recordIdList = await view.getVisibleRecordIdList()
        const records = []
        
        // 分页处理
        const startIndex = pageToken ? parseInt(pageToken) : 0
        const endIndex = Math.min(startIndex + pageSize, recordIdList.length)
        
        for (let i = startIndex; i < endIndex; i++) {
          const recordId = recordIdList[i]
          const record = await table.getRecordById(recordId)
          const fields = await record.getFields()
          
          records.push({
            record_id: recordId,
            fields: fields,
            created_time: Date.now(),
            last_modified_time: Date.now()
          })
        }
        
        return {
          code: 0,
          msg: 'success',
          data: {
            items: records,
            has_more: endIndex < recordIdList.length,
            page_token: endIndex < recordIdList.length ? endIndex.toString() : null,
            total: recordIdList.length
          }
        }
      } else {
        throw new Error(`不支持的端点: ${endpoint}`)
      }
    } catch (error) {
      console.error('飞书SDK调用失败:', error)
      throw new Error(`飞书SDK调用失败: ${error.message}`)
    }
  }

  /**
   * 获取模拟数据
   * @private
   */
  async _getMockData(endpoint, body) {
    // 模拟网络延迟
    await this._delay(500 + Math.random() * 1000)

    if (endpoint === '/api/bitable/test') {
      return {
        code: 0,
        msg: 'success',
        data: {
          connected: true,
          recordCount: 25
        }
      }
    }

    if (endpoint === '/api/bitable/search') {
      // 生成模拟的机构数据
      const mockRecords = this._generateMockRecords()
      return {
        code: 0,
        msg: 'success',
        data: {
          items: mockRecords,
          hasMore: false,
          pageToken: null,
          total: mockRecords.length
        }
      }
    }

    if (endpoint === '/api/bitable/schema') {
      return {
        code: 0,
        msg: 'success',
        data: {
          fields: [
            { field_name: '机构', field_type: 'text' },
            { field_name: '所属省份', field_type: 'text' },
            { field_name: '所属区域', field_type: 'text' },
            { field_name: '负责人', field_type: 'text' }
          ],
          name: '机构信息表'
        }
      }
    }

    throw new Error('未知的 API 端点')
  }

  /**
   * 生成模拟记录数据
   * @private
   */
  _generateMockRecords() {
    const regions = ['华北', '华东', '华南', '华中', '西南', '西北', '东北']
    const provinces = {
      '华北': ['北京', '天津', '河北', '山西', '内蒙古'],
      '华东': ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'],
      '华南': ['广东', '广西', '海南'],
      '华中': ['河南', '湖北', '湖南'],
      '西南': ['重庆', '四川', '贵州', '云南', '西藏'],
      '西北': ['陕西', '甘肃', '青海', '宁夏', '新疆'],
      '东北': ['辽宁', '吉林', '黑龙江']
    }

    const records = []
    let recordId = 1

    regions.forEach(region => {
      const regionProvinces = provinces[region]
      const institutionCount = Math.floor(Math.random() * 5) + 1 // 每个区域1-5个机构
      
      for (let i = 0; i < institutionCount; i++) {
        const province = regionProvinces[Math.floor(Math.random() * regionProvinces.length)]
        records.push({
          record_id: `rec${recordId.toString().padStart(6, '0')}`,
          fields: {
            '机构': `${region}分公司${i + 1}`,
            '所属省份': province,
            '所属区域': region,
            '负责人': `负责人${recordId}`
          },
          created_time: Date.now() - Math.random() * 86400000 * 30, // 30天内随机时间
          last_modified_time: Date.now() - Math.random() * 86400000 * 7 // 7天内随机时间
        })
        recordId++
      }
    })

    return records
  }

  /**
   * 解析错误信息
   * @private
   */
  _parseErrorMessage(error) {
    if (error.message.includes('Failed to fetch')) {
      return '网络连接失败，请检查网络设置或后端服务状态'
    }
    
    if (error.message.includes('timeout') || error.message.includes('超时')) {
      return '请求超时，请稍后重试'
    }
    
    if (error.message.includes('401')) {
      return 'Token 无效或已过期，请检查 appToken'
    }
    
    if (error.message.includes('403')) {
      return '权限不足，请检查多维表格的访问权限'
    }
    
    if (error.message.includes('404')) {
      return '资源不存在，请检查 tableId 和 viewId 是否正确'
    }
    
    if (error.message.includes('429')) {
      return 'API 调用频率过高，请稍后重试'
    }
    
    return error.message || '未知错误'
  }

  /**
   * 延迟函数
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取连接状态诊断信息
   */
  async getDiagnosticInfo(config) {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      config: {
        hasAppToken: !!config?.bitable?.appToken,
        hasTableId: !!config?.bitable?.tableId,
        hasViewId: !!config?.bitable?.viewId,
        appTokenFormat: config?.bitable?.appToken ? 
          (config.bitable.appToken.match(/^[a-zA-Z0-9_-]+$/) ? '正确' : '格式错误') : '缺失',
        tableIdFormat: config?.bitable?.tableId ? 
          (config.bitable.tableId.match(/^tbl[a-zA-Z0-9]+$/) ? '正确' : '格式错误') : '缺失',
        viewIdFormat: config?.bitable?.viewId ? 
          (config.bitable.viewId.match(/^vew[a-zA-Z0-9]+$/) ? '正确' : '格式错误') : '缺失'
      },
      network: {
        apiBase: this.apiBase || '相对路径',
        timeout: this.timeout
      }
    }

    // 尝试连接测试
    try {
      const testResult = await this.testConnection(config)
      diagnostics.connectionTest = testResult
    } catch (error) {
      diagnostics.connectionTest = {
        success: false,
        error: error.message
      }
    }

    return diagnostics
  }
}