#!/bin/bash

# 飞书插件上传包创建脚本
# 使用dist目录创建符合飞书要求的上传包

echo "🚀 开始创建飞书插件上传包..."

# 检查dist目录是否存在
if [ ! -d "dist" ]; then
    echo "❌ 错误: dist目录不存在"
    echo "请先构建项目生成dist目录"
    exit 1
fi

# 创建临时目录
TEMP_DIR="feishu-plugin-upload"
if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
fi
mkdir "$TEMP_DIR"

echo "📁 复制必需文件到临时目录..."

# 复制dist目录的所有内容
cp -r dist/* "$TEMP_DIR/"

# 复制插件配置文件到根目录
if [ -f "feishu-plugin.json" ]; then
    cp feishu-plugin.json "$TEMP_DIR/"
    echo "  ✓ 复制 feishu-plugin.json"
else
    echo "  ⚠️  警告: feishu-plugin.json 不存在"
fi

# 显示将要打包的文件
echo ""
echo "📋 将要打包的文件列表:"
find "$TEMP_DIR" -type f | sort | sed 's/^/  ✓ /'

# 创建ZIP包
ZIP_NAME="feishu-china-map-dashboard-upload.zip"
if [ -f "$ZIP_NAME" ]; then
    rm "$ZIP_NAME"
fi

echo ""
echo "📦 创建上传包: $ZIP_NAME"
cd "$TEMP_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store" "*.map"
cd ..

# 清理临时目录
rm -rf "$TEMP_DIR"

# 显示结果
if [ -f "$ZIP_NAME" ]; then
    FILE_SIZE=$(ls -lh "$ZIP_NAME" | awk '{print $5}')
    echo ""
    echo "✅ 上传包创建成功!"
    echo "📁 文件名: $ZIP_NAME"
    echo "📏 文件大小: $FILE_SIZE"
    echo ""
    echo "🎯 使用说明:"
    echo "1. 登录飞书开发者后台"
    echo "2. 上传 $ZIP_NAME 文件"
    echo "3. 按照飞书审核流程提交"
    echo ""
    echo "📋 包含的文件:"
    unzip -l "$ZIP_NAME" | grep -v "Archive:" | grep -v "Length" | grep -v "^-" | grep -v "files$" | awk '{print "  ✓ " $4}'
else
    echo "❌ 创建上传包失败"
    exit 1
fi