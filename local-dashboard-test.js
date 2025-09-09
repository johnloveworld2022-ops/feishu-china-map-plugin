/**
 * 飞书中国地图仪表盘本地测试
 * 使用你提供的多维表格数据
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 你提供的认证信息
const config = {
  tenantAccessToken: 't-g1049a5SG3LCNHXTWTG426OSKQIXHKKEUKQSCDEQ',
  appToken: 'PGuTbyauXavdl7s8Jpec2lUAnah',
  tableId: 'tblLawFGl4bUcqHA'
};

// 字段映射（实际数据直接使用中文字段名）
const fieldMapping = {
  'fldL45buNW': '机构名称',
  'fld48tqp4P': '所属省份',
  'fld7Xn8BEw': '负责人',
  'fldk2r1GlD': '管理区域'
};

function makeFeishuRequest(path, options = {}) {
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ statusCode: res.statusCode, error: error.message, rawData: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function fetchYourData() {
  console.log('🔄 正在获取你的多维表格数据...\n');
  
  try {
    const recordsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`;
    const result = await makeFeishuRequest(recordsPath);
    
    if (result.data && result.data.code === 0) {
      const records = result.data.data.items;
      console.log(`✅ 成功获取 ${records.length} 条记录`);
      
      // 转换数据格式（直接使用中文字段名）
      const convertedData = records.map(record => {
        const fields = record.fields;
        return {
          province: fields['所属省份'] ? fields['所属省份'].replace('省', '') : '未知',
          value: fields['管理区域'] === '华东' ? 5 : fields['管理区域'] === '华南' ? 3 : 1,
          manager: fields['负责人'] || '未知',
          organization: fields['机构名称'] || '未知'
        };
      });

      console.log('📊 你的数据:');
      console.table(convertedData);
      return convertedData;
    } else {
      throw new Error(`API错误: ${result.data ? result.data.msg : '未知错误'}`);
    }
  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    return null;
  }
}

function createDashboardHTML(data) {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗺️ 飞书中国地图仪表盘 - 你的数据展示</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 16px;
        }
        
        .main-content {
            display: flex;
            min-height: 700px;
        }
        
        .map-section {
            flex: 1;
            padding: 30px;
            background: #fafafa;
        }
        
        .map-container {
            background: white;
            border-radius: 12px;
            padding: 20px;
            height: 600px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .sidebar {
            width: 350px;
            background: white;
            padding: 30px;
            border-left: 1px solid #e9ecef;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stats-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        
        .stats-title {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 8px;
        }
        
        .stats-value {
            font-size: 24px;
            font-weight: bold;
        }
        
        .data-section {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }
        
        .data-item {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: transform 0.2s ease;
        }
        
        .data-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .province-name {
            font-weight: 600;
            font-size: 16px;
            color: #333;
            margin-bottom: 5px;
        }
        
        .item-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .item-info {
            font-size: 14px;
            color: #666;
        }
        
        .region-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .legend {
            margin-top: 20px;
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .legend-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
        }
        
        .legend-items {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            font-size: 12px;
            color: #666;
        }
        
        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            margin-right: 6px;
        }
        
        .update-time {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗺️ 飞书中国地图仪表盘</h1>
            <p>基于你的多维表格真实数据展示 | 实时更新</p>
        </div>
        
        <div class="main-content">
            <div class="map-section">
                <div class="map-container">
                    <div id="map" style="width: 100%; height: 100%;"></div>
                </div>
                
                <div class="legend">
                    <div class="legend-title">区域密度图例</div>
                    <div class="legend-items">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #1976D2;"></span>
                            高密度 (5个区域)
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #42A5F5;"></span>
                            中密度 (3个区域)
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #90CAF9;"></span>
                            低密度 (1个区域)
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="sidebar">
                <div class="stats-grid">
                    <div class="stats-card">
                        <div class="stats-title">总区域数</div>
                        <div class="stats-value">${data.reduce((sum, item) => sum + item.value, 0)}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-title">覆盖省份</div>
                        <div class="stats-value">${data.length}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-title">负责人数</div>
                        <div class="stats-value">${new Set(data.map(item => item.manager)).size}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-title">机构数量</div>
                        <div class="stats-value">${new Set(data.map(item => item.organization)).size}</div>
                    </div>
                </div>
                
                <div class="data-section">
                    <div class="section-title">📊 区域分布详情</div>
                    ${data.map(item => `
                        <div class="data-item">
                            <div class="province-name">${item.province}</div>
                            <div class="item-details">
                                <div class="item-info">
                                    ${item.manager} | ${item.organization}
                                </div>
                                <div class="region-badge">${item.value}个区域</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="update-time">
            📅 数据更新时间: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>

    <script>
        // 你的真实数据
        const realData = ${JSON.stringify(data)};
        
        // 初始化地图
        const chart = echarts.init(document.getElementById('map'));
        
        // 获取中国地图数据
        fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
            .then(response => response.json())
            .then(geoJson => {
                echarts.registerMap('china', geoJson);
                
                // 准备地图数据
                const mapData = realData.map(item => ({
                    name: item.province,
                    value: item.value,
                    manager: item.manager,
                    organization: item.organization
                }));
                
                // 配置选项
                const option = {
                    title: {
                        text: '管理区域分布图',
                        left: 'center',
                        top: 20,
                        textStyle: {
                            color: '#333',
                            fontSize: 18,
                            fontWeight: 'bold'
                        }
                    },
                    tooltip: {
                        trigger: 'item',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        borderColor: 'transparent',
                        textStyle: {
                            color: '#fff'
                        },
                        formatter: function(params) {
                            if (params.data) {
                                return \`
                                    <div style="padding: 10px;">
                                        <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">\${params.data.name}</div>
                                        <div style="margin-bottom: 4px;">📊 管理区域: \${params.data.value}个</div>
                                        <div style="margin-bottom: 4px;">👤 负责人: \${params.data.manager}</div>
                                        <div>🏢 机构: \${params.data.organization}</div>
                                    </div>
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
                        },
                        textStyle: {
                            color: '#333'
                        }
                    },
                    series: [{
                        name: '管理区域',
                        type: 'map',
                        map: 'china',
                        roam: true,
                        emphasis: {
                            label: {
                                show: true,
                                color: '#fff'
                            },
                            itemStyle: {
                                areaColor: '#667eea'
                            }
                        },
                        itemStyle: {
                            borderColor: '#fff',
                            borderWidth: 1
                        },
                        data: mapData
                    }]
                };
                
                chart.setOption(option);
                
                // 响应式
                window.addEventListener('resize', () => {
                    chart.resize();
                });
                
                console.log('🎉 地图渲染完成！');
                console.log('📊 展示数据:', realData);
            })
            .catch(error => {
                console.error('❌ 地图数据加载失败:', error);
                document.getElementById('map').innerHTML = \`
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 16px;">
                        <div style="text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 20px;">🗺️</div>
                            <div>地图加载失败，请检查网络连接</div>
                        </div>
                    </div>
                \`;
            });
    </script>
</body>
</html>`;

  return htmlContent;
}

async function startLocalDashboard() {
  console.log('🚀 启动飞书地图仪表盘本地测试...\n');
  
  // 1. 获取你的真实数据
  const yourData = await fetchYourData();
  if (!yourData) {
    console.log('❌ 无法获取数据，测试终止');
    return;
  }
  
  // 2. 生成仪表盘HTML
  console.log('🎨 生成地图仪表盘...');
  const htmlContent = createDashboardHTML(yourData);
  
  // 3. 启动本地服务器
  console.log('🌐 启动本地服务器...');
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlContent);
    } else if (req.url === '/api/data') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(yourData));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
  
  const port = 3001;
  server.listen(port, () => {
    console.log(`\n🎉 飞书地图仪表盘已启动！`);
    console.log(`📍 本地访问地址: http://localhost:${port}`);
    console.log(`📊 展示数据: ${yourData.length}条记录`);
    console.log(`🗺️ 覆盖省份: ${yourData.map(d => d.province).join(', ')}`);
    console.log(`👥 负责人: ${[...new Set(yourData.map(d => d.manager))].join(', ')}`);
    console.log(`\n💡 在浏览器中打开上述地址查看你的地图仪表盘！`);
    console.log(`⌨️  按 Ctrl+C 停止服务器`);
  });
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n👋 正在关闭服务器...');
    server.close(() => {
      console.log('✅ 服务器已关闭');
      process.exit(0);
    });
  });
}

// 运行本地测试
if (require.main === module) {
  startLocalDashboard();
}

module.exports = { startLocalDashboard, fetchYourData };