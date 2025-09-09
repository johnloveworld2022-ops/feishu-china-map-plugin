/**
 * 飞书插件版地图仪表盘
 * 包含数据导入确认流程
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
  try {
    const recordsPath = `/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`;
    const result = await makeFeishuRequest(recordsPath);
    
    if (result.data && result.data.code === 0) {
      const records = result.data.data.items;
      
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

      // 按省份聚合数据
      const provinceData = {};
      validData.forEach(item => {
        if (!provinceData[item.province]) {
          provinceData[item.province] = {
            province: item.province,
            region: item.region,
            institutionCount: 0,
            managers: new Set(),
            organizations: []
          };
        }
        provinceData[item.province].institutionCount += 1;
        provinceData[item.province].managers.add(item.manager);
        provinceData[item.province].organizations.push(item.organization);
      });
      
      // 转换为最终格式
      const finalData = Object.values(provinceData).map(item => ({
        name: item.province,
        value: item.region,
        institutionCount: item.institutionCount,
        region: item.region,
        managers: Array.from(item.managers),
        organizations: item.organizations,
        itemStyle: {
          areaColor: regionColors[item.region] || regionColors['其他']
        }
      }));
      
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
      
      return { mapData: finalData, regionStats, rawData: validData };
    } else {
      throw new Error(`API错误: ${result.data ? result.data.msg : '未知错误'}`);
    }
  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    return null;
  }
}

function createFeishuPluginDashboard(data) {
  const { mapData, regionStats, rawData } = data;
  
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏦 飞书银行机构地图仪表盘</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
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
            font-weight: 700;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 16px;
        }
        
        /* 数据确认步骤 */
        .step-container {
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .step-header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .step-title {
            font-size: 24px;
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
        }
        
        .step-description {
            font-size: 16px;
            color: #666;
        }
        
        .data-preview {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .preview-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }
        
        .data-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .summary-value {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .summary-label {
            font-size: 14px;
            color: #666;
        }
        
        .data-table {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .table-header {
            background: #667eea;
            color: white;
            padding: 15px 20px;
            font-weight: 600;
        }
        
        .table-content {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .table-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 2fr;
            gap: 20px;
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            align-items: center;
        }
        
        .table-row:hover {
            background: #f8f9fa;
        }
        
        .region-tag {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            color: white;
        }
        
        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 40px;
        }
        
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 150px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
            background: #f8f9fa;
            color: #666;
            border: 2px solid #e9ecef;
        }
        
        .btn-secondary:hover {
            background: #e9ecef;
        }
        
        /* 地图展示区域 */
        .dashboard-view {
            display: none;
        }
        
        .main-content {
            display: flex;
            min-height: 600px;
        }
        
        .map-section {
            flex: 1;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .map-container {
            background: white;
            border-radius: 12px;
            padding: 20px;
            height: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .sidebar {
            width: 400px;
            background: white;
            padding: 30px;
            border-left: 1px solid #e9ecef;
            overflow-y: auto;
        }
        
        .legend {
            margin-top: 20px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
            gap: 10px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #666;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            margin-right: 8px;
        }
        
        .back-button {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.7);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        
        .back-button:hover {
            background: rgba(0,0,0,0.9);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏦 飞书银行机构地图仪表盘</h1>
            <p>多维表格数据可视化展示</p>
        </div>
        
        <!-- 数据确认步骤 -->
        <div id="dataConfirmStep" class="step-container">
            <div class="step-header">
                <div class="step-title">📊 数据预览与确认</div>
                <div class="step-description">请确认从多维表格导入的数据是否正确，然后点击"生成地图"按钮</div>
            </div>
            
            <div class="data-preview">
                <div class="preview-title">📈 数据概览</div>
                <div class="data-summary">
                    <div class="summary-card">
                        <div class="summary-value">${rawData.length}</div>
                        <div class="summary-label">总机构数</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${mapData.length}</div>
                        <div class="summary-label">覆盖省份</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${Object.keys(regionStats).length}</div>
                        <div class="summary-label">覆盖区域</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${[...new Set(rawData.map(d => d.manager))].length}</div>
                        <div class="summary-label">负责人数</div>
                    </div>
                </div>
                
                <div class="data-table">
                    <div class="table-header">
                        <div class="table-row">
                            <div>省份</div>
                            <div>区域</div>
                            <div>负责人</div>
                            <div>机构名称</div>
                        </div>
                    </div>
                    <div class="table-content">
                        ${rawData.slice(0, 10).map(item => `
                            <div class="table-row">
                                <div>${item.province}</div>
                                <div>
                                    <span class="region-tag" style="background: ${regionColors[item.region] || regionColors['其他']};">
                                        ${item.region}
                                    </span>
                                </div>
                                <div>${item.manager}</div>
                                <div>${item.organization}</div>
                            </div>
                        `).join('')}
                        ${rawData.length > 10 ? `
                            <div class="table-row" style="text-align: center; color: #666; font-style: italic;">
                                <div colspan="4">... 还有 ${rawData.length - 10} 条记录</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="btn btn-secondary" onclick="cancelImport()">
                    ❌ 取消导入
                </button>
                <button class="btn btn-primary" onclick="confirmAndGenerateMap()">
                    ✅ 确认数据，生成地图
                </button>
            </div>
        </div>
        
        <!-- 地图展示区域 -->
        <div id="dashboardView" class="dashboard-view">
            <button class="back-button" onclick="backToDataConfirm()">
                ← 返回数据确认
            </button>
            
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
                    <div style="margin-bottom: 30px;">
                        <h3 style="margin-bottom: 20px; color: #333;">🌏 区域分布详情</h3>
                        ${Object.keys(regionStats).map(region => {
                            const stats = regionStats[region];
                            return `
                                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                        <span style="width: 12px; height: 12px; border-radius: 50%; background: ${regionColors[region] || regionColors['其他']}; margin-right: 8px;"></span>
                                        <strong>${region}</strong>
                                        <span style="margin-left: auto; color: #666;">${stats.totalInstitutions}家机构</span>
                                    </div>
                                    <div style="font-size: 14px; color: #666;">
                                        <div>省份: ${stats.provinces.join(', ')}</div>
                                        <div>负责人: ${Array.from(stats.managers).join(', ')}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 数据
        const mapData = ${JSON.stringify(mapData)};
        const regionColors = ${JSON.stringify(regionColors)};
        let chart = null;
        
        // 取消导入
        function cancelImport() {
            if (confirm('确定要取消导入吗？')) {
                // 在飞书插件中，这里会关闭插件或返回上一步
                alert('已取消导入');
            }
        }
        
        // 确认并生成地图
        function confirmAndGenerateMap() {
            document.getElementById('dataConfirmStep').style.display = 'none';
            document.getElementById('dashboardView').style.display = 'block';
            
            // 延迟初始化地图，确保DOM已渲染
            setTimeout(() => {
                initializeMap();
            }, 100);
        }
        
        // 返回数据确认
        function backToDataConfirm() {
            document.getElementById('dashboardView').style.display = 'none';
            document.getElementById('dataConfirmStep').style.display = 'block';
            
            // 销毁地图实例
            if (chart) {
                chart.dispose();
                chart = null;
            }
        }
        
        // 初始化地图
        function initializeMap() {
            if (chart) {
                chart.dispose();
            }
            
            chart = echarts.init(document.getElementById('map'));
            
            // 获取中国地图数据
            fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
                .then(response => response.json())
                .then(geoJson => {
                    echarts.registerMap('china', geoJson);
                    
                    const option = {
                        title: {
                            text: '银行机构区域分布图',
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
                            backgroundColor: 'rgba(0,0,0,0.85)',
                            borderColor: 'transparent',
                            borderRadius: 8,
                            textStyle: {
                                color: '#fff',
                                fontSize: 14
                            },
                            formatter: function(params) {
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
                                    fontSize: 12,
                                    fontWeight: 'bold'
                                },
                                itemStyle: {
                                    shadowBlur: 20,
                                    shadowColor: 'rgba(0,0,0,0.3)'
                                }
                            },
                            itemStyle: {
                                borderColor: '#fff',
                                borderWidth: 1,
                                shadowBlur: 5,
                                shadowColor: 'rgba(0,0,0,0.1)',
                                areaColor: '#f0f0f0'
                            },
                            data: mapData
                        }]
                    };
                    
                    chart.setOption(option);
                    
                    // 响应式
                    window.addEventListener('resize', () => {
                        if (chart) {
                            chart.resize();
                        }
                    });
                })
                .catch(error => {
                    console.error('地图加载失败:', error);
                    document.getElementById('map').innerHTML = \`
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 16px;">
                            <div style="text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 15px;">🏦</div>
                                <div>地图加载失败，请检查网络连接</div>
                            </div>
                        </div>
                    \`;
                });
        }
    </script>
</body>
</html>`;

  return htmlContent;
}

async function startFeishuPluginDashboard() {
  console.log('🚀 启动飞书插件版银行机构地图仪表盘...\n');
  
  // 1. 获取和处理数据
  const processedData = await fetchAndProcessData();
  if (!processedData) {
    console.log('❌ 无有效数据，测试终止');
    return;
  }
  
  console.log('📊 数据处理完成:');
  console.log(`  - 原始记录: ${processedData.rawData.length}条`);
  console.log(`  - 覆盖省份: ${processedData.mapData.length}个`);
  console.log(`  - 覆盖区域: ${Object.keys(processedData.regionStats).length}个`);
  
  // 2. 生成飞书插件版仪表盘
  console.log('🎨 生成飞书插件版地图仪表盘...');
  const htmlContent = createFeishuPluginDashboard(processedData);
  
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
  
  const port = 3005;
  server.listen(port, () => {
    console.log(`\n🎉 飞书插件版银行机构地图仪表盘已启动！`);
    console.log(`📍 本地访问地址: http://localhost:${port}`);
    console.log(`\n✨ 功能特点:`);
    console.log(`  📋 数据预览与确认步骤`);
    console.log(`  ✅ 明确的确认按钮`);
    console.log(`  🗺️ 按区域着色的地图`);
    console.log(`  🔄 可以返回重新确认数据`);
    console.log(`\n💡 在浏览器中打开上述地址体验完整的确认流程！`);
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

// 运行飞书插件版测试
if (require.main === module) {
  startFeishuPluginDashboard();
}

module.exports = { startFeishuPluginDashboard, fetchAndProcessData };