# Polyflow Auto Bot

自动生成并提交发票到Polyflow Scan2Earn平台，帮助您最大化空投潜力。

## 🚀 功能特点

- ✅ 自动生成逼真的发票图片
- ✅ 处理token认证
- ✅ 多token支持（运行多个账号）
- ✅ 代理支持实现IP轮换
- ✅ 完全随机化的执行时间和次数
- ✅ 每个token专用的Chrome用户代理
- ✅ 每日自动重新生成任务计划
- ✅ 支持长期无人值守运行

## 📋 系统要求

- Node.js (v14+)
- NPM或Yarn

## ⚙️ 安装步骤

1. 克隆仓库:
```bash
git clone https://github.com/airdropinsiders/Polyflow-Auto-Bot.git
```

2. 进入项目目录:
```bash
cd Polyflow-Auto-Bot
```

3. 安装依赖:
```bash
npm install
```

## 📝 配置说明

1. 在项目根目录创建`token.txt`文件，添加您的Polyflow授权token（每行一个）:
```
your_token_here
another_token_here
```
注意：不再需要手动添加"Bearer "前缀，系统会自动添加

2. (可选) 在项目根目录创建`proxies.txt`文件，添加您的代理（每行一个）:
```
http://username:password@ip:port
http://ip:port
```

## 🏃‍♂️ 使用方法

运行机器人:
```bash
npm start
```

系统将自动执行以下步骤：
1. 在白天时间范围内（8:00-22:00）随机生成4-6个执行时间点
2. 为每个执行时间点随机分配3-8次的扫描任务
3. 每次扫描之间随机延迟60-300秒
4. 每天凌晨自动重置并生成新的随机执行计划

您可以根据需要调整以下配置参数：
- 每天执行的次数范围
- 每次执行的扫描次数范围
- 扫描之间的延迟时间范围

## ⚠️ 免责声明

此机器人仅用于教育目的。使用风险自负。我们不对Polyflow因自动化活动而实施的任何账户限制或处罚负责。

## 💡 使用技巧

- 使用随机化功能避免被检测
- 使用代理轮换IP以获得更好的结果
- 使用多个token分散活动
- 推荐使用PM2等工具在后台长期运行

## 🤝 贡献

欢迎贡献！请随时提交Pull Request。

## 📜 许可证

本项目采用MIT许可证 - 详情请参阅LICENSE文件。

## 👏 致谢

鸣谢[Airdrop Insiders](https://github.com/airdropinsiders), 由[fanyilun0](https://github.com/fanyilun0)修改
