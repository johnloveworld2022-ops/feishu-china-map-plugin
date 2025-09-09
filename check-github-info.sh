#!/bin/bash

# 检查GitHub仓库信息脚本

echo "🔍 检查GitHub仓库信息..."
echo ""

# 检查是否已经有git仓库
if [ -d ".git" ]; then
    echo "📁 当前目录已是git仓库"
    echo "远程仓库信息:"
    git remote -v
    echo ""
    echo "当前分支:"
    git branch
    echo ""
else
    echo "📁 当前目录不是git仓库"
fi

echo "请提供以下信息:"
echo "1. 你的GitHub用户名"
echo "2. 仓库名称 (feishu-china-map-plugin)"
echo "3. 仓库是否已存在"
echo ""

read -p "GitHub用户名: " username
read -p "仓库名称 [feishu-china-map-plugin]: " repo_name
repo_name=${repo_name:-feishu-china-map-plugin}

echo ""
echo "📋 确认信息:"
echo "GitHub用户名: $username"
echo "仓库名称: $repo_name"
echo "仓库URL: https://github.com/$username/$repo_name"
echo ""

# 检查仓库是否存在
echo "🔍 检查仓库是否存在..."
if curl -s "https://api.github.com/repos/$username/$repo_name" | grep -q '"name"'; then
    echo "✅ 仓库存在"
    REPO_EXISTS=true
else
    echo "❌ 仓库不存在或无法访问"
    REPO_EXISTS=false
fi

echo ""
if [ "$REPO_EXISTS" = true ]; then
    echo "🚀 可以直接更新现有仓库"
    echo "运行: ./update-github-repo.sh"
else
    echo "📝 需要先创建仓库"
    echo "请在GitHub上创建仓库: $repo_name"
    echo "然后运行: ./update-github-repo.sh"
fi

# 保存配置到文件
cat > github-config.txt << EOF
GITHUB_USERNAME=$username
REPO_NAME=$repo_name
REPO_URL=https://github.com/$username/$repo_name.git
REPO_EXISTS=$REPO_EXISTS
EOF

echo ""
echo "✅ 配置已保存到 github-config.txt"