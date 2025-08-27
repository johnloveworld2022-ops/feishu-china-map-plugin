/**
 * 中国地图渲染器 - 使用 ECharts 渲染中国地图并根据数据进行配色
 */
export class ChinaMapRenderer {
  constructor() {
    this.chart = null
    this.container = null
    this.currentData = null
    this.mapData = null
  }

  /**
   * 初始化地图渲染器
   * @param {string} containerId - 地图容器ID
   */
  async init(containerId) {
    this.container = document.getElementById(containerId)
    if (!this.container) {
      throw new Error(`找不到地图容器: ${containerId}`)
    }

    // 等待 ECharts 库加载完成
    await this._waitForECharts()

    // 初始化 ECharts 实例
    this.chart = window.echarts.init(this.container)
    
    // 注册地图数据
    await this._loadMapData()
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      if (this.chart) {
        this.chart.resize()
      }
    })
  }

  /**
   * 等待ECharts库加载完成
   * @private
   */
  async _waitForECharts() {
    // 如果ECharts已经加载，直接返回
    if (typeof window.echarts !== 'undefined') {
      return
    }

    // 如果有全局的加载Promise，等待它完成
    if (window.echartsLoadPromise) {
      try {
        await window.echartsLoadPromise
        return
      } catch (error) {
        throw new Error('ECharts 库加载失败: ' + error.message)
      }
    }

    // 备用方案：轮询检查
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ECharts 库加载超时，请刷新页面重试'))
      }, 15000)

      const checkECharts = () => {
        if (typeof window.echarts !== 'undefined') {
          clearTimeout(timeout)
          resolve()
        } else {
          setTimeout(checkECharts, 200)
        }
      }

      checkECharts()
    })
  }

  /**
   * 渲染地图
   * @param {Array} records - 机构记录数据
   * @param {Object} options - 渲染选项
   */
  renderMap(records, options = {}) {
    if (!this.chart) {
      console.error('地图未初始化')
      return
    }

    this.currentData = records
    
    const {
      title = '机构分布地图',
      regionField = '所属区域',
      valueField = '机构',
      colorScheme = 'blue'
    } = options

    // 处理数据
    const mapData = this._processDataForMap(records, regionField)
    
    // 配置地图选项
    const option = this._generateMapOption(mapData, {
      title,
      colorScheme
    })

    // 渲染地图
    this.chart.setOption(option, true)
    
    // 绑定事件
    this._bindMapEvents()
  }

  /**
   * 更新地图数据
   * @param {Array} records - 新的记录数据
   */
  updateData(records) {
    if (this.chart && records) {
      this.renderMap(records)
    }
  }

  /**
   * 销毁地图
   */
  dispose() {
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  }

  /**
   * 获取地图快照
   * @returns {string} Base64 图片数据
   */
  getSnapshot() {
    if (this.chart) {
      return this.chart.getDataURL({
        type: 'png',
        backgroundColor: '#fff'
      })
    }
    return null
  }

  /**
   * 加载地图数据
   * @private
   */
  async _loadMapData() {
    try {
      // 首先尝试加载本地的完整中国地图数据
      try {
        const response = await fetch('/assets/china-map.json')
        if (response.ok) {
          const chinaMapData = await response.json()
          window.echarts.registerMap('china', chinaMapData)
          this.mapData = chinaMapData
          console.log('成功加载本地完整中国地图数据')
          return
        }
      } catch (localError) {
        console.warn('从本地加载地图数据失败，使用内置数据:', localError.message)
      }
      
      // 使用内置的中国地图数据（符合数据安全要求）
      const chinaMapData = this._getChinaMapData()
      window.echarts.registerMap('china', chinaMapData)
      this.mapData = chinaMapData
      console.log('使用内置中国地图数据')
    } catch (error) {
      console.error('加载地图数据失败:', error)
      throw error
    }
  }

  /**
   * 处理数据用于地图渲染
   * @private
   */
  _processDataForMap(records, regionField) {
    const stats = {}
    
    // 处理地图数据
    
    // 统计各地区的机构数量
    records.forEach((record, index) => {
      let regionValue
      
      // 支持两种数据格式：
      // 1. 飞书多维表格格式：{ fields: { fieldName: value } }
      // 2. 平面数据格式：{ fieldName: value }
      if (record.fields) {
        // 飞书多维表格格式
        regionValue = record.fields[regionField]
      } else {
        // 平面数据格式
        regionValue = record[regionField]
      }
      
      if (regionValue) {
        // 标准化地区名称
        const normalizedRegion = this._normalizeRegionName(regionValue)
        stats[normalizedRegion] = (stats[normalizedRegion] || 0) + 1
      }
    })

    // 统计完成

    // 生成地图数据
    const mapData = []
    const allValues = Object.values(stats)
    
    Object.entries(stats).forEach(([name, count]) => {
      mapData.push({
        name: name,
        value: count,
        itemStyle: {
          areaColor: this._getColorByValue(count, allValues)
        }
      })
    })

    return {
      mapData,
      regionStats: stats,
      provinceStats: stats,
      maxValue: Math.max(...Object.values(stats))
    }
  }

  /**
   * 生成地图配置选项
   * @private
   */
  _generateMapOption(data, options) {
    const { title, colorScheme } = options
    const { mapData, maxValue } = data

    return {
      title: {
        text: title,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          if (params.data) {
            return `${params.name}<br/>机构数量: ${params.data.value || 0}`
          }
          return `${params.name}<br/>暂无数据`
        },
        backgroundColor: 'rgba(0,0,0,0.8)',
        textStyle: {
          color: '#fff'
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: this._getColorRange(colorScheme)
        },
        textStyle: {
          color: '#333'
        }
      },
      series: [
        {
          name: '机构分布',
          type: 'map',
          map: 'china',
          roam: true,
          scaleLimit: {
            min: 0.8,
            max: 3
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold'
            },
            itemStyle: {
              areaColor: '#ffd700',
              borderColor: '#fff',
              borderWidth: 2
            }
          },
          select: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold'
            },
            itemStyle: {
              areaColor: '#ff6b6b'
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
            areaColor: '#f0f0f0'
          },
          data: mapData
        }
      ]
    }
  }

  /**
   * 绑定地图事件
   * @private
   */
  _bindMapEvents() {
    if (!this.chart) return

    // 点击事件
    this.chart.on('click', (params) => {
      if (params.componentType === 'series') {
        console.log('点击了省份:', params.name, '机构数量:', params.data?.value || 0)
        
        // 可以在这里添加更多交互逻辑
        this._showProvinceDetail(params.name, params.data?.value || 0)
      }
    })

    // 鼠标悬停事件
    this.chart.on('mouseover', (params) => {
      if (params.componentType === 'series') {
        // 可以添加悬停效果
      }
    })
  }

  /**
   * 显示省份详情
   * @private
   */
  _showProvinceDetail(provinceName, count) {
    // 这里可以显示更详细的信息
    const event = new CustomEvent('provinceClick', {
      detail: {
        province: provinceName,
        count: count,
        data: this.currentData
      }
    })
    document.dispatchEvent(event)
  }

  /**
   * 根据数值获取颜色
   * @private
   */
  _getColorByValue(value, allValues) {
    if (allValues.length === 0) return '#f0f0f0'
    
    const max = Math.max(...allValues)
    const min = Math.min(...allValues)
    const ratio = max > min ? (value - min) / (max - min) : 0
    
    // 蓝色渐变
    const r = Math.floor(240 - ratio * 180)
    const g = Math.floor(248 - ratio * 100)
    const b = 255
    
    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * 获取颜色范围
   * @private
   */
  _getColorRange(colorScheme) {
    const colorSchemes = {
      blue: ['#e6f3ff', '#cce7ff', '#99d6ff', '#66c2ff', '#33adff', '#0099ff'],
      green: ['#e8f5e8', '#d4edda', '#c3e6cb', '#b8dabc', '#a3cfbb', '#28a745'],
      red: ['#ffeaea', '#ffcccc', '#ffaaaa', '#ff8888', '#ff6666', '#dc3545'],
      purple: ['#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#9c27b0']
    }
    
    return colorSchemes[colorScheme] || colorSchemes.blue
  }

  /**
   * 标准化地区名称，确保与地图数据匹配
   * @param {string} name - 原始地区名称
   * @private
   */
  _normalizeRegionName(name) {
    if (!name) return name
    
    // 标准化地区名称
    
    // 移除常见的后缀
    let cleanName = name.replace(/(省|市|自治区|特别行政区|维吾尔自治区|回族自治区|壮族自治区)$/g, '')
    
    // 特殊地区名称映射
    const nameMapping = {
      '北京': '北京市',
      '上海': '上海市', 
      '天津': '天津市',
      '重庆': '重庆市',
      '内蒙古': '内蒙古自治区',
      '新疆': '新疆维吾尔自治区',
      '西藏': '西藏自治区',
      '宁夏': '宁夏回族自治区',
      '广西': '广西壮族自治区',
      '香港': '香港特别行政区',
      '澳门': '澳门特别行政区',
      '台湾': '台湾省',
      // 添加省份映射
      '广东': '广东省',
      '福建': '福建省',
      '海南': '海南省',
      '山东': '山东省',
      '江苏': '江苏省',
      '浙江': '浙江省',
      '安徽': '安徽省',
      '江西': '江西省',
      '湖北': '湖北省',
      '湖南': '湖南省',
      '河南': '河南省',
      '河北': '河北省',
      '山西': '山西省',
      '陕西': '陕西省',
      '甘肃': '甘肃省',
      '青海': '青海省',
      '四川': '四川省',
      '贵州': '贵州省',
      '云南': '云南省',
      '辽宁': '辽宁省',
      '吉林': '吉林省',
      '黑龙江': '黑龙江省'
    }
    
    return nameMapping[cleanName] || (cleanName + '省')
  }

  /**
   * 获取区域到省份的映射
   * @private
   */
  _getRegionToProvinceMapping() {
    return {
      '华北': ['北京', '天津', '河北', '山西', '内蒙古'],
      '华东': ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'],
      '华南': ['广东', '广西', '海南'],
      '华中': ['河南', '湖北', '湖南'],
      '西南': ['重庆', '四川', '贵州', '云南', '西藏'],
      '西北': ['陕西', '甘肃', '青海', '宁夏', '新疆'],
      '东北': ['辽宁', '吉林', '黑龙江']
    }
  }

  /**
   * 获取简化的中国地图数据
   * @private
   */
  _getChinaMapData() {
    // 使用简化的中国地图数据，包含主要省份
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "北京" },
          geometry: {
            type: "Polygon",
            coordinates: [[[116.0, 39.4], [116.8, 39.4], [116.8, 40.4], [116.0, 40.4], [116.0, 39.4]]]
          }
        },
        {
          type: "Feature", 
          properties: { name: "上海" },
          geometry: {
            type: "Polygon",
            coordinates: [[[121.0, 30.8], [121.8, 30.8], [121.8, 31.6], [121.0, 31.6], [121.0, 30.8]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "天津" },
          geometry: {
            type: "Polygon",
            coordinates: [[[116.8, 38.8], [117.8, 38.8], [117.8, 39.8], [116.8, 39.8], [116.8, 38.8]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "重庆" },
          geometry: {
            type: "Polygon",
            coordinates: [[[105.8, 28.8], [107.8, 28.8], [107.8, 30.8], [105.8, 30.8], [105.8, 28.8]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "河北" },
          geometry: {
            type: "Polygon",
            coordinates: [[[113.5, 36.0], [119.5, 36.0], [119.5, 42.5], [113.5, 42.5], [113.5, 36.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "山西" },
          geometry: {
            type: "Polygon",
            coordinates: [[[110.0, 34.5], [114.5, 34.5], [114.5, 40.5], [110.0, 40.5], [110.0, 34.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "内蒙古" },
          geometry: {
            type: "Polygon",
            coordinates: [[[97.0, 37.5], [126.0, 37.5], [126.0, 53.0], [97.0, 53.0], [97.0, 37.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "辽宁" },
          geometry: {
            type: "Polygon",
            coordinates: [[[118.5, 38.5], [125.5, 38.5], [125.5, 43.5], [118.5, 43.5], [118.5, 38.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "吉林" },
          geometry: {
            type: "Polygon",
            coordinates: [[[121.5, 41.0], [131.0, 41.0], [131.0, 46.5], [121.5, 46.5], [121.5, 41.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "黑龙江" },
          geometry: {
            type: "Polygon",
            coordinates: [[[121.0, 43.5], [135.0, 43.5], [135.0, 53.5], [121.0, 53.5], [121.0, 43.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "江苏" },
          geometry: {
            type: "Polygon",
            coordinates: [[[116.5, 30.5], [121.5, 30.5], [121.5, 35.0], [116.5, 35.0], [116.5, 30.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "浙江" },
          geometry: {
            type: "Polygon",
            coordinates: [[[118.0, 27.0], [123.0, 27.0], [123.0, 31.5], [118.0, 31.5], [118.0, 27.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "安徽" },
          geometry: {
            type: "Polygon",
            coordinates: [[[114.5, 29.5], [119.5, 29.5], [119.5, 34.5], [114.5, 34.5], [114.5, 29.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "福建" },
          geometry: {
            type: "Polygon",
            coordinates: [[[115.5, 23.5], [120.5, 23.5], [120.5, 28.5], [115.5, 28.5], [115.5, 23.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "江西" },
          geometry: {
            type: "Polygon",
            coordinates: [[[113.5, 24.5], [118.5, 24.5], [118.5, 30.0], [113.5, 30.0], [113.5, 24.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "山东" },
          geometry: {
            type: "Polygon",
            coordinates: [[[114.5, 34.5], [122.5, 34.5], [122.5, 38.5], [114.5, 38.5], [114.5, 34.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "河南" },
          geometry: {
            type: "Polygon",
            coordinates: [[[110.5, 31.5], [116.5, 31.5], [116.5, 36.5], [110.5, 36.5], [110.5, 31.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "湖北" },
          geometry: {
            type: "Polygon",
            coordinates: [[[108.0, 29.0], [116.5, 29.0], [116.5, 33.5], [108.0, 33.5], [108.0, 29.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "湖南" },
          geometry: {
            type: "Polygon",
            coordinates: [[[108.5, 24.5], [114.5, 24.5], [114.5, 30.5], [108.5, 30.5], [108.5, 24.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "广东" },
          geometry: {
            type: "Polygon",
            coordinates: [[[109.5, 20.0], [117.5, 20.0], [117.5, 25.5], [109.5, 25.5], [109.5, 20.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "广西" },
          geometry: {
            type: "Polygon",
            coordinates: [[[104.5, 20.5], [112.0, 20.5], [112.0, 26.5], [104.5, 26.5], [104.5, 20.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "海南" },
          geometry: {
            type: "Polygon",
            coordinates: [[[108.5, 18.0], [111.5, 18.0], [111.5, 20.5], [108.5, 20.5], [108.5, 18.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "四川" },
          geometry: {
            type: "Polygon",
            coordinates: [[[97.5, 26.0], [108.5, 26.0], [108.5, 34.0], [97.5, 34.0], [97.5, 26.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "贵州" },
          geometry: {
            type: "Polygon",
            coordinates: [[[103.5, 24.5], [109.5, 24.5], [109.5, 29.0], [103.5, 29.0], [103.5, 24.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "云南" },
          geometry: {
            type: "Polygon",
            coordinates: [[[97.0, 21.0], [106.0, 21.0], [106.0, 29.0], [97.0, 29.0], [97.0, 21.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "西藏" },
          geometry: {
            type: "Polygon",
            coordinates: [[[78.0, 26.5], [99.0, 26.5], [99.0, 36.5], [78.0, 36.5], [78.0, 26.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "陕西" },
          geometry: {
            type: "Polygon",
            coordinates: [[[105.5, 31.5], [111.0, 31.5], [111.0, 39.5], [105.5, 39.5], [105.5, 31.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "甘肃" },
          geometry: {
            type: "Polygon",
            coordinates: [[[92.0, 32.0], [109.0, 32.0], [109.0, 42.5], [92.0, 42.5], [92.0, 32.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "青海" },
          geometry: {
            type: "Polygon",
            coordinates: [[[89.0, 31.5], [103.0, 31.5], [103.0, 39.0], [89.0, 39.0], [89.0, 31.5]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "宁夏" },
          geometry: {
            type: "Polygon",
            coordinates: [[[104.0, 35.0], [107.5, 35.0], [107.5, 39.5], [104.0, 39.5], [104.0, 35.0]]]
          }
        },
        {
          type: "Feature",
          properties: { name: "新疆" },
          geometry: {
            type: "Polygon",
            coordinates: [[[73.0, 34.0], [96.5, 34.0], [96.5, 49.0], [73.0, 49.0], [73.0, 34.0]]]
          }
        }
      ]
    }
  }
}