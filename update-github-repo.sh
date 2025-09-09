#!/bin/bash

# GitHub仓库更新脚本
# 清理GitHub仓库，只保留飞书部署所需文件，并上传本地dist

echo "🚀 开始更新GitHub仓库 feishu-china-map-plugin..."

# 检查是否在正确的目录
if [ ! -d "dist" ]; then
    echo "❌ 错误: 当前目录没有dist文件夹"
    echo "请在 feishu-china-map-dashboard 目录下运行此脚本"
    exit 1
fi

# 检查是否有git命令
if ! command -v git &> /dev/null; then
    echo "❌ 错误: 未找到git命令"
    exit 1
fi

# 读取配置文件
if [ -f "github-config.txt" ]; then
    echo "📖 读取配置文件..."
    source github-config.txt
    echo "GitHub用户名: $GITHUB_USERNAME"
    echo "仓库名称: $REPO_NAME"
    echo "仓库URL: $REPO_URL"
    echo ""
else
    echo "⚠️  未找到配置文件，请先运行: ./check-github-info.sh"
    echo ""
    read -p "请输入你的GitHub用户名: " GITHUB_USERNAME
    read -p "请输入仓库名称 [feishu-china-map-plugin]: " REPO_NAME
    REPO_NAME=${REPO_NAME:-feishu-china-map-plugin}
    REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi

echo "📋 确认信息:"
echo "GitHub用户名: $GITHUB_USERNAME"
echo "仓库名称: $REPO_NAME"
echo "仓库URL: $REPO_URL"
echo ""
read -p "确认继续? (y/N): " confirm
if [ "$confirm" != "y" ]; then
    echo "取消操作"
    exit 0
fi

# 创建临时目录
TEMP_DIR="temp_github_update"
if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
fi

echo "📁 克隆GitHub仓库..."
git clone "$REPO_URL" "$TEMP_DIR"
if [ $? -ne 0 ]; then
    echo "❌ 克隆仓库失败，请检查仓库URL和权限"
    echo "💡 提示: 请确保仓库存在且有访问权限"
    echo "💡 如果仓库不存在，请先在GitHub上创建仓库: $REPO_NAME"
    exit 1
fi

cd "$TEMP_DIR"

echo "🧹 清理仓库，只保留必要文件..."

# 保留的文件和目录
KEEP_FILES=(".git" ".gitignore" "README.md" "LICENSE")

# 删除除保留文件外的所有内容
for item in *; do
    if [[ ! " ${KEEP_FILES[@]} " =~ " ${item} " ]]; then
        echo "删除: $item"
        rm -rf "$item"
    fi
done

# 删除隐藏文件（除了.git和.gitignore）
for item in .*; do
    if [[ "$item" != "." && "$item" != ".." && ! " ${KEEP_FILES[@]} " =~ " ${item} " ]]; then
        echo "删除隐藏文件: $item"
        rm -rf "$item"
    fi
done

echo "📦 复制本地dist目录和配置文件..."

# 复制dist目录
cp -r "../dist" .
echo "  ✓ 复制 dist/ 目录"

# 复制配置文件
if [ -f "../feishu-plugin.json" ]; then
    cp "../feishu-plugin.json" .
    echo "  ✓ 复制 feishu-plugin.json"
fi

# 创建简洁的README
cat > README.md << 'EOF'
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

echo "📝 创建 .gitignore 文件..."
cat > .gitignore << 'EOF'
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

echo "📊 检查文件状态..."
git add .
git status

echo ""
echo "📋 将要提交的文件:"
find . -type f -not -path "./.git/*" | sort | sed 's/^/  ✓ /'

echo ""
read -p "确认提交这些更改? (y/N): " commit_confirm
if [ "$commit_confirm" != "y" ]; then
    echo "取消提交"
    cd ..
    rm -rf "$TEMP_DIR"
    exit 0
fi

echo "💾 提交更改..."
git add .
git commit -m "🚀 更新插件部署文件

- 清理仓库，只保留飞书部署必需文件
- 更新dist目录到最新版本
- 添加插件配置文件
- 优化README文档

版本: v1.0.1
类型: 飞书插件部署专用"

echo "⬆️ 推送到GitHub..."
git push origin main
if [ $? -ne 0 ]; then
    # 尝试推送到master分支
    echo "尝试推送到master分支..."
    git push origin master
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ GitHub仓库更新成功!"
    echo "🔗 仓库地址: $REPO_URL"
    echo ""
    echo "📋 更新内容:"
    echo "  ✓ 清理了所有开发文件"
    echo "  ✓ 保留了飞书部署必需文件"
    echo "  ✓ 更新了最新的dist目录"
    echo "  ✓ 添加了插件配置文件"
    echo "  ✓ 优化了README文档"
    echo ""
    echo "🎯 现在可以直接从GitHub仓库部署到飞书了!"
else
    echo "❌ 推送失败，请检查网络连接和仓库权限"
fi

# 清理临时目录
cd ..
rm -rf "$TEMP_DIR"

echo "🧹 清理完成"