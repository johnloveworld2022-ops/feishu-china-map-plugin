*** /dev/null
--- a/src/sdk/config.js
@@
+function inHost() {
+  return typeof window.getConfig === 'function' &&
+         typeof window.saveConfig === 'function';
+}
+
+export async function readConfig() {
+  try {
+    if (inHost()) {
+      return (await window.getConfig()) || {};
+    }
+    const raw = localStorage.getItem('__feishu_map_plugin_config__');
+    return raw ? JSON.parse(raw) : {};
+  } catch (e) {
+    console.warn('[config] getConfig failed, use {}', e);
+    return {};
+  }
+}
+
+export async function persistConfig(config) {
+  if (inHost()) {
+    await window.saveConfig(config);
+  } else {
+    localStorage.setItem('__feishu_map_plugin_config__', JSON.stringify(config));
+    alert('已在本地保存配置（开发环境模拟）。打到仪表盘后将调用 saveConfig。');
+  }
+}
