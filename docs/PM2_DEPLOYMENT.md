# PM2 生产环境部署指南

## 安装依赖

```bash
npm install
```

## 构建项目

```bash
npm run build
```

## PM2 命令

### 启动应用
```bash
npm run pm2:start
```

### 停止应用
```bash
npm run pm2:stop
```

### 重启应用
```bash
npm run pm2:restart
```

### 删除应用
```bash
npm run pm2:delete
```

### 查看日志
```bash
npm run pm2:logs
```

### 监控应用
```bash
npm run pm2:monit
```

## 生产环境部署步骤

1. 确保服务器已安装 Node.js 和 npm
2. 克隆项目到服务器
3. 安装依赖：`npm install`
4. 构建项目：`npm run build`
5. 启动应用：`npm run pm2:start`

## 应用配置

- 应用名称：cnote
- 端口：3001
- 环境：production
- 日志文件：./logs/
- 内存限制：1GB

## 注意事项

- 确保端口 3001 未被占用
- 日志文件会自动创建在 ./logs/ 目录下
- 应用会自动重启（autorestart: true）
- 生产环境变量通过 ecosystem.config.js 配置
