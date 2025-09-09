/**
 * 修复颜色显示的飞书地图仪表盘
 */
const https = require('https');
const http = require('http');

const config = {
  tenantAccessToken: 't-g1049a5SG3LCNHXTWTG426OSKQIXHKKEUKQSCDEQ',
  appToken: 'PGuTbyauXavdl7s8Jpec2lUAnah',
  tableId: 'tblLawFGl4bUcqHA'
};

function makeFeishuRequest(path) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.tenantAccessToken}`,
        'Content-Type': 'application/json'
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
    req.end();
  });
}

async function fetchAndProcessData() {
  console.log('🔄 正在获取你的多维表格数据...\n');
  
  try {
    const recordsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`;
    const result = await makeFeishuRequest(recordsPath);
    
    if (result.data && result.data.code === 0) {
      const records = result.data.data.items;
      console.log(`✅ 成功获取 ${records.length} 条记录`);
      
      // 过滤和转换数据
      const validData = records
        .filter(record => {
          const fields = record.fields;
          return fields['所属省份'] && fields['机构名称'] && fields['负责人'];
        })
        .map(record => {
          const fields = record.fields;
          let province = fields['所属省份'];
          
          // 标准化省份名称 - 确保与地图数据匹配
          if (province.includes('浙江')) province = '浙江省';
          else if (province.includes('广东')) province = '广东省';
          else if (province.includes('上海')) province = '上海市';
          else if (province.includes('北京')) province = '北京市';
          else if (province.includes('江苏')) province = '江苏省';
          else if (province.includes('山东')) province = '山东省';
          else if (province.includes('河南')) province = '河南省';
          else if (province.includes('湖北')) province = '湖北省';
          else if (province.includes('湖南')) province = '湖南省';
          else if (province.includes('四川')) province = '四川省';
          
          return {
            province: province,
            manager: fields['负责人'],
            organization: fields['机构名称'],
            region: fields['管理区域'] || '其他'
          };
        });

      console.log('📊 处理后的有效数据:');
      console.table(validData);
      
      // 按省份聚合数据
      const provinceData = {};
      validData.forEach(item => {
        if (!provinceData[item.province]) {
          provinceData[item.province] = {
            province: item.province,
            value: 0,
            managers: new Set(),
            organizations: [],
            regions: new Set()
          };
        }
        provinceData[item.province].value += 1;
        provinceData[item.province].managers.add(item.manager);
        provinceData[item.province].organizations.push(item.organization);
        provinceData[item.province].regions.add(item.region);
      });
      
      // 转换为最终格式
      const finalData = Object.values(provinceData).map(item => ({
        name: item.province,  // 使用 name 字段，这是 ECharts 地图需要的
        value: item.value,
        managers: Array.from(item.managers),
        organizations: item.organizations,
        regions: Array.from(item.regions)
      }));
      
      console.log('\n🗺️ 按省份聚合的地图数据:');
      console.table(finalData.map(item => ({
        省份名称: item.name,
        机构数量: item.value,
        负责人: item.managers.join(', '),
        区域: item.regions.join(', ')
      })));
      
      return finalData;
    } else {
      throw new Error(`API错误: ${result.data ? result.data.msg : '未知错误'}`);
    }
  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    return null;
  }
}

