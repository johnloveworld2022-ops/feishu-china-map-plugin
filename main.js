// main.js - Feishu China Map Plugin 入口文件（带保存配置 + 多维表格读取最小实现）
import './style.css'

/**
 * 仪表盘配置适配器：
 * - 仪表盘环境下用 window.dashboard.saveConfig/getConfig
 * - 本地开发环境用 localStorage 模拟
 */
const dash = {
  async getConfig() {
    if (window.dashboard?.getConfig) {
      return await window.dashboard.getConfig()
    }
    try {
      return JSON.parse(localStorage.getItem('__feishu_map_plugin_config__') || '{}')
    } catch {
      return {}
    }
  },
  async saveConfig(config) {
    if (window.dashboard?.saveConfig) {
      return await window.dashboard.saveConfig(config)
    }
    localStorage.setItem('__feishu_map_plugin_config__', JSON.stringify(config || {}))
  },
}

document.querySelector('#root').innerHTML = `
  <div class="plugin-wrap">
    <h1>Feishu China Map Plugin</h1>
    
    <div class="config-card">
      <h2>配置（JSON）</h2>
      <textarea id="cfg-input" rows="6" placeholder='{
  "title": "中国地图",
  "bitable": {
    "appToken": "app_xxx",
    "tableId": "tblNW3Hb6OMLgGBZ",
    "viewId": "vew40ITYFQ"
  }
}'></textarea>
      <div class="actions">
        <button id="btn-save">保存到仪表盘</button>
        <span id="save-hint" class="hint"></span>
      </div>
    </div>

    <div class="preview">
      <h2 id="preview-title">预览</h2>
      <div id="preview-map">地图渲染逻辑请在这里补充</div>
    </div>
  </div>
`

const $ = (sel) => document.querySelector(sel)
const $input = $('#cfg-input')
const $hint  = $('#save-hint')
const $title = $('#preview-title')

/**
 * 从后端代理读取多维表格记录（最小实现）
 * ⚠️ 把下面的 `API_BASE` 改成你的后端地址；若你在 Vite 里做了本地代理，也可以保留相对路径。
 * - 后端接口建议为 POST /api/bitable/search（见我之前发的 server.js 示例）
 * - 请求体需要 appToken/tableId/viewId/pageSize（可选）
 */
const API_BASE = '' // 例如 'https://your-domain.com'；留空则走相对路径
async function fetchBitableRecords(cfg) {
  if (!cfg?.bitable?.appToken || !cfg?.bitable?.tableId || !cfg?.bitable?.viewId) {
    throw new Error('缺少 bitable.appToken/tableId/viewId')
  }
  const resp = await fetch(`${API_BASE}/api/bitable/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appToken: cfg.bitable.appToken,
      tableId:  cfg.bitable.tableId,
      viewId:   cfg.bitable.viewId,
      pageSize: 20
    })
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok || data.code) {
    throw new Error(data?.msg || `bitable api error (http ${resp.status})`)
  }
  // 标准返回结构：data.data.items
  return data?.data?.items || []
}

/** 用当前配置渲染页面（此处演示读取多维表格后显示条数；你可替换为地图渲染） */
function renderWithConfig(cfg = {}) {
  $title.textContent = cfg.title || '预览'
  const container = document.getElementById('preview-map')

  // 若配置了多维表格三件套，尝试读取数据
  if (cfg.bitable?.appToken && cfg.bitable?.tableId && cfg.bitable?.viewId) {
    container.textContent = '正在读取多维表格数据...'
    fetchBitableRecords(cfg)
      .then((items) => {
        // 这里先简单显示数量；你可以把 items 映射成地图需要的数据结构再渲染
        container.innerHTML = `
          <div style="font-size:14px;line-height:1.6">
            <div>读取到 <b>${items.length}</b> 条记录</div>
            <div style="opacity:.7">（你可以在这里把 records 转成 {name,value} 渲染地图）</div>
          </div>
        `
        // TODO: 在这里把 items 转为 [{name, value}] 后，调用你的地图渲染函数
      })
      .catch((e) => {
        console.error(e)
        container.textContent = '读取失败：' + e.message
      })
  } else {
    // 未配置 bitable 时的占位提示
    container.textContent = '地图渲染逻辑请在这里补充'
  }
}

/** 初始化：渲染阶段从 getConfig 读取“已保存”的配置并使用它 */
;(async function bootstrap() {
  const saved = await dash.getConfig()
  $input.value = JSON.stringify(saved || {}, null, 2)
  renderWithConfig(saved)
})()

/** 点击“保存到仪表盘”：只有这里会真正写入仪表盘 */
$('#btn-save').addEventListener('click', async () => {
  $hint.textContent = ''
  try {
    const parsed = $input.value.trim() ? JSON.parse($input.value) : {}
    await dash.saveConfig(parsed)
    $hint.textContent = '已保存到仪表盘'
    renderWithConfig(parsed)
  } catch (e) {
    console.error(e)
    $hint.textContent = '保存失败：请检查 JSON 格式'
  }
})
