# SSO Token 分级测试工具

[![Deploy on Deno](https://deno.com/deno-deploy-button.svg)](https://dash.deno.com/new?url=https://raw.githubusercontent.com/022122/sso-tier-checker/main/main.ts)

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

可直接部署到 Deno Deploy，无需额外配置。