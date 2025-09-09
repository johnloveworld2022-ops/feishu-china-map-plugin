# GitHub仓库更新指南

## 🎯 目标

将本地整理好的飞书插件文件上传到GitHub仓库，只保留飞书部署所需的文件。

## 📋 准备工作

1. **确保你有GitHub仓库**
   - 仓库名建议：`feishu-china-map-plugin`
   - 如果没有，请先在GitHub上创建

2. **确保本地有git权限**
   - 已配置GitHub SSH密钥或Personal Access Token
   - 可以正常push到你的仓库

## 🚀 操作步骤

### 第一步：检查GitHub信息
```bash
./check-github-info.sh
```

这个脚本会：
- 检查你的GitHub用户名和仓库信息
- 验证仓库是否存在
- 保存配置到 `github-config.txt`

### 第二步：更新GitHub仓库
```bash
./update-github-repo.sh
```

这个脚本会：
1. 克隆你的GitHub仓库到临时目录
2. 清理仓库，删除所有开发文件
3. 复制本地的 `dist/` 目录和配置文件
4. 创建简洁的README和.gitignore
5. 提交并推送到GitHub

## 📁 更新后的仓库结构

```
feishu-china-map-plugin/
├── dist/                    # 插件构建文件
│   ├── assets/             # 静态资源
│   │   ├── echarts-*.js    # ECharts库
│   │   ├── index-*.js      # 主程序
│   │   ├── vendor-*.js     # 第三方依赖
│   │   └── index-*.css     # 样式文件
│   ├── locales/            # 国际化文件
│   │   ├── zh_cn.json      # 中文
│   │   └── en_us.json      # 英文
│   ├── index.html          # 插件入口
│   ├── manifest.json       # 插件清单
│   ├── config.json         # 插件配置
│   ├── icon-16.png         # 图标
│   └── icon.svg            # 矢量图标
├── feishu-plugin.json      # 飞书插件配置
├── README.md               # 说明文档
├── .gitignore              # Git忽略文件
└── LICENSE                 # 许可证（如果原来有）
```

## ✅ 验证结果

更新完成后，你可以：

1. **访问GitHub仓库**
   - 检查文件是否正确上传
   - 确认只有必需的文件

2. **在飞书开发者后台**
   - 使用GitHub仓库地址部署
   - 或下载仓库ZIP文件上传

## 🔧 故障排除

### 问题1：克隆仓库失败
**解决方案**：
- 检查仓库是否存在
- 确认GitHub用户名和仓库名正确
- 验证git权限配置

### 问题2：推送失败
**解决方案**：
- 检查网络连接
- 确认有仓库写入权限
- 尝试使用SSH或HTTPS认证

### 问题3：仓库不存在
**解决方案**：
1. 登录GitHub
2. 创建新仓库：`feishu-china-map-plugin`
3. 设置为Public（如果要公开）
4. 重新运行脚本

## 📞 支持

如果遇到问题，请检查：
1. GitHub仓库权限
2. 本地git配置
3. 网络连接状态

## 🎉 完成

更新成功后，你的GitHub仓库就可以直接用于飞书插件部署了！