(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function t(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(a){if(a.ep)return;a.ep=!0;const i=t(a);fetch(a.href,i)}})();class E{constructor(){this.storageKey="__feishu_map_plugin_config__"}getConfigTemplate(){return{title:"",bitable:{appToken:"",tableId:"",viewId:"",accessToken:""},dataMapping:{regionField:"所属区域",valueField:"机构"}}}validateConfig(e){const t=[];if(!e||typeof e!="object")return t.push("配置必须是一个有效的对象"),{isValid:!1,errors:t};if(!e.bitable)t.push("缺少 bitable 配置");else{const{appToken:s,tableId:a,viewId:i}=e.bitable;(!s||typeof s!="string"||s.trim()==="")&&t.push("appToken 不能为空"),(!a||typeof a!="string"||a.trim()==="")&&t.push("tableId 不能为空"),(!i||typeof i!="string"||i.trim()==="")&&t.push("viewId 不能为空"),s&&!s.match(/^[a-zA-Z0-9_-]+$/)&&t.push("appToken 格式不正确"),a&&!a.match(/^tbl[a-zA-Z0-9]+$/)&&t.push('tableId 格式不正确，应以 "tbl" 开头'),i&&!i.match(/^vew[a-zA-Z0-9]+$/)&&t.push('viewId 格式不正确，应以 "vew" 开头')}if(e.title&&typeof e.title!="string"&&t.push("title 必须是字符串类型"),e.dataMapping){const{regionField:s,valueField:a}=e.dataMapping;s&&typeof s!="string"&&t.push("regionField 必须是字符串类型"),a&&typeof a!="string"&&t.push("valueField 必须是字符串类型")}return{isValid:t.length===0,errors:t}}_isInDashboard(){const e=typeof window<"u"&&typeof window.getConfig=="function"&&typeof window.saveConfig=="function";return console.log("[ConfigManager] 仪表盘环境检测:",{hasWindow:typeof window<"u",hasGetConfig:typeof(window==null?void 0:window.getConfig)=="function",hasSaveConfig:typeof(window==null?void 0:window.saveConfig)=="function",inDashboard:e}),e}async loadConfig(){try{if(this._isInDashboard())return await window.getConfig()||this.getConfigTemplate();const e=localStorage.getItem(this.storageKey);if(e){const t=JSON.parse(e);return{...this.getConfigTemplate(),...t}}return this.getConfigTemplate()}catch(e){return console.warn("[ConfigManager] 读取配置失败，使用默认配置:",e),this.getConfigTemplate()}}async saveConfig(e){try{const t=this.validateConfig(e);return t.isValid?this._isInDashboard()?(await window.saveConfig(e),{success:!0,message:"配置已保存到仪表盘"}):(localStorage.setItem(this.storageKey,JSON.stringify(e)),{success:!0,message:"配置已保存到本地存储（开发环境）"}):{success:!1,message:`配置验证失败: ${t.errors.join(", ")}`}}catch(t){return console.error("[ConfigManager] 保存配置失败:",t),{success:!1,message:`保存失败: ${t.message}`}}}hasConfigChanged(e,t){return JSON.stringify(e)!==JSON.stringify(t)}mergeWithDefaults(e){const t=this.getConfigTemplate();return{...t,...e,bitable:{...t.bitable,...e.bitable||{}},dataMapping:{...t.dataMapping,...e.dataMapping||{}}}}getConfigExample(){return{title:"机构分布地图",bitable:{appToken:"MKbNbyYwPa3krisWZg8cjjnpnQe",tableId:"tbllK3JjHixtQCLd",viewId:"vewYBoCxzI",accessToken:"请填入您的飞书访问令牌"},dataMapping:{regionField:"所属区域",valueField:"机构"}}}}class I{constructor(e=""){this.apiBase=e,this.timeout=1e4}async testConnection(e){const t=Date.now();try{if(!this._validateConfig(e))return{success:!1,message:"配置信息不完整",details:"缺少必要的 appToken、tableId 或 viewId"};const s=await this._makeRequest("/api/bitable/test",{appToken:e.bitable.appToken,tableId:e.bitable.tableId,viewId:e.bitable.viewId}),a=Date.now()-t;return{success:!0,message:"连接测试成功",details:`响应时间: ${a}ms`,responseTime:a,timestamp:new Date().toISOString()}}catch(s){const a=Date.now()-t;return{success:!1,message:"连接测试失败",details:this._parseErrorMessage(s),responseTime:a,timestamp:new Date().toISOString(),error:s.message}}}async fetchRecords(e,t={}){var n,o,c,l;if(!this._validateConfig(e))throw new Error("配置信息不完整：缺少必要的 appToken、tableId 或 viewId");const{pageSize:s=100,pageToken:a=null,fields:i=null}=t;try{const u={appToken:e.bitable.appToken,tableId:e.bitable.tableId,viewId:e.bitable.viewId,pageSize:s};a&&(u.pageToken=a),i&&Array.isArray(i)&&(u.fields=i);const p=await this._makeRequest("/api/bitable/search",u);return{items:((n=p==null?void 0:p.data)==null?void 0:n.items)||[],hasMore:((o=p==null?void 0:p.data)==null?void 0:o.hasMore)||!1,pageToken:((c=p==null?void 0:p.data)==null?void 0:c.pageToken)||null,total:((l=p==null?void 0:p.data)==null?void 0:l.total)||0}}catch(u){throw new Error(`获取记录失败: ${this._parseErrorMessage(u)}`)}}async getTableSchema(e){var t,s;if(!this._validateConfig(e))throw new Error("配置信息不完整");try{const a=await this._makeRequest("/api/bitable/schema",{appToken:e.bitable.appToken,tableId:e.bitable.tableId});return{fields:((t=a==null?void 0:a.data)==null?void 0:t.fields)||[],name:((s=a==null?void 0:a.data)==null?void 0:s.name)||"",tableId:e.bitable.tableId}}catch(a){throw new Error(`获取表格结构失败: ${this._parseErrorMessage(a)}`)}}async fetchAllRecords(e,t=null){const s=[];let a=null,i=0;do{const n=await this.fetchRecords(e,{pageSize:100,pageToken:a});s.push(...n.items),a=n.pageToken,i++,t&&t({currentCount:s.length,pageCount:i,hasMore:n.hasMore}),n.hasMore&&await this._delay(200)}while(a);return s}_validateConfig(e){var t,s,a;return((t=e==null?void 0:e.bitable)==null?void 0:t.appToken)&&((s=e==null?void 0:e.bitable)==null?void 0:s.tableId)&&((a=e==null?void 0:e.bitable)==null?void 0:a.viewId)}async _makeRequest(e,t){if(this._isDevelopmentMode())return this._getMockData(e,t);if(this._isInFeishuEnvironment())return this._makeFeishuSDKRequest(e,t);const s=new AbortController,a=setTimeout(()=>s.abort(),this.timeout);try{const i=await fetch(`${this.apiBase}${e}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t),signal:s.signal});if(clearTimeout(a),!i.ok)throw new Error(`HTTP ${i.status}: ${i.statusText}`);const n=await i.json();if(n.code&&n.code!==0)throw new Error(n.msg||`API 错误 (code: ${n.code})`);return n}catch(i){throw clearTimeout(a),i.name==="AbortError"?new Error(`请求超时 (${this.timeout}ms)`):i}}_isDevelopmentMode(){return location.hostname==="localhost"||location.hostname==="127.0.0.1"}_isInFeishuEnvironment(){return typeof window<"u"&&typeof window.bitable<"u"}async _makeFeishuSDKRequest(e,t){try{if(!window.bitable)throw new Error("飞书SDK未加载");const{appToken:s,tableId:a,viewId:i,pageSize:n,pageToken:o}=t;if(e==="/api/bitable/test")return{code:0,msg:"success",data:{connected:!0,recordCount:(await(await window.bitable.base.getTableById(a)).getRecordList()).length}};if(e==="/api/bitable/search"){const c=await window.bitable.base.getTableById(a),u=await(await c.getViewById(i)).getVisibleRecordIdList(),p=[],g=o?parseInt(o):0,m=Math.min(g+n,u.length);for(let f=g;f<m;f++){const y=u[f],D=await(await c.getRecordById(y)).getFields();p.push({record_id:y,fields:D,created_time:Date.now(),last_modified_time:Date.now()})}return{code:0,msg:"success",data:{items:p,has_more:m<u.length,page_token:m<u.length?m.toString():null,total:u.length}}}else throw new Error(`不支持的端点: ${e}`)}catch(s){throw console.error("飞书SDK调用失败:",s),new Error(`飞书SDK调用失败: ${s.message}`)}}async _getMockData(e,t){if(await this._delay(500+Math.random()*1e3),e==="/api/bitable/test")return{code:0,msg:"success",data:{connected:!0,recordCount:25}};if(e==="/api/bitable/search"){const s=this._generateMockRecords();return{code:0,msg:"success",data:{items:s,hasMore:!1,pageToken:null,total:s.length}}}if(e==="/api/bitable/schema")return{code:0,msg:"success",data:{fields:[{field_name:"机构",field_type:"text"},{field_name:"所属省份",field_type:"text"},{field_name:"所属区域",field_type:"text"},{field_name:"负责人",field_type:"text"}],name:"机构信息表"}};throw new Error("未知的 API 端点")}_generateMockRecords(){const e=["华北","华东","华南","华中","西南","西北","东北"],t={华北:["北京","天津","河北","山西","内蒙古"],华东:["上海","江苏","浙江","安徽","福建","江西","山东"],华南:["广东","广西","海南"],华中:["河南","湖北","湖南"],西南:["重庆","四川","贵州","云南","西藏"],西北:["陕西","甘肃","青海","宁夏","新疆"],东北:["辽宁","吉林","黑龙江"]},s=[];let a=1;return e.forEach(i=>{const n=t[i],o=Math.floor(Math.random()*5)+1;for(let c=0;c<o;c++){const l=n[Math.floor(Math.random()*n.length)];s.push({record_id:`rec${a.toString().padStart(6,"0")}`,fields:{机构:`${i}分公司${c+1}`,所属省份:l,所属区域:i,负责人:`负责人${a}`},created_time:Date.now()-Math.random()*864e5*30,last_modified_time:Date.now()-Math.random()*864e5*7}),a++}}),s}_parseErrorMessage(e){return e.message.includes("Failed to fetch")?"网络连接失败，请检查网络设置或后端服务状态":e.message.includes("timeout")||e.message.includes("超时")?"请求超时，请稍后重试":e.message.includes("401")?"Token 无效或已过期，请检查 appToken":e.message.includes("403")?"权限不足，请检查多维表格的访问权限":e.message.includes("404")?"资源不存在，请检查 tableId 和 viewId 是否正确":e.message.includes("429")?"API 调用频率过高，请稍后重试":e.message||"未知错误"}_delay(e){return new Promise(t=>setTimeout(t,e))}async getDiagnosticInfo(e){var s,a,i,n,o,c;const t={timestamp:new Date().toISOString(),config:{hasAppToken:!!((s=e==null?void 0:e.bitable)!=null&&s.appToken),hasTableId:!!((a=e==null?void 0:e.bitable)!=null&&a.tableId),hasViewId:!!((i=e==null?void 0:e.bitable)!=null&&i.viewId),appTokenFormat:(n=e==null?void 0:e.bitable)!=null&&n.appToken?e.bitable.appToken.match(/^[a-zA-Z0-9_-]+$/)?"正确":"格式错误":"缺失",tableIdFormat:(o=e==null?void 0:e.bitable)!=null&&o.tableId?e.bitable.tableId.match(/^tbl[a-zA-Z0-9]+$/)?"正确":"格式错误":"缺失",viewIdFormat:(c=e==null?void 0:e.bitable)!=null&&c.viewId?e.bitable.viewId.match(/^vew[a-zA-Z0-9]+$/)?"正确":"格式错误":"缺失"},network:{apiBase:this.apiBase||"相对路径",timeout:this.timeout}};try{const l=await this.testConnection(e);t.connectionTest=l}catch(l){t.connectionTest={success:!1,error:l.message}}return t}}class k{constructor(){this.validRegions=["华北","华东","华南","华中","西南","西北","东北","北京","天津","河北","山西","内蒙古","上海","江苏","浙江","安徽","福建","江西","山东","广东","广西","海南","河南","湖北","湖南","重庆","四川","贵州","云南","西藏","陕西","甘肃","青海","宁夏","新疆","辽宁","吉林","黑龙江"],this.requiredFields={机构:{type:"string",required:!0},所属区域:{type:"string",required:!0},所属省份:{type:"string",required:!1},负责人:{type:"string",required:!1}}}validateDataStructure(e){const t={isValid:!0,errors:[],warnings:[],summary:{totalRecords:0,validRecords:0,invalidRecords:0,emptyRecords:0}};return Array.isArray(e)?e.length===0?(t.warnings.push("数据为空"),t):(t.summary.totalRecords=e.length,e.forEach((s,a)=>{const i=this._validateSingleRecord(s,a);i.isValid?t.summary.validRecords++:(t.summary.invalidRecords++,t.errors.push(...i.errors)),i.isEmpty&&t.summary.emptyRecords++,t.warnings.push(...i.warnings)}),t.summary.invalidRecords>0&&(t.isValid=!1),t):(t.isValid=!1,t.errors.push("数据不是数组格式"),t)}checkRequiredFields(e,t={}){const s={isValid:!0,missingFields:[],fieldStats:{},recommendations:[]};if(!Array.isArray(e)||e.length===0)return s.isValid=!1,s.missingFields.push("无有效数据记录"),s;const a={regionField:t.regionField||"所属区域",valueField:t.valueField||"机构",provinceField:t.provinceField||"所属省份",managerField:t.managerField||"负责人"},i={},n=e.length;return e.forEach(o=>{const c=o.fields||{};Object.values(a).forEach(l=>{i[l]||(i[l]={present:0,missing:0,empty:0}),c.hasOwnProperty(l)?c[l]&&c[l].toString().trim()!==""?i[l].present++:i[l].empty++:i[l].missing++})}),Object.entries(i).forEach(([o,c])=>{const l=c.present/n*100;s.fieldStats[o]={...c,completeness:Math.round(l*100)/100,total:n},(o===a.regionField||o===a.valueField)&&l<90&&(s.isValid=!1,s.missingFields.push(`${o} (完整度: ${l.toFixed(1)}%)`)),l<50?s.recommendations.push(`建议检查字段 "${o}" 的数据完整性`):l<90&&s.recommendations.push(`字段 "${o}" 存在部分缺失数据`)}),s}validateGeographicData(e){const t={isValid:!0,errors:[],warnings:[],regionStats:{},unknownRegions:[],suggestions:[]};if(!Array.isArray(e)||e.length===0)return t.isValid=!1,t.errors.push("无有效数据记录"),t;const s="所属区域",a="所属省份";return e.forEach((i,n)=>{const o=i.fields||{},c=o[s],l=o[a];if(c){const u=c.toString().trim();t.regionStats[u]||(t.regionStats[u]=0),t.regionStats[u]++,this.validRegions.includes(u)||t.unknownRegions.includes(u)||(t.unknownRegions.push(u),t.warnings.push(`未知区域: "${u}"`))}else t.errors.push(`记录 ${n+1}: 缺少区域信息`);if(l){const u=l.toString().trim();this.validRegions.includes(u)||t.warnings.push(`记录 ${n+1}: 可能的无效省份 "${u}"`)}}),t.unknownRegions.length>0&&t.suggestions.push("建议检查以下区域名称是否正确: "+t.unknownRegions.join(", ")),Object.keys(t.regionStats).length<3&&t.suggestions.push("数据覆盖的区域较少，建议增加更多区域的数据"),t.errors.length>e.length*.1&&(t.isValid=!1),t}generateDataQualityReport(e){const t={timestamp:new Date().toISOString(),overview:{totalRecords:0,validRecords:0,dataQualityScore:0},structureValidation:null,fieldValidation:null,geographicValidation:null,recommendations:[],summary:""};if(!Array.isArray(e))return t.summary="❌ 数据格式错误：不是有效的数组",t;if(t.overview.totalRecords=e.length,e.length===0)return t.summary="⚠️ 数据为空，无法生成质量报告",t;t.structureValidation=this.validateDataStructure(e),t.fieldValidation=this.checkRequiredFields(e),t.geographicValidation=this.validateGeographicData(e),t.overview.validRecords=t.structureValidation.summary.validRecords;const s=t.structureValidation.isValid?40:0,a=t.fieldValidation.isValid?30:0,i=t.geographicValidation.isValid?30:0;return t.overview.dataQualityScore=s+a+i,t.recommendations=[...t.fieldValidation.recommendations,...t.geographicValidation.suggestions],t.summary=this._generateQualitySummary(t),t}_validateSingleRecord(e,t){const s={isValid:!0,isEmpty:!1,errors:[],warnings:[]};if(!e||typeof e!="object")return s.isValid=!1,s.errors.push(`记录 ${t+1}: 不是有效的对象`),s;if(!e.fields||typeof e.fields!="object")return s.isValid=!1,s.errors.push(`记录 ${t+1}: 缺少 fields 字段`),s;const a=e.fields;return Object.keys(a).length===0?(s.isEmpty=!0,s.warnings.push(`记录 ${t+1}: 字段为空`),s):(Object.entries(this.requiredFields).forEach(([n,o])=>{if(o.required&&!a.hasOwnProperty(n))s.isValid=!1,s.errors.push(`记录 ${t+1}: 缺少必需字段 "${n}"`);else if(a.hasOwnProperty(n)){const c=a[n];o.type==="string"&&typeof c!="string"&&s.warnings.push(`记录 ${t+1}: 字段 "${n}" 类型不正确`),o.required&&(!c||c.toString().trim()==="")&&(s.isValid=!1,s.errors.push(`记录 ${t+1}: 必需字段 "${n}" 为空`))}}),s)}_generateQualitySummary(e){const{totalRecords:t,validRecords:s,dataQualityScore:a}=e.overview,i=t>0?Math.round(s/t*100):0;let n="";return a>=90?n=`✅ 数据质量优秀 (${a}分)`:a>=70?n=`⚠️ 数据质量良好 (${a}分)`:a>=50?n=`⚠️ 数据质量一般 (${a}分)`:n=`❌ 数据质量较差 (${a}分)`,n+=` - 总记录数: ${t}, 有效记录: ${s} (${i}%)`,e.recommendations.length>0&&(n+=`, 建议改进 ${e.recommendations.length} 项`),n}getDataCleaningSuggestions(e){const t=[];if(!Array.isArray(e)||e.length===0)return["无有效数据，请检查数据源"];const s=this.generateDataQualityReport(e);return s.structureValidation.isValid||t.push("修复数据结构问题：确保所有记录都有正确的 fields 字段"),s.fieldValidation.isValid||t.push("补充缺失的必需字段："+s.fieldValidation.missingFields.join(", ")),s.geographicValidation.unknownRegions.length>0&&t.push("标准化区域名称："+s.geographicValidation.unknownRegions.join(", ")),t.length===0&&t.push("数据质量良好，无需特殊处理"),t}}class F{constructor(){this.statusContainer=null,this.currentStatus={connection:{status:"idle",message:"",timestamp:null},dataLoading:{status:"idle",progress:0,message:"",timestamp:null},validation:{status:"idle",message:"",timestamp:null},config:{status:"idle",message:"",timestamp:null}},this.statusHistory=[],this.maxHistorySize=50}init(e){this.statusContainer=document.getElementById(e),this.statusContainer||console.warn(`[StatusManager] 找不到状态容器: ${e}`)}setConnectionStatus(e,t,s={}){const a={status:e,message:t,details:s,timestamp:new Date().toISOString()};this.currentStatus.connection=a,this._addToHistory("connection",a),this._updateDisplay("connection",a)}setDataLoadingStatus(e,t=0,s=""){const i={status:e?"loading":"idle",isLoading:e,progress:Math.max(0,Math.min(100,t)),message:s,timestamp:new Date().toISOString()};this.currentStatus.dataLoading=i,this._addToHistory("dataLoading",i),this._updateDisplay("dataLoading",i)}setValidationStatus(e,t,s={}){const a={status:e,message:t,validationResult:s,timestamp:new Date().toISOString()};this.currentStatus.validation=a,this._addToHistory("validation",a),this._updateDisplay("validation",a)}setConfigStatus(e,t){const s={status:e,message:t,timestamp:new Date().toISOString()};this.currentStatus.config=s,this._addToHistory("config",s),this._updateDisplay("config",s)}showError(e,t=[],s="general"){const a=e instanceof Error?e.message:e,i={type:"error",message:a,suggestions:t,category:s,timestamp:new Date().toISOString()};this._addToHistory("error",i),this._displayMessage(a,"error",t)}showSuccess(e,t=3e3){const s={type:"success",message:e,timestamp:new Date().toISOString()};this._addToHistory("success",s),this._displayMessage(e,"success"),t>0&&setTimeout(()=>{this._clearDisplay()},t)}showWarning(e,t=[]){const s={type:"warning",message:e,suggestions:t,timestamp:new Date().toISOString()};this._addToHistory("warning",s),this._displayMessage(e,"warning",t)}showInfo(e){const t={type:"info",message:e,timestamp:new Date().toISOString()};this._addToHistory("info",t),this._displayMessage(e,"info")}clearStatus(){this._clearDisplay()}getCurrentStatus(){return{...this.currentStatus}}getStatusHistory(e=null,t=10){let s=this.statusHistory;return e&&(s=s.filter(a=>a.type===e)),s.slice(-t).reverse()}getStatusStats(){const e={total:this.statusHistory.length,byType:{},recent:{errors:0,warnings:0,successes:0}};return this.statusHistory.forEach(s=>{e.byType[s.type]=(e.byType[s.type]||0)+1}),this.statusHistory.slice(-10).forEach(s=>{s.type==="error"?e.recent.errors++:s.type==="warning"?e.recent.warnings++:s.type==="success"&&e.recent.successes++}),e}reset(){this.currentStatus={connection:{status:"idle",message:"",timestamp:null},dataLoading:{status:"idle",progress:0,message:"",timestamp:null},validation:{status:"idle",message:"",timestamp:null},config:{status:"idle",message:"",timestamp:null}},this.statusHistory=[],this._clearDisplay()}_addToHistory(e,t){this.statusHistory.push({type:e,data:t,timestamp:new Date().toISOString()}),this.statusHistory.length>this.maxHistorySize&&(this.statusHistory=this.statusHistory.slice(-this.maxHistorySize))}_updateDisplay(e,t){if(!this.statusContainer)return;let s="info",a=t.message;switch(e){case"connection":t.status==="connecting"?(s="info",a="🔄 "+t.message):t.status==="connected"?(s="success",a="✅ "+t.message):t.status==="failed"&&(s="error",a="❌ "+t.message);break;case"dataLoading":t.isLoading&&(s="info",a=`🔄 ${t.message} (${t.progress}%)`);break;case"validation":t.status==="validating"?(s="info",a="🔍 "+t.message):t.status==="valid"?(s="success",a="✅ "+t.message):t.status==="invalid"&&(s="error",a="❌ "+t.message);break;case"config":t.status==="saving"?(s="info",a="💾 "+t.message):t.status==="saved"?(s="success",a="✅ "+t.message):t.status==="error"&&(s="error",a="❌ "+t.message);break}this._displayMessage(a,s)}_displayMessage(e,t="info",s=[]){if(this.statusContainer&&(this.statusContainer.textContent=e,this.statusContainer.className=`status-info ${t}`,s&&s.length>0)){const a=s.join("; ");this.statusContainer.textContent+=` (建议: ${a})`}}_clearDisplay(){this.statusContainer&&(this.statusContainer.textContent="",this.statusContainer.className="status-info")}_getStatusIcon(e,t){var a;return((a={connection:{idle:"⚪",connecting:"🔄",connected:"✅",failed:"❌"},dataLoading:{idle:"⚪",loading:"🔄"},validation:{idle:"⚪",validating:"🔍",valid:"✅",invalid:"❌"},config:{idle:"⚪",saving:"💾",saved:"✅",error:"❌"}}[t])==null?void 0:a[e])||"⚪"}}class L{constructor(){this.container=null,this.currentData=null,this.viewMode="map",this.pageSize=10,this.currentPage=0,this.mapRenderer=null}init(e){this.container=document.getElementById(e),this.container||console.warn(`[DataPreviewer] 找不到预览容器: ${e}`)}renderPreview(e,t=null,s={}){const a=t||this.container;if(!a){console.warn("[DataPreviewer] 没有可用的容器");return}this.currentData=e;const{title:i="数据预览",showControls:n=!0,showStats:o=!0,showQuality:c=!0}=s;if(!e||!Array.isArray(e)){this._renderError(a,"无效的数据格式");return}if(e.length===0){this._renderEmpty(a,"暂无数据");return}const l=this._generatePreviewHtml(e,{title:i,showControls:n,showStats:o,showQuality:c});a.innerHTML=l,n&&this._bindEventListeners(a)}showDataStats(e){if(!e||!Array.isArray(e))return{error:"无效数据"};const t={totalRecords:e.length,fields:{},regions:{},dataTypes:{},completeness:{}};return e.forEach(s=>{const a=s.fields||{};Object.entries(a).forEach(([i,n])=>{t.fields[i]=(t.fields[i]||0)+1;const o=typeof n;t.dataTypes[i]||(t.dataTypes[i]={}),t.dataTypes[i][o]=(t.dataTypes[i][o]||0)+1,i==="所属区域"&&n&&(t.regions[n]=(t.regions[n]||0)+1)})}),Object.keys(t.fields).forEach(s=>{t.completeness[s]=Math.round(t.fields[s]/e.length*100)}),t}showFieldInfo(e){return!e||!e.fields?"<p>无字段信息</p>":`
      <div class="field-info">
        <h5>字段信息</h5>
        ${e.fields.map(s=>`
      <div class="field-info-item">
        <span class="field-name">${s.field_name}</span>
        <span class="field-type">${s.field_type}</span>
      </div>
    `).join("")}
      </div>
    `}clearPreview(){this.container&&(this.container.innerHTML=""),this.currentData=null}setMapRenderer(e){this.mapRenderer=e}switchViewMode(e){["map","summary","table","chart"].includes(e)&&(this.viewMode=e,this.currentData&&this.renderPreview(this.currentData))}exportData(e="json"){if(!this.currentData)return null;switch(e){case"json":return JSON.stringify(this.currentData,null,2);case"csv":return this._convertToCSV(this.currentData);default:return null}}_generatePreviewHtml(e,t){const{title:s,showControls:a,showStats:i,showQuality:n}=t,o=a?`
      <div class="preview-controls">
        <div class="view-modes">
          <button class="view-mode-btn ${this.viewMode==="summary"?"active":""}" data-mode="summary">概览</button>
          <button class="view-mode-btn ${this.viewMode==="table"?"active":""}" data-mode="table">表格</button>
          <button class="view-mode-btn ${this.viewMode==="chart"?"active":""}" data-mode="chart">图表</button>
        </div>
        <div class="preview-actions">
          <button class="export-btn" data-format="json">导出JSON</button>
          <button class="export-btn" data-format="csv">导出CSV</button>
          <button class="refresh-btn">刷新</button>
        </div>
      </div>
    `:"",c=i?this._generateStatsHtml(e):"";let l="";switch(this.viewMode){case"summary":l=this._generateSummaryView(e);break;case"table":l=this._generateTableView(e);break;case"chart":l=this._generateChartView(e);break}return`
      <div class="data-preview">
        <div class="preview-header">
          <h3>${s}</h3>
          ${o}
        </div>
        ${c}
        <div class="preview-content">
          ${l}
        </div>
      </div>
    `}_generateStatsHtml(e){const t=this.showDataStats(e),s=Object.keys(t.regions).length;return`
      <div class="preview-stats">
        <div class="stat-item">
          <span class="stat-label">总记录数</span>
          <span class="stat-value">${t.totalRecords}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">字段数</span>
          <span class="stat-value">${Object.keys(t.fields).length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">区域数</span>
          <span class="stat-value">${s}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">数据完整性</span>
          <span class="stat-value">${this._calculateOverallCompleteness(t.completeness)}%</span>
        </div>
      </div>
    `}_generateSummaryView(e){const t=this.showDataStats(e),s=Object.entries(t.regions).sort(([,i],[,n])=>n-i).slice(0,10).map(([i,n])=>`
        <div class="region-item">
          <span class="region-name">${i}</span>
          <div class="region-bar">
            <div class="region-fill" style="width: ${n/Math.max(...Object.values(t.regions))*100}%"></div>
          </div>
          <span class="region-count">${n}</span>
        </div>
      `).join(""),a=Object.entries(t.completeness).map(([i,n])=>`
        <div class="field-completeness-item">
          <span class="field-name">${i}</span>
          <div class="completeness-bar">
            <div class="completeness-fill" style="width: ${n}%"></div>
          </div>
          <span class="completeness-value">${n}%</span>
        </div>
      `).join("");return`
      <div class="summary-view">
        <div class="summary-section">
          <h4>区域分布</h4>
          <div class="region-stats">
            ${s}
          </div>
        </div>
        
        <div class="summary-section">
          <h4>字段完整性</h4>
          <div class="field-completeness">
            ${a}
          </div>
        </div>
      </div>
    `}_generateTableView(e){if(e.length===0)return"<p>暂无数据</p>";const t=new Set;e.forEach(p=>{Object.keys(p.fields||{}).forEach(g=>t.add(g))});const s=Array.from(t),a=Math.ceil(e.length/this.pageSize),i=this.currentPage*this.pageSize,n=Math.min(i+this.pageSize,e.length),o=e.slice(i,n),c=s.map(p=>`<th>${p}</th>`).join(""),l=o.map((p,g)=>{const m=s.map(f=>{var S;const y=((S=p.fields)==null?void 0:S[f])||"";return`<td title="${y}">${this._truncateText(y,30)}</td>`}).join("");return`<tr data-index="${i+g}">${m}</tr>`}).join(""),u=a>1?`
      <div class="pagination">
        <button class="page-btn" data-page="prev" ${this.currentPage===0?"disabled":""}>上一页</button>
        <span class="page-info">第 ${this.currentPage+1} 页，共 ${a} 页</span>
        <button class="page-btn" data-page="next" ${this.currentPage>=a-1?"disabled":""}>下一页</button>
      </div>
    `:"";return`
      <div class="table-view">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>${c}</tr>
            </thead>
            <tbody>
              ${l}
            </tbody>
          </table>
        </div>
        ${u}
      </div>
    `}_generateChartView(e){const t=this.showDataStats(e),s=Object.entries(t.regions).sort(([,i],[,n])=>n-i).slice(0,8);return`
      <div class="chart-view">
        <div class="chart-container">
          <h4>区域分布图</h4>
          <div class="pie-chart" id="region-pie-chart">
            ${this._generatePieChart(s)}
          </div>
        </div>
        
        <div class="chart-legend">
          ${s.map(([i,n],o)=>`
            <div class="legend-item">
              <span class="legend-color" style="background-color: ${this._getChartColor(o)}"></span>
              <span class="legend-label">${i}</span>
              <span class="legend-value">${n}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `}_generatePieChart(e){const t=e.reduce((i,[,n])=>i+n,0);let s=0;return`
      <svg viewBox="0 0 100 100" class="pie-chart-svg">
        ${e.map(([i,n],o)=>{const c=n/t*100,l=n/t*360,u=l>180?1:0,p=50+40*Math.cos(s*Math.PI/180),g=50+40*Math.sin(s*Math.PI/180);s+=l;const m=50+40*Math.cos(s*Math.PI/180),f=50+40*Math.sin(s*Math.PI/180);return`
        <path d="${`M 50 50 L ${p} ${g} A 40 40 0 ${u} 1 ${m} ${f} Z`}" 
              fill="${this._getChartColor(o)}" 
              stroke="white" 
              stroke-width="1"
              title="${i}: ${n} (${c.toFixed(1)}%)">
        </path>
      `}).join("")}
      </svg>
    `}_bindEventListeners(e){e.querySelectorAll(".view-mode-btn").forEach(s=>{s.addEventListener("click",a=>{const i=a.target.dataset.mode;this.switchViewMode(i)})}),e.querySelectorAll(".export-btn").forEach(s=>{s.addEventListener("click",a=>{const i=a.target.dataset.format,n=this.exportData(i);n&&this._downloadData(n,`data.${i}`)})}),e.querySelectorAll(".page-btn").forEach(s=>{s.addEventListener("click",a=>{const i=a.target.dataset.page;if(i==="prev"&&this.currentPage>0)this.currentPage--;else if(i==="next"){const n=Math.ceil(this.currentData.length/this.pageSize);this.currentPage<n-1&&this.currentPage++}this.renderPreview(this.currentData)})});const t=e.querySelector(".refresh-btn");t&&t.addEventListener("click",()=>{this.currentData&&this.renderPreview(this.currentData)})}_renderError(e,t){e.innerHTML=`
      <div class="preview-error">
        <h3>❌ 预览错误</h3>
        <p>${t}</p>
      </div>
    `}_renderEmpty(e,t){e.innerHTML=`
      <div class="preview-empty">
        <h3>📭 ${t}</h3>
        <p>请检查数据源或重新加载数据</p>
      </div>
    `}_calculateOverallCompleteness(e){const t=Object.values(e);return t.length===0?0:Math.round(t.reduce((s,a)=>s+a,0)/t.length)}_truncateText(e,t){if(!e)return"";const s=e.toString();return s.length>t?s.substring(0,t)+"...":s}_getChartColor(e){const t=["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F"];return t[e%t.length]}_convertToCSV(e){if(!e||e.length===0)return"";const t=new Set;e.forEach(n=>{Object.keys(n.fields||{}).forEach(o=>t.add(o))});const s=Array.from(t),a=s.join(","),i=e.map(n=>s.map(o=>{var l;return`"${(((l=n.fields)==null?void 0:l[o])||"").toString().replace(/"/g,'""')}"`}).join(","));return[a,...i].join(`
`)}_downloadData(e,t){const s=new Blob([e],{type:"text/plain;charset=utf-8"}),a=URL.createObjectURL(s),i=document.createElement("a");i.href=a,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(a)}}class P{constructor(){this.chart=null,this.container=null,this.currentData=null,this.mapData=null}async init(e){if(this.container=document.getElementById(e),!this.container)throw new Error(`找不到地图容器: ${e}`);await this._waitForECharts(),this.chart=window.echarts.init(this.container),await this._loadMapData(),window.addEventListener("resize",()=>{this.chart&&this.chart.resize()})}async _waitForECharts(){if(!(typeof window.echarts<"u")){if(window.echartsLoadPromise)try{await window.echartsLoadPromise;return}catch(e){throw new Error("ECharts 库加载失败: "+e.message)}return new Promise((e,t)=>{const s=setTimeout(()=>{t(new Error("ECharts 库加载超时，请刷新页面重试"))},15e3),a=()=>{typeof window.echarts<"u"?(clearTimeout(s),e()):setTimeout(a,200)};a()})}}renderMap(e,t={}){if(!this.chart){console.error("地图未初始化");return}this.currentData=e;const{title:s="机构分布地图",regionField:a="所属区域",valueField:i="机构",colorScheme:n="blue"}=t,o=this._processDataForMap(e,a),c=this._generateMapOption(o,{title:s,colorScheme:n});this.chart.setOption(c,!0),this._bindMapEvents()}updateData(e){this.chart&&e&&this.renderMap(e)}dispose(){this.chart&&(this.chart.dispose(),this.chart=null)}getSnapshot(){return this.chart?this.chart.getDataURL({type:"png",backgroundColor:"#fff"}):null}async _loadMapData(){try{try{const t=await fetch("/assets/china-map.json");if(t.ok){const s=await t.json();window.echarts.registerMap("china",s),this.mapData=s,console.log("成功加载本地完整中国地图数据");return}}catch(t){console.warn("从本地加载地图数据失败，使用内置数据:",t.message)}const e=this._getChinaMapData();window.echarts.registerMap("china",e),this.mapData=e,console.log("使用内置中国地图数据")}catch(e){throw console.error("加载地图数据失败:",e),e}}_processDataForMap(e,t){const s={};e.forEach((n,o)=>{let c;if(n.fields?c=n.fields[t]:c=n[t],c){const l=this._normalizeRegionName(c);s[l]=(s[l]||0)+1}});const a=[],i=Object.values(s);return Object.entries(s).forEach(([n,o])=>{a.push({name:n,value:o,itemStyle:{areaColor:this._getColorByValue(o,i)}})}),{mapData:a,regionStats:s,provinceStats:s,maxValue:Math.max(...Object.values(s))}}_generateMapOption(e,t){const{title:s,colorScheme:a}=t,{mapData:i,maxValue:n}=e;return{title:{text:s,left:"center",top:20,textStyle:{fontSize:18,fontWeight:"bold",color:"#333"}},tooltip:{trigger:"item",formatter:function(o){return o.data?`${o.name}<br/>机构数量: ${o.data.value||0}`:`${o.name}<br/>暂无数据`},backgroundColor:"rgba(0,0,0,0.8)",textStyle:{color:"#fff"}},visualMap:{min:0,max:n,left:"left",top:"bottom",text:["高","低"],calculable:!0,inRange:{color:this._getColorRange(a)},textStyle:{color:"#333"}},series:[{name:"机构分布",type:"map",map:"china",roam:!0,scaleLimit:{min:.8,max:3},emphasis:{label:{show:!0,fontSize:12,fontWeight:"bold"},itemStyle:{areaColor:"#ffd700",borderColor:"#fff",borderWidth:2}},select:{label:{show:!0,fontSize:12,fontWeight:"bold"},itemStyle:{areaColor:"#ff6b6b"}},itemStyle:{borderColor:"#fff",borderWidth:1,areaColor:"#f0f0f0"},data:i}]}}_bindMapEvents(){this.chart&&(this.chart.on("click",e=>{var t,s;e.componentType==="series"&&(console.log("点击了省份:",e.name,"机构数量:",((t=e.data)==null?void 0:t.value)||0),this._showProvinceDetail(e.name,((s=e.data)==null?void 0:s.value)||0))}),this.chart.on("mouseover",e=>{e.componentType}))}_showProvinceDetail(e,t){const s=new CustomEvent("provinceClick",{detail:{province:e,count:t,data:this.currentData}});document.dispatchEvent(s)}_getColorByValue(e,t){if(t.length===0)return"#f0f0f0";const s=Math.max(...t),a=Math.min(...t),i=s>a?(e-a)/(s-a):0,n=Math.floor(240-i*180),o=Math.floor(248-i*100);return`rgb(${n}, ${o}, 255)`}_getColorRange(e){const t={blue:["#e6f3ff","#cce7ff","#99d6ff","#66c2ff","#33adff","#0099ff"],green:["#e8f5e8","#d4edda","#c3e6cb","#b8dabc","#a3cfbb","#28a745"],red:["#ffeaea","#ffcccc","#ffaaaa","#ff8888","#ff6666","#dc3545"],purple:["#f3e5f5","#e1bee7","#ce93d8","#ba68c8","#ab47bc","#9c27b0"]};return t[e]||t.blue}_normalizeRegionName(e){if(!e)return e;let t=e.replace(/(省|市|自治区|特别行政区|维吾尔自治区|回族自治区|壮族自治区)$/g,"");return{北京:"北京市",上海:"上海市",天津:"天津市",重庆:"重庆市",内蒙古:"内蒙古自治区",新疆:"新疆维吾尔自治区",西藏:"西藏自治区",宁夏:"宁夏回族自治区",广西:"广西壮族自治区",香港:"香港特别行政区",澳门:"澳门特别行政区",台湾:"台湾省",广东:"广东省",福建:"福建省",海南:"海南省",山东:"山东省",江苏:"江苏省",浙江:"浙江省",安徽:"安徽省",江西:"江西省",湖北:"湖北省",湖南:"湖南省",河南:"河南省",河北:"河北省",山西:"山西省",陕西:"陕西省",甘肃:"甘肃省",青海:"青海省",四川:"四川省",贵州:"贵州省",云南:"云南省",辽宁:"辽宁省",吉林:"吉林省",黑龙江:"黑龙江省"}[t]||t+"省"}_getRegionToProvinceMapping(){return{华北:["北京","天津","河北","山西","内蒙古"],华东:["上海","江苏","浙江","安徽","福建","江西","山东"],华南:["广东","广西","海南"],华中:["河南","湖北","湖南"],西南:["重庆","四川","贵州","云南","西藏"],西北:["陕西","甘肃","青海","宁夏","新疆"],东北:["辽宁","吉林","黑龙江"]}}_getChinaMapData(){return{type:"FeatureCollection",features:[{type:"Feature",properties:{name:"北京"},geometry:{type:"Polygon",coordinates:[[[116,39.4],[116.8,39.4],[116.8,40.4],[116,40.4],[116,39.4]]]}},{type:"Feature",properties:{name:"上海"},geometry:{type:"Polygon",coordinates:[[[121,30.8],[121.8,30.8],[121.8,31.6],[121,31.6],[121,30.8]]]}},{type:"Feature",properties:{name:"天津"},geometry:{type:"Polygon",coordinates:[[[116.8,38.8],[117.8,38.8],[117.8,39.8],[116.8,39.8],[116.8,38.8]]]}},{type:"Feature",properties:{name:"重庆"},geometry:{type:"Polygon",coordinates:[[[105.8,28.8],[107.8,28.8],[107.8,30.8],[105.8,30.8],[105.8,28.8]]]}},{type:"Feature",properties:{name:"河北"},geometry:{type:"Polygon",coordinates:[[[113.5,36],[119.5,36],[119.5,42.5],[113.5,42.5],[113.5,36]]]}},{type:"Feature",properties:{name:"山西"},geometry:{type:"Polygon",coordinates:[[[110,34.5],[114.5,34.5],[114.5,40.5],[110,40.5],[110,34.5]]]}},{type:"Feature",properties:{name:"内蒙古"},geometry:{type:"Polygon",coordinates:[[[97,37.5],[126,37.5],[126,53],[97,53],[97,37.5]]]}},{type:"Feature",properties:{name:"辽宁"},geometry:{type:"Polygon",coordinates:[[[118.5,38.5],[125.5,38.5],[125.5,43.5],[118.5,43.5],[118.5,38.5]]]}},{type:"Feature",properties:{name:"吉林"},geometry:{type:"Polygon",coordinates:[[[121.5,41],[131,41],[131,46.5],[121.5,46.5],[121.5,41]]]}},{type:"Feature",properties:{name:"黑龙江"},geometry:{type:"Polygon",coordinates:[[[121,43.5],[135,43.5],[135,53.5],[121,53.5],[121,43.5]]]}},{type:"Feature",properties:{name:"江苏"},geometry:{type:"Polygon",coordinates:[[[116.5,30.5],[121.5,30.5],[121.5,35],[116.5,35],[116.5,30.5]]]}},{type:"Feature",properties:{name:"浙江"},geometry:{type:"Polygon",coordinates:[[[118,27],[123,27],[123,31.5],[118,31.5],[118,27]]]}},{type:"Feature",properties:{name:"安徽"},geometry:{type:"Polygon",coordinates:[[[114.5,29.5],[119.5,29.5],[119.5,34.5],[114.5,34.5],[114.5,29.5]]]}},{type:"Feature",properties:{name:"福建"},geometry:{type:"Polygon",coordinates:[[[115.5,23.5],[120.5,23.5],[120.5,28.5],[115.5,28.5],[115.5,23.5]]]}},{type:"Feature",properties:{name:"江西"},geometry:{type:"Polygon",coordinates:[[[113.5,24.5],[118.5,24.5],[118.5,30],[113.5,30],[113.5,24.5]]]}},{type:"Feature",properties:{name:"山东"},geometry:{type:"Polygon",coordinates:[[[114.5,34.5],[122.5,34.5],[122.5,38.5],[114.5,38.5],[114.5,34.5]]]}},{type:"Feature",properties:{name:"河南"},geometry:{type:"Polygon",coordinates:[[[110.5,31.5],[116.5,31.5],[116.5,36.5],[110.5,36.5],[110.5,31.5]]]}},{type:"Feature",properties:{name:"湖北"},geometry:{type:"Polygon",coordinates:[[[108,29],[116.5,29],[116.5,33.5],[108,33.5],[108,29]]]}},{type:"Feature",properties:{name:"湖南"},geometry:{type:"Polygon",coordinates:[[[108.5,24.5],[114.5,24.5],[114.5,30.5],[108.5,30.5],[108.5,24.5]]]}},{type:"Feature",properties:{name:"广东"},geometry:{type:"Polygon",coordinates:[[[109.5,20],[117.5,20],[117.5,25.5],[109.5,25.5],[109.5,20]]]}},{type:"Feature",properties:{name:"广西"},geometry:{type:"Polygon",coordinates:[[[104.5,20.5],[112,20.5],[112,26.5],[104.5,26.5],[104.5,20.5]]]}},{type:"Feature",properties:{name:"海南"},geometry:{type:"Polygon",coordinates:[[[108.5,18],[111.5,18],[111.5,20.5],[108.5,20.5],[108.5,18]]]}},{type:"Feature",properties:{name:"四川"},geometry:{type:"Polygon",coordinates:[[[97.5,26],[108.5,26],[108.5,34],[97.5,34],[97.5,26]]]}},{type:"Feature",properties:{name:"贵州"},geometry:{type:"Polygon",coordinates:[[[103.5,24.5],[109.5,24.5],[109.5,29],[103.5,29],[103.5,24.5]]]}},{type:"Feature",properties:{name:"云南"},geometry:{type:"Polygon",coordinates:[[[97,21],[106,21],[106,29],[97,29],[97,21]]]}},{type:"Feature",properties:{name:"西藏"},geometry:{type:"Polygon",coordinates:[[[78,26.5],[99,26.5],[99,36.5],[78,36.5],[78,26.5]]]}},{type:"Feature",properties:{name:"陕西"},geometry:{type:"Polygon",coordinates:[[[105.5,31.5],[111,31.5],[111,39.5],[105.5,39.5],[105.5,31.5]]]}},{type:"Feature",properties:{name:"甘肃"},geometry:{type:"Polygon",coordinates:[[[92,32],[109,32],[109,42.5],[92,42.5],[92,32]]]}},{type:"Feature",properties:{name:"青海"},geometry:{type:"Polygon",coordinates:[[[89,31.5],[103,31.5],[103,39],[89,39],[89,31.5]]]}},{type:"Feature",properties:{name:"宁夏"},geometry:{type:"Polygon",coordinates:[[[104,35],[107.5,35],[107.5,39.5],[104,39.5],[104,35]]]}},{type:"Feature",properties:{name:"新疆"},geometry:{type:"Polygon",coordinates:[[[73,34],[96.5,34],[96.5,49],[73,49],[73,34]]]}}]}}}const b=new E,$=new I,R=new k,d=new F,_=new L,C=new P;document.querySelector("#root").innerHTML=`
  <div class="plugin-wrap">
    <h1>飞书机构分布地图插件</h1>
    
    <div class="config-card">
      <h2>配置信息</h2>
      <textarea id="cfg-input" rows="8" placeholder='请输入配置信息...'></textarea>
      <div class="config-actions">
        <button id="btn-load-example">加载示例配置</button>
        <button id="btn-validate">验证配置</button>
        <button id="btn-test-connection">测试连接</button>
        <button id="btn-save">保存到仪表盘</button>
        <button id="btn-status-panel" class="btn-secondary">状态面板</button>
      </div>
      <div id="config-status" class="status-info"></div>
      <div id="status-panel" class="status-panel hidden">
        <div class="status-panel-header">
          <h4>系统状态</h4>
          <button id="btn-close-panel" class="btn-close">×</button>
        </div>
        <div class="status-panel-content">
          <div id="status-overview"></div>
          <div id="status-history"></div>
        </div>
      </div>
    </div>

    <div class="preview">
      <h2 id="preview-title">数据预览</h2>
      <div class="preview-tabs">
        <button id="tab-map" class="tab-button active">中国地图</button>
        <button id="tab-data" class="tab-button">数据表格</button>
      </div>
      <div id="preview-map" class="preview-content active">等待配置...</div>
      <div id="preview-data" class="preview-content">等待配置...</div>
    </div>
  </div>
`;const h=r=>document.querySelector(r),v=h("#cfg-input");h("#config-status");const H=h("#preview-title");async function V(r){try{d.setDataLoadingStatus(!0,0,"开始读取多维表格数据...");const e=await $.fetchAllRecords(r,t=>{const s=t.hasMore?Math.min(90,t.pageCount*10):100;d.setDataLoadingStatus(!0,s,`已获取 ${t.currentCount} 条记录 (第 ${t.pageCount} 页)`);const a=document.getElementById("preview-map");a&&(a.innerHTML=`
          <div class="loading">
            正在读取多维表格数据...<br>
            <small>已获取 ${t.currentCount} 条记录 (第 ${t.pageCount} 页)</small>
            <div style="margin-top: 8px; width: 200px; height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden; margin-left: auto; margin-right: auto;">
              <div style="height: 100%; background: #007bff; width: ${s}%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        `)});return d.setDataLoadingStatus(!1,100,`成功获取 ${e.length} 条记录`),e}catch(e){throw d.setDataLoadingStatus(!1,0,"数据获取失败"),e}}function O(r){const{dataQualityScore:e}=r.overview;let t="quality-poor",s="❌";e>=90?(t="quality-excellent",s="✅"):e>=70?(t="quality-good",s="⚠️"):e>=50&&(t="quality-fair",s="⚠️");const a=r.fieldValidation&&r.fieldValidation.fieldStats?Object.entries(r.fieldValidation.fieldStats).map(([o,c])=>`<div class="field-stat">
          <span class="field-name">${o}</span>
          <div class="field-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${c.completeness}%"></div>
            </div>
            <span class="progress-text">${c.completeness}%</span>
          </div>
        </div>`).join(""):"",i=r.recommendations&&r.recommendations.length>0?`<div class="recommendations">
      <h5>改进建议</h5>
      <ul>
        ${r.recommendations.map(o=>`<li>${o}</li>`).join("")}
      </ul>
    </div>`:"",n=r.geographicValidation&&r.geographicValidation.unknownRegions.length>0?`<div class="unknown-regions">
      <h5>⚠️ 未识别的区域</h5>
      <div class="region-tags">
        ${r.geographicValidation.unknownRegions.map(o=>`<span class="region-tag">${o}</span>`).join("")}
      </div>
    </div>`:"";return`
    <div class="data-quality-report">
      <div class="quality-header ${t}">
        <h4>${s} ${r.summary}</h4>
      </div>
      
      ${a?`
        <div class="field-stats">
          <h5>字段完整性</h5>
          ${a}
        </div>
      `:""}
      
      ${n}
      ${i}
    </div>
  `}function M(r={}){var s,a,i;H.textContent=r.title||"数据预览";const e=document.getElementById("preview-map"),t=document.getElementById("preview-data");if((s=r.bitable)!=null&&s.appToken&&((a=r.bitable)!=null&&a.tableId)&&((i=r.bitable)!=null&&i.viewId))e.innerHTML='<div class="loading">正在读取多维表格数据...</div>',t.innerHTML='<div class="loading">正在读取多维表格数据...</div>',V(r).then(async n=>{const o=R.generateDataQualityReport(n);try{e.innerHTML=`
            <div class="map-loading">
              <div class="spinner"></div>
              正在初始化地图...
            </div>
            <div id="china-map" style="width: 100%; height: 500px; display: none;"></div>
          `,await C.init("china-map");const u=e.querySelector(".map-loading"),p=e.querySelector("#china-map");u&&(u.style.display="none"),p&&(p.style.display="block"),C.renderMap(n,{title:r.title||"机构分布地图",regionField:"所属省份",valueField:"机构",colorScheme:"blue"}),console.log("中国地图渲染成功")}catch(u){console.error("地图渲染失败:",u),e.innerHTML=`
            <div class="error-message">
              <h3>⚠️ 地图渲染失败</h3>
              <p><strong>错误信息:</strong> ${u.message}</p>
              <div class="error-suggestions">
                <h4>可能的解决方案:</h4>
                <ul>
                  <li>刷新页面重试</li>
                  <li>检查网络连接是否正常</li>
                  <li>确保 ECharts 库能正常加载</li>
                  <li>查看控制台获取详细错误信息</li>
                </ul>
              </div>
            </div>
          `}_.renderPreview(n,t,{title:r.title||"机构分布数据",showControls:!0,showStats:!0,showQuality:!0});const c=O(o),l=t.querySelector(".preview-content");if(l){const u=document.createElement("div");u.innerHTML=c,l.insertBefore(u.firstElementChild,l.firstChild)}}).catch(n=>{console.error("读取数据失败:",n);const o=`
          <div class="error-message">
            <h3>❌ 数据读取失败</h3>
            <p><strong>错误信息:</strong> ${n.message}</p>
            <div class="error-suggestions">
              <h4>可能的解决方案:</h4>
              <ul>
                <li>检查 appToken、tableId、viewId 是否正确</li>
                <li>确认多维表格的访问权限</li>
                <li>检查网络连接是否正常</li>
                <li>确认后端代理服务是否正常运行</li>
              </ul>
            </div>
          </div>
        `;e.innerHTML=o,t.innerHTML=o});else{const n=`
      <div class="config-prompt">
        <h3>⚙️ 请先配置多维表格信息</h3>
        <p>点击"加载示例配置"按钮获取配置模板，然后填入您的实际信息。</p>
      </div>
    `;e.innerHTML=n,t.innerHTML=n}}function T(r){if(!r||!r.bitable)return!1;const{appToken:e,tableId:t,viewId:s,accessToken:a}=r.bitable;if(!e||!t||!s||e.trim()===""||t.trim()===""||s.trim()==="")return!1;if(a&&a.trim()!==""&&a!=="请填入您的飞书访问令牌")return!0;const i=b.getConfigExample();return!(e===i.bitable.appToken&&t===i.bitable.tableId&&s===i.bitable.viewId)}(async function(){try{d.init("config-status"),_.init("preview-data"),d.setConfigStatus("loading","正在加载配置...");const e=await b.loadConfig();if(console.log("[Bootstrap] 加载的配置:",e),v.value=JSON.stringify(e,null,2),T(e))M(e),d.setConfigStatus("saved","配置已加载"),d.showSuccess("配置已加载");else{const t=document.getElementById("preview-map"),s=document.getElementById("preview-data"),a=`
        <div class="config-prompt">
          <h3>⚙️ 请先配置多维表格信息</h3>
          <p>点击"加载示例配置"按钮获取配置模板，然后填入您的实际信息。</p>
          <p><small>注意：请使用您自己的 appToken、tableId 和 viewId，不要使用示例中的值。</small></p>
        </div>
      `;t.innerHTML=a,s.innerHTML=a,d.setConfigStatus("saved","请配置真实的多维表格信息"),d.showInfo("请配置您的多维表格信息以查看数据")}}catch(e){console.error("初始化失败:",e),d.setConfigStatus("error","初始化失败"),d.showError(e,["检查网络连接","刷新页面重试"])}})();h("#tab-map").addEventListener("click",()=>{document.querySelectorAll(".tab-button").forEach(r=>r.classList.remove("active")),h("#tab-map").classList.add("active"),document.querySelectorAll(".preview-content").forEach(r=>r.classList.remove("active")),h("#preview-map").classList.add("active")});h("#tab-data").addEventListener("click",()=>{document.querySelectorAll(".tab-button").forEach(r=>r.classList.remove("active")),h("#tab-data").classList.add("active"),document.querySelectorAll(".preview-content").forEach(r=>r.classList.remove("active")),h("#preview-data").classList.add("active")});h("#btn-load-example").addEventListener("click",()=>{const r=b.getConfigExample();v.value=JSON.stringify(r,null,2),d.showWarning("⚠️ 这是示例配置，请替换为您自己的真实 appToken、tableId 和 viewId")});h("#btn-status-panel").addEventListener("click",()=>{const r=document.getElementById("status-panel");r.classList.toggle("hidden"),r.classList.contains("hidden")||x()});h("#btn-close-panel").addEventListener("click",()=>{document.getElementById("status-panel").classList.add("hidden")});function w(r,e){var s;return((s={connection:{idle:"⚪",connecting:"🔄",connected:"✅",failed:"❌"},dataLoading:{idle:"⚪",loading:"🔄"},validation:{idle:"⚪",validating:"🔍",valid:"✅",invalid:"❌"},config:{idle:"⚪",saving:"💾",saved:"✅",error:"❌"}}[e])==null?void 0:s[r])||"⚪"}function x(){const r=d.getCurrentStatus(),e=d.getStatusStats(),t=d.getStatusHistory(null,5),s=`
    <div class="status-overview">
      <h5>当前状态</h5>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">连接:</span>
          <span class="status-value ${r.connection.status}">
            ${w(r.connection.status,"connection")} 
            ${r.connection.status}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">数据加载:</span>
          <span class="status-value ${r.dataLoading.status}">
            ${w(r.dataLoading.status,"dataLoading")} 
            ${r.dataLoading.status}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">验证:</span>
          <span class="status-value ${r.validation.status}">
            ${w(r.validation.status,"validation")} 
            ${r.validation.status}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">配置:</span>
          <span class="status-value ${r.config.status}">
            ${w(r.config.status,"config")} 
            ${r.config.status}
          </span>
        </div>
      </div>
      
      <div class="status-stats">
        <h5>统计信息</h5>
        <p>总事件: ${e.total} | 最近错误: ${e.recent.errors} | 最近成功: ${e.recent.successes}</p>
      </div>
    </div>
  `,a=`
    <div class="status-history">
      <h5>最近活动</h5>
      <div class="history-list">
        ${t.map(i=>`
          <div class="history-item">
            <span class="history-time">${new Date(i.timestamp).toLocaleTimeString()}</span>
            <span class="history-type">${i.type}</span>
            <span class="history-message">${JSON.stringify(i.data).substring(0,100)}...</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;document.getElementById("status-overview").innerHTML=s,document.getElementById("status-history").innerHTML=a}h("#btn-validate").addEventListener("click",()=>{try{d.setValidationStatus("validating","正在验证配置...");const r=v.value.trim()?JSON.parse(v.value):{},e=b.validateConfig(r);e.isValid?(d.setValidationStatus("valid","配置验证通过",e),d.showSuccess("配置验证通过")):(d.setValidationStatus("invalid","配置验证失败",e),d.showError("配置验证失败: "+e.errors.join(", "),["检查必需字段","验证字段格式","参考示例配置"]))}catch(r){d.setValidationStatus("invalid","JSON 格式错误"),d.showError("JSON 格式错误: "+r.message,["检查JSON语法","使用JSON格式化工具"])}});h("#btn-test-connection").addEventListener("click",async()=>{try{const r=v.value.trim()?JSON.parse(v.value):{},e=b.validateConfig(r);if(!e.isValid){d.setValidationStatus("invalid","配置验证失败",e),d.showError("配置验证失败: "+e.errors.join(", "),["检查必需字段","验证字段格式"]);return}d.setConnectionStatus("connecting","正在测试连接...");const t=await $.testConnection(r);if(t.success)d.setConnectionStatus("connected",t.message,t),d.showSuccess(`${t.message} (${t.details})`);else{d.setConnectionStatus("failed",t.message,t);const s=await $.getDiagnosticInfo(r);console.log("连接诊断信息:",s);const a=["检查 appToken、tableId、viewId 是否正确","确认多维表格的访问权限","检查网络连接"];d.showError(`${t.message}: ${t.details}`,a)}}catch(r){d.setConnectionStatus("failed","连接测试异常"),d.showError("连接测试失败: "+r.message,["检查网络连接","稍后重试","查看控制台详细错误"])}});h("#btn-save").addEventListener("click",async()=>{try{d.setConfigStatus("saving","正在保存配置到仪表盘...");const r=v.value.trim()?JSON.parse(v.value):{};console.log("[保存配置] 准备保存的配置:",r);const e=await b.saveConfig(r);if(console.log("[保存配置] 保存结果:",e),e.success)if(d.setConfigStatus("saved",e.message),d.showSuccess(e.message),T(r))M(r);else{const t=document.getElementById("preview-map"),s=document.getElementById("preview-data"),a=`
          <div class="config-prompt">
            <h3>⚠️ 请使用真实的多维表格配置</h3>
            <p>检测到您使用的是示例配置或空配置。</p>
            <p>请填入您自己的 appToken、tableId 和 viewId 以查看真实数据。</p>
            <div class="error-suggestions">
              <h4>如何获取配置信息：</h4>
              <ul>
                <li>appToken: 在飞书多维表格应用中获取</li>
                <li>tableId: 多维表格的唯一标识符</li>
                <li>viewId: 表格视图的唯一标识符</li>
              </ul>
            </div>
          </div>
        `;t.innerHTML=a,s.innerHTML=a,d.showWarning("请使用真实的多维表格配置信息")}else d.setConfigStatus("error",e.message),d.showError(e.message,["检查配置格式","验证必需字段"])}catch{d.setConfigStatus("error","JSON 格式错误"),d.showError("保存失败: JSON 格式错误",["检查JSON语法","使用JSON格式化工具"])}});
