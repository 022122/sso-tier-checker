# SSO Token 分级测试工具

[![Deploy on Deno](https://deno.com/button)](https://console.deno.com/new?clone=https://github.com/022122/sso-tier-checker)

基于 Deno 的 Web 工具，通过查询 Grok rate-limits API 自动判断 SSO Token 的等级分类。

## 分级规则

| 等级 | 剩余配额 |
|------|----------|
| Heavy | ≥ 41 |
| Super | 9 ~ 40 |
| Basic | < 9 |

## 快速开始

```bash
# 启动服务
deno task start

# 开发模式（自动重载）
deno task dev
```

启动后访问 `http://localhost:8899`，在页面中粘贴 Token（每行一个），点击「开始测试」即可。

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `8899` | 服务监听端口 |
| `PROXY` | 空 | HTTP 代理地址（仅本地 Deno 运行时生效） |

## 功能

- 批量检测 Token 等级，自动去重
- 按等级分类展示结果（Heavy / Super / Basic / Unknown）
- 支持一键复制、下载指定等级的 Token 列表
- 支持 `sso=` 前缀自动剥离

## 部署

### Deno Deploy

点击上方按钮一键部署，或手动在 [Deno Deploy](https://dash.deno.com) 中导入本仓库。

### Cloudflare Worker

项目提供了独立的 `worker.js`，单文件零依赖，可直接部署到 Cloudflare Worker。

**方式一：Wrangler CLI**

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署
wrangler deploy worker.js --name sso-tier-checker --compatibility-date 2024-01-01
```

**方式二：Dashboard 手动创建**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create
2. 创建一个新 Worker，将 `worker.js` 的内容粘贴到编辑器中
3. 点击 Deploy 即可