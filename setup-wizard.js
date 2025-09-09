/**
 * 飞书多维表格集成配置向导
 * 交互式配置工具，帮助用户快速设置测试环境
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

class SetupWizard {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.config = {
      feishuConfig: {},
      fieldMapping: {}
    };
  }

  /**
   * 询问用户输入
   */
  async ask(question, defaultValue = '') {
    return new Promise((resolve) => {
      const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  /**
   * 显示欢迎信息
   */
  showWelcome() {
    console.log('🎉 欢迎使用飞书多维表格集成配置向导！');
    console.log('');
    console.log('这个向导将帮助你:');
    console.log('✅ 配置飞书API连接信息');
    console.log('✅ 设置字段映射关系');
    console.log('✅ 生成测试配置文件');
    console.log('✅ 运行集成测试');
    console.log('');
  }

  /**
   * 收集飞书API配置
   */
  async collectFeishuConfig() {
    console.log('📋 第一步: 配置飞书API信息');
    console.log('');
    
    console.log('💡 提示: App Token 可以在飞书开发者后台 → 应用管理 → 凭证与基础信息 中找到');
    this.config.feishuConfig.appToken = await this.ask('请输入 App Token (以app_开头)');
    
    if (!this.config.feishuConfig.appToken.startsWith('app_')) {
      console.log('⚠️  警告: App Token 通常以 "app_" 开头，请确认输入正确');
    }
    
    console.log('');
    console.log('💡 提示: Table ID 可以从多维表格URL中获取 (以tbl开头)');
    console.log('   示例: https://xxx.feishu.cn/base/xxxxx?table=tblxxxxxxxxx');
    this.config.feishuConfig.tableId = await this.ask('请输入 Table ID (以tbl开头)');
    
    if (!this.config.feishuConfig.tableId.startsWith('tbl')) {
      console.log('⚠️  警告: Table ID 通常以 "tbl" 开头，请确认输入正确');
    }
    
    console.log('');
    const needUserToken = await this.ask('是否需要配置 User Token? (y/N)', 'N');
    if (needUserToken.toLowerCase() === 'y') {
      this.config.feishuConfig.userToken = await this.ask('请输入 User Token (以u-开头)');
    }
    
    console.log('✅ 飞书API配置完成');
    console.log('');
  }

  /**
   * 收集字段映射配置
   */
  async collectFieldMapping() {
    console.log('📝 第二步: 配置字段映射');
    console.log('');
    console.log('请告诉我你的多维表格中各个字段的名称:');
    console.log('');
    
    this.config.fieldMapping.provinceField = await this.ask('省份字段名称', '省份');
    this.config.fieldMapping.valueField = await this.ask('数值字段名称 (用于地图颜色)', '数量');
    
    const needManager = await this.ask('是否有负责人字段? (y/N)', 'N');
    if (needManager.toLowerCase() === 'y') {
      this.config.fieldMapping.managerField = await this.ask('负责人字段名称', '负责人');
    }
    
    const needOrg = await this.ask('是否有机构字段? (y/N)', 'N');
    if (needOrg.toLowerCase() === 'y') {
      this.config.fieldMapping.organizationField = await this.ask('机构字段名称', '机构');
    }
    
    console.log('✅ 字段映射配置完成');
    console.log('');
  }

  /**
   * 显示配置摘要
   */
  showConfigSummary() {
    console.log('📊 配置摘要:');
    console.log('');
    console.log('【飞书API配置】');
    console.log(`  App Token: ${this.config.feishuConfig.appToken}`);
    console.log(`  Table ID: ${this.config.feishuConfig.tableId}`);
    if (this.config.feishuConfig.userToken) {
      console.log(`  User Token: ${this.config.feishuConfig.userToken}`);
    }
    
    console.log('');
    console.log('【字段映射配置】');
    console.log(`  省份字段: ${this.config.fieldMapping.provinceField}`);
    console.log(`  数值字段: ${this.config.fieldMapping.valueField}`);
    if (this.config.fieldMapping.managerField) {
      console.log(`  负责人字段: ${this.config.fieldMapping.managerField}`);
    }
    if (this.config.fieldMapping.organizationField) {
      console.log(`  机构字段: ${this.config.fieldMapping.organizationField}`);
    }
    console.log('');
  }

  /**
   * 保存配置文件
   */
  saveConfig() {
    const configContent = `/**
 * 飞书多维表格测试配置
 * 由配置向导自动生成于 ${new Date().toLocaleString()}
 */

// 飞书API配置
const feishuConfig = {
  appToken: '${this.config.feishuConfig.appToken}',
  tableId: '${this.config.feishuConfig.tableId}'${this.config.feishuConfig.userToken ? `,
  userToken: '${this.config.feishuConfig.userToken}'` : ''}
};

// 字段映射配置
const fieldMapping = {
  provinceField: '${this.config.fieldMapping.provinceField}',
  valueField: '${this.config.fieldMapping.valueField}'${this.config.fieldMapping.managerField ? `,
  managerField: '${this.config.fieldMapping.managerField}'` : ''}${this.config.fieldMapping.organizationField ? `,
  organizationField: '${this.config.fieldMapping.organizationField}'` : ''}
};

// 导出配置
module.exports = {
  feishuConfig,
  fieldMapping
};`;

    const configPath = path.join(__dirname, 'test-config.js');
    fs.writeFileSync(configPath, configContent);
    
    console.log(`💾 配置文件已保存到: ${configPath}`);
    console.log('');
  }

  /**
   * 运行完整向导
   */
  async run() {
    try {
      this.showWelcome();
      
      await this.collectFeishuConfig();
      await this.collectFieldMapping();
      
      this.showConfigSummary();
      
      const confirm = await this.ask('确认保存配置并运行测试? (Y/n)', 'Y');
      
      if (confirm.toLowerCase() !== 'n') {
        this.saveConfig();
        
        console.log('🚀 开始运行集成测试...');
        console.log('');
        
        // 运行测试
        const runFeishuTest = require('./run-feishu-test.js');
        await runFeishuTest();
      } else {
        console.log('❌ 已取消配置');
      }
      
    } catch (error) {
      console.error('❌ 配置过程中出现错误:', error.message);
    } finally {
      this.rl.close();
    }
  }

  /**
   * 关闭向导
   */
  close() {
    this.rl.close();
  }
}

// 运行向导
if (require.main === module) {
  const wizard = new SetupWizard();
  wizard.run().catch(error => {
    console.error('向导异常退出:', error);
    process.exit(1);
  });
}

module.exports = SetupWizard;