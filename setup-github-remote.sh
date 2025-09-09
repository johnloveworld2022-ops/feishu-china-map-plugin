#!/bin/bash

echo "🔗 配置GitHub远程仓库..."

# 提示用户选择仓库
echo "请选择GitHub仓库配置方式："
echo "1. 使用现有仓库: johnloveworld2022-ops/feishu-china-map-plugin"
echo "2. 创建新仓库（需要你提供仓库地址）"
echo ""

read -p "请输入选择 (1 或 2): " choice

case $choice in
    1)
        echo "🔗 配置现有仓库..."
        REPO_URL="https://github.com/johnloveworld2022-ops/feishu-china-map-plugin.git"
        ;;
    2)
        echo "📝 请提供新仓库地址"
        read -p "请输入GitHub仓库地址 (例: https://github.com/username/repo.git): " REPO_URL
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

# 配置远程仓库
echo "🔗 添加远程仓库: $REPO_URL"
git remote add origin "$REPO_URL"

# 验证配置
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ 远程仓库配置成功"
    echo "📍 远程仓库: $(git remote get-url origin)"
    
    # 推送到GitHub
    echo "🚀 推送到GitHub..."
    if git push -u origin main; then
        echo ""
        echo "🎉 同步成功！"
        echo "📍 GitHub仓库已更新"
        echo "🚀 飞书工作人员现在可以直接部署dist目录"
        echo ""
        echo "📋 部署信息："
        echo "  - 仓库地址: $REPO_URL"
        echo "  - 部署目录: dist/"
        echo "  - 入口文件: index.html"
        echo "  - 最新提交: $(git rev-parse --short HEAD)"
    else
        echo "❌ 推送失败，可能的原因："
        echo "1. 仓库不存在或无权限"
        echo "2. 网络连接问题"
        echo "3. 需要先在GitHub创建仓库"
        echo ""
        echo "💡 解决方案："
        echo "1. 确保在GitHub上创建了仓库"
        echo "2. 检查仓库地址是否正确"
        echo "3. 确保有推送权限"
    fi
else
    echo "❌ 远程仓库配置失败"
    exit 1
fi