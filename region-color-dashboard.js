/**
 * 按区域着色的飞书地图仪表盘
 * 华东、华南、华北等区域用不同颜色
 */
const https = require('https');
const http = require('http');

const config = {
  tenantAccessToken: 't-g1049a5SG3LCNHXTWTG426OSKQIXHKKEUKQSCDEQ',
  appToken: 'PGuTbyauXavdl7s8Jpec2lUAnah',
  tableId: 'tblLawFGl4bUcqHA'
};

// 区域颜色配置
const regionColors = {
  '华东': '#1976D2',  // 蓝色
  '华南': '#388E3C',  // 绿色
  '华北': '#F57C00',  // 橙色
  '华中': '#7B1FA2',  // 紫色
  '西南': '#D32F2F',  // 红色
  '西北': '#455A64',  // 灰蓝色
  '东北': '#E64A19',  // 深橙色
  '其他': '#9E9E9E'   // 灰色
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
          
          // 标准化省份名称
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
            region: item.region,  // 保存区域信息
            institutionCount: 0,
            managers: new Set(),
            organizations: []
          };
        }
        provinceData[item.province].institutionCount += 1;
        provinceData[item.province].managers.add(item.manager);
        provinceData[item.province].organizations.push(item.organization);
      });
      
      // 转换为最终格式，按区域着色
      const finalData = Object.values(provinceData).map(item => ({
        name: item.province,
        value: item.region,  // 使用区域作为值，用于着色
        institutionCount: item.institutionCount,
        region: item.region,
        managers: Array.from(item.managers),
        organizations: item.organizations,
        itemStyle: {
          areaColor: regionColors[item.region] || regionColors['其他']
        }
      }));
      
      console.log('\n🗺️ 按区域着色的地图数据:');
      console.table(finalData.map(item => ({
        省份名称: item.name,
        所属区域: item.region,
        机构数量: item.institutionCount,
        区域颜色: regionColors[item.region] || regionColors['其他'],
        负责人: item.managers.join(', ')
      })));
      
      // 统计区域信息
      const regionStats = {};
      finalData.forEach(item => {
        if (!regionStats[item.region]) {
          regionStats[item.region] = {
            provinces: [],
            totalInstitutions: 0,
            managers: new Set()
          };
        }
        regionStats[item.region].provinces.push(item.name);
        regionStats[item.region].totalInstitutions += item.institutionCount;
        item.managers.forEach(manager => regionStats[item.region].managers.add(manager));
      });
      
      console.log('\n📈 区域统计:');
      Object.keys(regionStats).forEach(region => {
        const stats = regionStats[region];
        console.log(`${region}: ${stats.provinces.length}个省份, ${stats.totalInstitutions}家机构, ${stats.managers.size}位负责人`);
        console.log(`  省份: ${stats.provinces.join(', ')}`);
        console.log(`  颜色: ${regionColors[region] || regionColors['其他']}`);
      });
      
      return { mapData: finalData, regionStats };
    } else {
      throw new Error(`API错误: ${result.data ? result.data.msg : '未知错误'}`);
    }
  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    return null;
  }
}

