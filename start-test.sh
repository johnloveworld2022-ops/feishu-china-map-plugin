#!/bin/bash

# 飞书多维表格集成测试启动脚本

echo "🚀 飞书多维表格集成测试工具"
echo "================================"
echo ""

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 环境检查通过"
echo ""

# 检查是否存在配置文件
if [ -f "test-config.js" ]; then
    echo "📋 发现现有配置文件"
    echo ""
    echo "选择操作:"
    echo "1) 使用现有配置运行测试"
    echo "2) 重新配置"
    echo "3) 退出"
    echo ""
    read -p "请选择 (1-3): " choice
    
    case $choice in
        1)
            echo "🚀 使用现有配置运行测试..."
            node run-feishu-test.js
            ;;
        2)
            echo "🔧 启动配置向导..."
            node setup-wizard.js
            ;;
        3)
            echo "👋 再见！"
            exit 0
            ;;
        *)
            echo "❌ 无效选择"
            exit 1
            ;;
    esac
else
    echo "📋 未找到配置文件，启动配置向导..."
    echo ""
    node setup-wizard.js
fi