// main.js - Feishu China Map Plugin 入口文件（带保存配置功能）
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
      <textarea id="cfg-input" rows="6" placeholder='{"title":"中国地图"}'></textarea>
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

function renderWithConfig(cfg = {}) {
  $title.textContent = cfg.title || '预览'
  // TODO: 在这里加入地图渲染逻辑，并使用 cfg 里的参数控制显示
}

;(async function bootstrap() {
  const saved = await dash.getConfig()
  $input.value = JSON.stringify(saved || {}, null, 2)
  renderWithConfig(saved)
})()

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