function createColorFixedDashboard(data) {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏦 飞书银行机构地图仪表盘 - 颜色修复版</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 18px;
        }
        
        .main-content {
            display: flex;
            min-height: 800px;
        }
        
        .map-section {
            flex: 1;
            padding: 40px;
            background: #f8f9fa;
        }
        
        .map-container {
            background: white;
            border-radius: 16px;
            padding: 30px;
            height: 700px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }
        
        .sidebar {
            width: 400px;
            background: white;
            padding: 40px;
            border-left: 1px solid #e9ecef;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stats-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 16px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .stats-title {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
            font-weight: 500;
        }
        
        .stats-value {
            font-size: 28px;
            font-weight: bold;
        }
        
        .data-section {
            background: #f8f9fa;
            border-radius: 16px;
            padding: 25px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 25px;
            color: #333;
        }
        
        .data-item {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border-left: 4px solid #667eea;
        }
        
        .data-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .province-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .province-name {
            font-weight: 700;
            font-size: 18px;
            color: #333;
        }
        
        .institution-count {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 15px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .item-details {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
        }
        
        .detail-row {
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
        }
        
        .detail-label {
            font-weight: 600;
            margin-right: 8px;
            min-width: 60px;
        }
        
        .organizations-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 5px;
        }
        
        .org-tag {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .legend {
            margin-top: 30px;
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .legend-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
        }
        
        .legend-items {
            display: flex;
            justify-content: center;
            gap: 25px;
            flex-wrap: wrap;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #666;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 6px;
            margin-right: 8px;
        }
        
        .debug-info {
            margin-top: 20px;
            padding: 15px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            font-size: 12px;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏦 飞书银行机构地图仪表盘</h1>
            <p>基于你的多维表格真实数据 | 颜色修复版</p>
        </div>
        
        <div class="main-content">
            <div class="map-section">
                <div class="map-container">
                    <div id="map" style="width: 100%; height: 100%;"></div>
                </div>
                
                <div class="legend">
                    <div class="legend-title">机构密度图例</div>
                    <div class="legend-items">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #1976D2;"></span>
                            高密度 (2+机构)
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #42A5F5;"></span>
                            中密度 (1机构)
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #E3F2FD;"></span>
                            无数据
                        </div>
                    </div>
                </div>
                
                <div class="debug-info">
                    <strong>调试信息:</strong> 地图数据包含 ${data.length} 个省份: ${data.map(d => d.name).join(', ')}
                </div>
            </div>
            
            <div class="sidebar">
                <div class="stats-grid">
                    <div class="stats-card">
                        <div class="stats-title">总机构数</div>
                        <div class="stats-value">${data.reduce((sum, item) => sum + item.value, 0)}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-title">覆盖省份</div>
                        <div class="stats-value">${data.length}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-title">负责人数</div>
                        <div class="stats-value">${data.reduce((total, item) => total + item.managers.length, 0)}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-title">覆盖区域</div>
                        <div class="stats-value">${[...new Set(data.flatMap(item => item.regions))].length}</div>
                    </div>
                </div>
                
                <div class="data-section">
                    <div class="section-title">🏛️ 机构分布详情</div>
                    ${data.map(item => `
                        <div class="data-item">
                            <div class="province-header">
                                <div class="province-name">${item.name}</div>
                                <div class="institution-count">${item.value}家机构</div>
                            </div>
                            <div class="item-details">
                                <div class="detail-row">
                                    <span class="detail-label">👥 负责人:</span>
                                    <span>${item.managers.join(', ')}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">🌏 区域:</span>
                                    <span>${item.regions.join(', ')}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">🏦 机构:</span>
                                </div>
                                <div class="organizations-list">
                                    ${item.organizations.map(org => `<span class="org-tag">${org}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>

    <script>
        // 你的真实数据
        const realData = ${JSON.stringify(data)};
        
        console.log('🔍 地图数据调试:', realData);
        
        // 初始化地图
        const chart = echarts.init(document.getElementById('map'));
        
        // 获取中国地图数据
        fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
            .then(response => response.json())
            .then(geoJson => {
                console.log('🗺️ 地图JSON加载成功');
                echarts.registerMap('china', geoJson);
                
                // 准备地图数据 - 确保数据格式正确
                const mapData = realData.map(item => {
                    console.log(\`📍 处理省份: \${item.name}, 值: \${item.value}\`);
                    return {
                        name: item.name,
                        value: item.value,
                        managers: item.managers,
                        organizations: item.organizations,
                        regions: item.regions
                    };
                });
                
                console.log('📊 最终地图数据:', mapData);
                
                // 配置选项
                const option = {
                    title: {
                        text: '银行机构分布图',
                        left: 'center',
                        top: 30,
                        textStyle: {
                            color: '#333',
                            fontSize: 20,
                            fontWeight: 'bold'
                        }
                    },
                    tooltip: {
                        trigger: 'item',
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        borderColor: 'transparent',
                        borderRadius: 8,
                        textStyle: {
                            color: '#fff',
                            fontSize: 14
                        },
                        formatter: function(params) {
                            console.log('🖱️ 鼠标悬停数据:', params);
                            if (params.data) {
                                const data = params.data;
                                return \`
                                    <div style="padding: 15px; max-width: 300px;">
                                        <div style="font-weight: bold; margin-bottom: 12px; font-size: 16px;">
                                            🏛️ \${data.name}
                                        </div>
                                        <div style="margin-bottom: 8px;">
                                            🏦 机构数量: <span style="color: #64B5F6;">\${data.value}家</span>
                                        </div>
                                        <div style="margin-bottom: 8px;">
                                            👥 负责人: <span style="color: #81C784;">\${data.managers.join(', ')}</span>
                                        </div>
                                        <div style="margin-bottom: 8px;">
                                            🌏 覆盖区域: <span style="color: #FFB74D;">\${data.regions.join(', ')}</span>
                                        </div>
                                        <div style="margin-bottom: 4px; font-weight: 600;">机构列表:</div>
                                        <div style="font-size: 12px; color: #E0E0E0;">
                                            \${data.organizations.join(' • ')}
                                        </div>
                                    </div>
                                \`;
                            }
                            return \`<div style="padding: 10px;">\${params.name}<br/>暂无数据</div>\`;
                        }
                    },
                    visualMap: {
                        min: 0,
                        max: Math.max(...realData.map(d => d.value)),
                        left: 'left',
                        top: 'bottom',
                        text: ['高', '低'],
                        calculable: true,
                        inRange: {
                            color: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2']
                        },
                        textStyle: {
                            color: '#333',
                            fontSize: 12
                        },
                        show: true
                    },
                    series: [{
                        name: '银行机构',
                        type: 'map',
                        map: 'china',
                        roam: true,
                        emphasis: {
                            label: {
                                show: true,
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 'bold'
                            },
                            itemStyle: {
                                areaColor: '#667eea',
                                shadowBlur: 20,
                                shadowColor: 'rgba(102, 126, 234, 0.5)'
                            }
                        },
                        itemStyle: {
                            borderColor: '#fff',
                            borderWidth: 2,
                            shadowBlur: 10,
                            shadowColor: 'rgba(0,0,0,0.1)',
                            areaColor: '#f0f0f0'  // 默认颜色
                        },
                        data: mapData
                    }]
                };
                
                chart.setOption(option);
                console.log('✅ 地图配置已设置');
                
                // 响应式
                window.addEventListener('resize', () => {
                    chart.resize();
                });
                
                console.log('🎉 银行机构地图渲染完成！');
            })
            .catch(error => {
                console.error('❌ 地图数据加载失败:', error);
                document.getElementById('map').innerHTML = \`
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 18px;">
                        <div style="text-align: center;">
                            <div style="font-size: 64px; margin-bottom: 20px;">🏦</div>
                            <div>地图加载失败，请检查网络连接</div>
                            <div style="font-size: 14px; margin-top: 10px; color: #999;">错误: \${error.message}</div>
                        </div>
                    </div>
                \`;
            });
    </script>
</body>
</html>`;

  return htmlContent;
}

async function startColorFixedDashboard() {
  console.log('🚀 启动颜色修复版飞书银行机构地图仪表盘...\n');
  
  // 1. 获取和处理数据
  const processedData = await fetchAndProcessData();
  if (!processedData || processedData.length === 0) {
    console.log('❌ 无有效数据，测试终止');
    return;
  }
  
  // 2. 生成修复版仪表盘
  console.log('🎨 生成颜色修复版地图仪表盘...');
  const htmlContent = createColorFixedDashboard(processedData);
  
  // 3. 启动本地服务器
  console.log('🌐 启动本地服务器...');
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlContent);
    } else if (req.url === '/api/data') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(processedData));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
  
  const port = 3003;
  server.listen(port, () => {
    console.log(`\n🎉 颜色修复版飞书银行机构地图仪表盘已启动！`);
    console.log(`📍 本地访问地址: http://localhost:${port}`);
    console.log(`🏦 展示数据: ${processedData.reduce((sum, item) => sum + item.value, 0)}家银行机构`);
    console.log(`🗺️ 覆盖省份: ${processedData.map(d => d.name).join(', ')}`);
    console.log(`👥 负责人: ${[...new Set(processedData.flatMap(d => d.managers))].join(', ')}`);
    console.log(`\n💡 在浏览器中打开上述地址查看修复后的地图仪表盘！`);
    console.log(`🔍 现在应该能看到不同省份的颜色区分了`);
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

// 运行修复版测试
if (require.main === module) {
  startColorFixedDashboard();
}

module.exports = { startColorFixedDashboard, fetchAndProcessData };