function createRegionColorDashboard(data) {
  const { mapData, regionStats } = data;
  
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏦 飞书银行机构地图仪表盘 - 区域着色版</title>
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
            width: 450px;
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
        
        .region-section {
            background: #f8f9fa;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 25px;
            color: #333;
        }
        
        .region-item {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
        }
        
        .region-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .region-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .region-name {
            font-weight: 700;
            font-size: 18px;
            color: #333;
            display: flex;
            align-items: center;
        }
        
        .region-color-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        .region-stats {
            font-size: 14px;
            color: #666;
        }
        
        .region-details {
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
            min-width: 70px;
        }
        
        .provinces-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 5px;
        }
        
        .province-tag {
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
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #666;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 6px;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏦 飞书银行机构地图仪表盘</h1>
            <p>按区域着色显示 | 不同区域用不同颜色标识</p>
        </div>
        
        <div class="main-content">
            <div class="map-section">
                <div class="map-container">
                    <div id="map" style="width: 100%; height: 100%;"></div>
                </div>
                
                <div class="legend">
                    <div class="legend-title">区域颜色图例</div>
                    <div class="legend-items">
                        ${Object.keys(regionStats).map(region => `
                            <div class="legend-item">
                                <span class="legend-color" style="background: ${regionColors[region] || regionColors['其他']};"></span>
                                <span>${region} (${regionStats[region].provinces.length}省)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="sidebar">
                <div class="stats-grid">
                    <div class="stats-card">
                        <div class="stats-title">总机构数</div>
                        <div class="stats-value">${mapData.reduce((sum, item) => sum + item.institutionCount, 0)}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-title">覆盖省份</div>
                        <div class="stats-value">${mapData.length}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-title">覆盖区域</div>
                        <div class="stats-value">${Object.keys(regionStats).length}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-title">负责人数</div>
                        <div class="stats-value">${Object.values(regionStats).reduce((total, region) => total + region.managers.size, 0)}</div>
                    </div>
                </div>
                
                <div class="region-section">
                    <div class="section-title">🌏 区域分布详情</div>
                    ${Object.keys(regionStats).map(region => {
                        const stats = regionStats[region];
                        return `
                            <div class="region-item">
                                <div class="region-header">
                                    <div class="region-name">
                                        <span class="region-color-dot" style="background: ${regionColors[region] || regionColors['其他']};"></span>
                                        ${region}
                                    </div>
                                    <div class="region-stats">${stats.totalInstitutions}家机构</div>
                                </div>
                                <div class="region-details">
                                    <div class="detail-row">
                                        <span class="detail-label">📍 省份数:</span>
                                        <span>${stats.provinces.length}个</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">👥 负责人:</span>
                                        <span>${Array.from(stats.managers).join(', ')}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">🗺️ 包含省份:</span>
                                    </div>
                                    <div class="provinces-list">
                                        ${stats.provinces.map(province => `<span class="province-tag">${province}</span>`).join('')}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    </div>

    <script>
        // 你的真实数据
        const mapData = ${JSON.stringify(mapData)};
        const regionColors = ${JSON.stringify(regionColors)};
        
        console.log('🔍 地图数据调试:', mapData);
        
        // 初始化地图
        const chart = echarts.init(document.getElementById('map'));
        
        // 获取中国地图数据
        fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
            .then(response => response.json())
            .then(geoJson => {
                console.log('🗺️ 地图JSON加载成功');
                echarts.registerMap('china', geoJson);
                
                // 配置选项
                const option = {
                    title: {
                        text: '银行机构区域分布图',
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
                                            🌏 所属区域: <span style="color: \${regionColors[data.region]};">\${data.region}</span>
                                        </div>
                                        <div style="margin-bottom: 8px;">
                                            🏦 机构数量: <span style="color: #64B5F6;">\${data.institutionCount}家</span>
                                        </div>
                                        <div style="margin-bottom: 8px;">
                                            👥 负责人: <span style="color: #81C784;">\${data.managers.join(', ')}</span>
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
                                shadowBlur: 20,
                                shadowColor: 'rgba(0,0,0,0.3)'
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
                
                console.log('🎉 区域着色银行机构地图渲染完成！');
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

async function startRegionColorDashboard() {
  console.log('🚀 启动区域着色版飞书银行机构地图仪表盘...\n');
  
  // 1. 获取和处理数据
  const processedData = await fetchAndProcessData();
  if (!processedData) {
    console.log('❌ 无有效数据，测试终止');
    return;
  }
  
  // 2. 生成区域着色版仪表盘
  console.log('🎨 生成区域着色版地图仪表盘...');
  const htmlContent = createRegionColorDashboard(processedData);
  
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
  
  const port = 3004;
  server.listen(port, () => {
    console.log(`\n🎉 区域着色版飞书银行机构地图仪表盘已启动！`);
    console.log(`📍 本地访问地址: http://localhost:${port}`);
    console.log(`🏦 展示数据: ${processedData.mapData.reduce((sum, item) => sum + item.institutionCount, 0)}家银行机构`);
    console.log(`🗺️ 覆盖省份: ${processedData.mapData.map(d => d.name).join(', ')}`);
    console.log(`🌏 覆盖区域: ${Object.keys(processedData.regionStats).join(', ')}`);
    console.log(`\n💡 在浏览器中打开上述地址查看按区域着色的地图仪表盘！`);
    console.log(`🎨 华东=蓝色, 华南=绿色, 华北=橙色, 华中=紫色`);
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

// 运行区域着色版测试
if (require.main === module) {
  startRegionColorDashboard();
}

module.exports = { startRegionColorDashboard, fetchAndProcessData };