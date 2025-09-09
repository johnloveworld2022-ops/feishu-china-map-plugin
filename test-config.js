/**
 * 飞书多维表格测试配置
 * 根据用户提供的信息自动生成
 */

// 飞书API配置
const feishuConfig = {
  appToken: 'PGuTbyauXavdl7s8Jpec2lUAnah',
  tableId: 'tblLawFGl4bUcqHA'
};

// 字段映射配置
const fieldMapping = {
  provinceField: '所属省份',
  valueField: '管理区域',  // 假设这是数值字段，如果不是请告知正确的数值字段
  managerField: '负责人',
  organizationField: '机构名称'
};

// 导出配置
module.exports = {
  feishuConfig,
  fieldMapping
};

// 注意：如果"管理区域"不是数值字段，请告知哪个字段包含数值数据
// 插件需要一个数值字段来进行地图颜色标记