#!/bin/bash

# 手动GitHub更新脚本 - 创建上传包

echo "📦 创建GitHub上传包..."

# 创建上传目录
UPLOAD_DIR="github-upload-package"
if [ -d "$UPLOAD_DIR" ]; then
    rm -rf "$UPLOAD_DIR"
fi
mkdir "$UPLOAD_DIR"

echo "📁 复制必需文件..."

# 复制dist目录
cp -r dist "$UPLOAD_DIR/"
echo "  ✓ 复制 dist/ 目录"

# 复制配置文件
if [ -f "feishu-plugin.json" ]; then
    cp "feishu-plugin.json" "$UPLOAD_DIR/"
    echo "  ✓ 复制 feishu-plugin.json"
fi

# 创建README
cat > "$UPLOAD_DIR/README.md" << 'EOF'
# 飞书中国地图仪表盘插件

基于飞书多维表格的中国地图数据可视化插件，支持自定义区域配置和智能颜色标记。

## 📁 文件结构

```
├── dist/                    # 插件构建文件
│   ├── assets/             # 静态资源
│   ├── locales/            # 国际化文件
│   ├── index.html          # 插件入口
│   ├── manifest.json       # 插件清单
│   └── config.json         # 插件配置
└── feishu-plugin.json      # 飞书插件配置
```

## 🚀 部署说明

此仓库专门用于飞书插件部署，包含所有必需的构建文件。

### 功能特性

- 🗺️ 中国地图可视化
- 📊 数据源集成（飞书多维表格）
- 🎨 智能颜色编码
- ⚙️ 自定义区域配置
- 🌐 多语言支持（中英文）

### 技术规格

- **版本**: v1.0.1
- **类型**: dashboard_widget
- **平台支持**: web, mac, win, mobile
- **权限**: bitable:app, user.info:read

## 📄 许可证

MIT License
EOF

# 创建.gitignore
cat > "$UPLOAD_DIR/.gitignore" << 'EOF'
# 开发文件
node_modules/
.DS_Store
*.log
.env
.env.local

# 编辑器文件
.vscode/
.idea/
*.swp
*.swo

# 临时文件
*.tmp
*.temp
EOF

echo ""
echo "✅ GitHub上传包创建完成!"
echo "📁 位置: $UPLOAD_DIR/"
echo ""
echo "📋 包含文件:"
find "$UPLOAD_DIR" -type f | sort | sed 's/^/  ✓ /'

echo ""
echo "🚀 手动上传步骤:"
echo "1. 打开GitHub仓库: https://github.com/johnloveworld2022-ops/feishu-china-map-plugin"
echo "2. 删除仓库中的所有文件（保留.git相关）"
echo "3. 将 $UPLOAD_DIR/ 目录中的所有文件上传到仓库"
echo "4. 提交更改"
echo ""
echo "💡 或者使用以下命令:"
echo "   cd $UPLOAD_DIR"
echo "   git init"
echo "   git add ."
echo "   git commit -m '🚀 更新飞书插件部署文件'"
echo "   git remote add origin https://github.com/johnloveworld2022-ops/feishu-china-map-plugin.git"
echo "   git branch -M main"
echo "   git push -f origin main"

# 创建ZIP包供下载
ZIP_NAME="github-upload-package.zip"
if [ -f "$ZIP_NAME" ]; then
    rm "$ZIP_NAME"
fi

cd "$UPLOAD_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store"
cd ..

echo ""
echo "📦 也可以下载ZIP包手动上传:"
echo "   文件: $ZIP_NAME"
echo "   大小: $(ls -lh "$ZIP_NAME" | awk '{print $5}')"