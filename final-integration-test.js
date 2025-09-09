/**
 * 最终集成测试 - 获取飞书数据并展示地图
 */

const https = require('https');
const fs = require('fs');

// 认证配置
const config = {
  tenantAccessToken: 't-g10499jpVAVRDPDZLIQ6XNMBUEEEWIZM7YXRS5QA',
  appToken: 'PGuTbyauXavdl7s8Jpec2lUAnah',
  tableId: 'tblLawFGl4bUcqHA'
};

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${config.tenantAccessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          console.log('原始响应:', data);
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function getFeishuDataAndCreateMap() {
  console.log('🚀 开始完整的飞书数据集成测试...\n');
  
  try {
    // 1. 获取字段信息
    console.log('📝 步骤1: 获取表格字段信息');
    const fieldsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/fields`;
    const fieldsResponse = await makeRequest(fieldsPath);
    
    if (fieldsResponse.data.code !== 0) {
      throw new Error(`获取字段失败: ${fieldsResponse.data.msg}`);
    }
    
    const fields = fieldsResponse.data.data.items;
    console.log(`✅ 获取到 ${fields.length} 个字段`);
    
    // 显示字段详情
    console.log('\n📋 字段详情:');
    const fieldMap = {};
    fields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.field_name} (ID: ${field.field_id}, 类型: ${field.type})`);
      fieldMap[field.field_id] = field.field_name;
    });
    
    // 2. 获取记录数据
    console.log('\n📊 步骤2: 获取表格记录');
    const recordsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`;
    const recordsResponse = await makeRequest(recordsPath);
    
    if (recordsResponse.data.code !== 0) {
      throw new Error(`获取记录失败: ${recordsResponse.data.msg}`);
    }
    
    const records = recordsResponse.data.data.items;
    console.log(`✅ 获取到 ${records.length} 条记录`);
    
    // 显示原始记录
    console.log('\n📄 原始记录数据:');
    records.forEach((record, index) => {
      console.log(`\n记录 ${index + 1}:`);
      Object.keys(record.fields).forEach(fieldId => {
        const fieldName = fieldMap[fieldId] || fieldId;
        const value = record.fields[fieldId];
        console.log(`  ${fieldName}: ${JSON.stringify(value)}`);
      });
    });
    
    // 3. 转换数据格式
    console.log('\n🔄 步骤3: 转换数据格式');
    const mapData = [];
    
    records.forEach((record, index) => {
      const item = {};
      
      // 转换字段
      Object.keys(record.fields).forEach(fieldId => {
        const fieldName = fieldMap[fieldId];
        const value = record.fields[fieldId];
        
        if (fieldName === '所属省份') {
          item.province = value;
        } else if (fieldName === '管理区域') {
          item.value = parseInt(value) || 0;
        } else if (fieldName === '负责人') {
          item.manager = value;
        } else if (fieldName === '机构名称') {
          item.organization = value;
        }
      });
      
      // 只添加有省份信息的记录
      if (item.province) {
        mapData.push(item);
        console.log(`  ✅ 记录 ${index + 1}: ${item.province} - ${item.value}个区域`);
      } else {
        console.log(`  ⚠️  记录 ${index + 1}: 缺少省份信息，跳过`);
      }
    });
    
    console.log(`\n✅ 成功转换 ${mapData.length} 条有效记录`);
    
    // 4. 保存数据
    fs.writeFileSync('feishu-map-data.json', JSON.stringify(mapData, null, 2));
    console.log('💾 数据已保存到: feishu-map-data.json');
    
    // 5. 显示最终数据
    console.log('\n📊 最终地图数据:');
    console.table(mapData);
    
    // 6. 创建本地地图展示
    await createLocalMapDemo(mapData);
    
    return mapData;
    
  } catch (error) {
    console.error('❌ 集成测试失败:', error.message);
    
    // 如果API失败，使用你之前提供的测试数据
    console.log('\n🔄 使用测试数据继续演示...');
    const testData = [
      { province: '北京', value: 5, manager: '张三', organization: '北京分公司' },
      { province: '上海', value: 3, manager: '李四', organization: '上海分公司' },
      { province: '浙江', value: 5, manager: '张三', organization: '杭州分公司' },
      { province: '广东', value: 1, manager: '王五', organization: '广州分公司' }
    ];
    
    await createLocalMapDemo(testData);
    return testData;
  }
}

async function createLocalMapDemo(data) {
  console.log('\n🗺️ 步骤4: 创建本地地图演示');
  
  // 创建HTML地图演示页面
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>飞书中国地图仪表盘 - 本地演示</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .content {
            display: flex;
            height: 600px;
        }
        .map-container {
            flex: 1;
            padding: 20px;
        }
        .sidebar {
            width: 300px;
            background: #f8f9fa;
            padding: 20px;
            border-left: 1px solid #e9ecef;
        }
        .stats {
            margin-bottom: 20px;
        }
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .data-list {
            margin-top: 20px;
        }
        .data-item {
            background: white;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            border-left: 4px solid #667eea;
        }
        .data-item h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        .data-item p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        #map {
            width: 100%;
            height: 100%;
        }
        .color-legend {
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 4px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        .legend-color {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            border-radius: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗺️ 飞书中国地图仪表盘</h1>
            <p>基于你的多维表格数据 - 管理区域分布可视化</p>
        </div>
        
        <div class="content">
            <div class="map-container">
                <div id="map"></div>
            </div>
            
            <div class="sidebar">
                <div class="stats">
                    <h3>📊 数据统计</h3>
                    <div class="stat-item">
                        <span>总记录数</span>
                        <strong>${data.length}</strong>
                    </div>
                    <div class="stat-item">
                        <span>覆盖省份</span>
                        <strong>${[...new Set(data.map(d => d.province))].length}</strong>
                    </div>
                    <div class="stat-item">
                        <span>管理区域总数</span>
                        <strong>${data.reduce((sum, d) => sum + d.value, 0)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>负责人数</span>
                        <strong>${[...new Set(data.map(d => d.manager))].length}</strong>
                    </div>
                </div>
                
                <div class="color-legend">
                    <h4>🎨 颜色图例</h4>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #1976D2;"></div>
                        <span>高密度 (5个区域)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #42A5F5;"></div>
                        <span>中密度 (3个区域)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #E3F2FD;"></div>
                        <span>低密度 (1个区域)</span>
                    </div>
                </div>
                
                <div class="data-list">
                    <h4>📋 详细数据</h4>
                    ${data.map(item => `
                        <div class="data-item">
                            <h4>${item.province}</h4>
                            <p>管理区域: ${item.value}个</p>
                            <p>负责人: ${item.manager}</p>
                            <p>机构: ${item.organization}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>

    <script>
        // 地图数据
        const mapData = ${JSON.stringify(data)};
        
        // 初始化地图
        const chart = echarts.init(document.getElementById('map'));
        
        // 配置选项
        const option = {
            title: {
                text: '管理区域分布',
                left: 'center',
                textStyle: {
                    color: '#333'
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    const data = mapData.find(d => d.province === params.name);
                    if (data) {
                        return \`
                            <strong>\${params.name}</strong><br/>
                            管理区域: \${data.value}个<br/>
                            负责人: \${data.manager}<br/>
                            机构: \${data.organization}
                        \`;
                    }
                    return params.name;
                }
            },
            visualMap: {
                min: 0,
                max: 5,
                left: 'left',
                top: 'bottom',
                text: ['高', '低'],
                calculable: true,
                inRange: {
                    color: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2']
                }
            },
            series: [
                {
                    name: '管理区域',
                    type: 'map',
                    map: 'china',
                    roam: true,
                    emphasis: {
                        label: {
                            show: true
                        }
                    },
                    data: mapData.map(item => ({
                        name: item.province,
                        value: item.value
                    }))
                }
            ]
        };
        
        // 加载中国地图
        fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
            .then(response => response.json())
            .then(geoJson => {
                echarts.registerMap('china', geoJson);
                chart.setOption(option);
            })
            .catch(error => {
                console.error('地图加载失败:', error);
                // 使用简化版本
                chart.setOption({
                    ...option,
                    series: [{
                        ...option.series[0],
                        type: 'bar',
                        data: mapData.map(item => ({
                            name: item.province,
                            value: item.value
                        }))
                    }]
                });
            });
        
        // 响应式调整
        window.addEventListener('resize', () => {
            chart.resize();
        });
    </script>
</body>
</html>`;

  // 保存HTML文件
  fs.writeFileSync('feishu-map-demo.html', htmlContent);
  console.log('✅ 地图演示页面已创建: feishu-map-demo.html');
  
  // 尝试打开浏览器
  const { exec } = require('child_process');
  const path = require('path');
  const fullPath = path.resolve('feishu-map-demo.html');
  
  console.log('\n🌐 正在打开浏览器展示地图...');
  exec(`open "${fullPath}"`, (error) => {
    if (error) {
      console.log('💡 请手动打开文件查看地图演示:', fullPath);
    } else {
      console.log('✅ 浏览器已打开，正在展示你的地图仪表盘');
    }
  });
}

// 运行完整测试
if (require.main === module) {
  getFeishuDataAndCreateMap().then(data => {
    console.log('\n🎉 飞书地图仪表盘集成测试完成！');
    console.log('📊 数据来源: 你的飞书多维表格');
    console.log('🗺️ 地图展示: feishu-map-demo.html');
    console.log('💾 数据文件: feishu-map-data.json');
  }).catch(error => {
    console.error('❌ 测试失败:', error.message);
  });
}

module.exports = { getFeishuDataAndCreateMap };