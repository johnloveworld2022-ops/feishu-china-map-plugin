/**
 * 飞书多维表格测试配置示例
 * 复制此文件为 test-config.js 并填入你的实际信息
 */

// 飞书API配置
const feishuConfig = {
  // 必需：应用令牌 (从飞书开发者后台获取)
  appToken: 'app_xxxxxxxxxxxxxxxxx',
  
  // 必需：表格ID (从多维表格URL获取)
  tableId: 'tblxxxxxxxxxxxxxxxxx',
  
  // 可选：用户访问令牌 (如果需要用户权限)
  userToken: 'u-xxxxxxxxxxxxxxxxx'
};

// 字段映射配置
const fieldMapping = {
  // 省份字段名 (你的表格中省份列的名称)
  provinceField: '省份',
  
  // 数值字段名 (用于地图颜色标记的数值列)
  valueField: '数量',
  
  // 可选：负责人字段名
  managerField: '负责人',
  
  // 可选：机构字段名
  organizationField: '机构'
};

// 导出配置
module.exports = {
  feishuConfig,
  fieldMapping
};

// 使用方法:
// 1. 将此文件复制为 test-config.js
// 2. 填入你的实际配置信息
// 3. 运行: node run-feishu-test.js