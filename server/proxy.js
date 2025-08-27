/**
 * 飞书多维表格 API 代理服务
 * 用于开发环境测试，避免 CORS 问题
 */
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const PORT = 3001

// 飞书 API 配置
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis'

// 中间件
app.use(cors())
app.use(express.json())

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

/**
 * 测试连接接口
 */
app.post('/api/bitable/test', async (req, res) => {
  try {
    const { appToken, tableId, viewId, accessToken } = req.body
    
    if (!appToken || !tableId || !viewId) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必要参数'
      })
    }

    // 使用传入的 accessToken 或环境变量中的 token
    const token = accessToken || process.env.FEISHU_ACCESS_TOKEN
    
    if (!token || token === 'your_access_token_here') {
      return res.status(401).json({
        code: 401,
        msg: '缺少有效的访问令牌。请在配置中提供 accessToken 或设置环境变量 FEISHU_ACCESS_TOKEN'
      })
    }

    // 尝试获取表格信息来测试连接
    const response = await fetch(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records?view_id=${viewId}&page_size=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      console.error('飞书API错误:', data)
      return res.status(response.status).json({
        code: response.status,
        msg: data.msg || '飞书 API 调用失败',
        details: data
      })
    }

    res.json({
      code: 0,
      msg: 'success',
      data: {
        connected: true,
        recordCount: data.data?.total || 0
      }
    })
  } catch (error) {
    console.error('测试连接失败:', error)
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误: ' + error.message
    })
  }
})

/**
 * 获取记录接口
 */
app.post('/api/bitable/search', async (req, res) => {
  try {
    const { appToken, tableId, viewId, pageSize = 100, pageToken, accessToken } = req.body
    
    if (!appToken || !tableId || !viewId) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必要参数'
      })
    }

    // 使用传入的 accessToken 或环境变量中的 token
    const token = accessToken || process.env.FEISHU_ACCESS_TOKEN
    
    if (!token || token === 'your_access_token_here') {
      return res.status(401).json({
        code: 401,
        msg: '缺少有效的访问令牌。请在配置中提供 accessToken 或设置环境变量 FEISHU_ACCESS_TOKEN'
      })
    }

    // 构建查询参数
    const params = new URLSearchParams({
      view_id: viewId,
      page_size: pageSize.toString()
    })
    
    if (pageToken) {
      params.append('page_token', pageToken)
    }

    const response = await fetch(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      console.error('飞书API错误:', data)
      return res.status(response.status).json({
        code: response.status,
        msg: data.msg || '飞书 API 调用失败',
        details: data
      })
    }

    res.json({
      code: 0,
      msg: 'success',
      data: data.data
    })
  } catch (error) {
    console.error('获取记录失败:', error)
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误: ' + error.message
    })
  }
})

/**
 * 获取表格结构接口
 */
app.post('/api/bitable/schema', async (req, res) => {
  try {
    const { appToken, tableId } = req.body
    
    if (!appToken || !tableId) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必要参数'
      })
    }

    const response = await fetch(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.FEISHU_ACCESS_TOKEN || 'your_access_token_here'}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(response.status).json({
        code: response.status,
        msg: data.msg || '飞书 API 调用失败'
      })
    }

    res.json({
      code: 0,
      msg: 'success',
      data: data.data
    })
  } catch (error) {
    console.error('获取表格结构失败:', error)
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误: ' + error.message
    })
  }
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 飞书多维表格代理服务已启动`)
  console.log(`📍 服务地址: http://localhost:${PORT}`)
  console.log(`🔧 环境变量 FEISHU_ACCESS_TOKEN: ${process.env.FEISHU_ACCESS_TOKEN ? '已设置' : '未设置'}`)
  console.log(`📝 请确保设置了正确的飞书访问令牌`)
})

export default app