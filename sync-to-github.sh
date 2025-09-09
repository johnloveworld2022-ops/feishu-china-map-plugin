#!/bin/bash

# 飞书插件GitHub同步脚本
# 将本地修改同步到GitHub仓库

echo "🚀 开始同步飞书插件到GitHub..."

# 检查是否在正确的目录
if [ ! -d "dist" ]; then
    echo "❌ 错误：未找到dist目录，请确保在feishu-china-map-dashboard目录下运行"
    exit 1
fi

# 检查Git状态
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
    git branch -M main
fi

# 添加所有修改的文件
echo "📝 添加修改的文件..."
git add .

# 检查是否有修改
if git diff --staged --quiet; then
    echo "ℹ️  没有检测到修改，无需同步"
    exit 0
fi

# 显示将要提交的修改
echo "📋 将要提交的修改："
git diff --staged --name-only

# 提交修改
COMMIT_MESSAGE="🔄 更新飞书插件 - $(date '+%Y-%m-%d %H:%M:%S')

✅ 主要更新：
- 完善数据导入确认流程
- 优化区域着色逻辑（按机构数量调整深浅）
- 增强用户界面交互
- 修复多维表格字段映射

🎯 满足部署要求：
1. dist目录可直接部署
2. 完整的数据确认流程
3. 按区域着色，机构数越多颜色越深"

echo "💾 提交修改..."
git commit -m "$COMMIT_MESSAGE"

# 检查是否配置了远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  警告：未配置远程仓库"
    echo "请先配置GitHub仓库："
    echo "git remote add origin https://github.com/你的用户名/feishu-china-map-dashboard.git"
    echo ""
    echo "或者如果仓库已存在："
    echo "git remote add origin https://github.com/johnloveworld2022-ops/feishu-china-map-plugin.git"
    exit 1
fi

# 推送到GitHub
echo "🌐 推送到GitHub..."
if git push origin main; then
    echo ""
    echo "🎉 同步成功！"
    echo "📍 GitHub仓库已更新"
    echo "🚀 飞书工作人员现在可以直接部署dist目录"
    echo ""
    echo "📋 部署信息："
    echo "  - 仓库地址: $(git remote get-url origin)"
    echo "  - 部署目录: dist/"
    echo "  - 入口文件: index.html"
    echo "  - 最新提交: $(git rev-parse --short HEAD)"
else
    echo "❌ 推送失败，请检查："
    echo "1. 网络连接"
    echo "2. GitHub仓库权限"
    echo "3. 远程仓库地址是否正确"
    exit 1
fi

echo ""
echo "✅ 飞书插件已准备就绪，可以部署！"