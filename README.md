# FurryChatbot

一个基于 Next.js 16 和 AI SDK 构建的ai chatbot应用，支持自定义配置多模型、流式对话、文档解析、RAG 检索增强生成和代码沙箱等功能。

## 技术栈

- **框架**: [Next.js 16](https://nextjs.org) (App Router, React 19, RSC, Server Actions)
- **AI**: [AI SDK 6](https://ai-sdk.dev) 统一接入多种大模型，支持流式输出和工具调用
- **UI**: [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) + [Tailwind CSS 4](https://tailwindcss.com)
- **认证**: [Auth.js 5](https://authjs.dev)
- **数据库**: PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)，支持 pgvector 向量检索
- **存储**: [Vercel Blob](https://vercel.com/storage/blob) 文件存储
- **测试**: [Playwright](https://playwright.dev) E2E 测试

## 功能特性

- **多模型支持**: 通过 AI SDK 接入 OpenAI、Anthropic 等多家模型提供商
- **流式对话**: 实时流式聊天，支持 markdown 渲染和代码高亮
- **Artifacts**: 在对话中生成并预览代码、文档、表格、图片等内容
- **RAG 检索增强生成**: 支持文档上传解析（PDF/DOCX/XLSX/PPTX），向量检索 + DashScope 重排序
- **网络搜索**: 集成 Tavily 搜索引擎，实时获取网络信息
- **图片生成**: 支持 AI 图片生成（SiliconFlow FLUX）
- **多模态输入**: 支持文本和文件混合输入
- **代码编辑器**: 内嵌 CodeMirror，支持语法高亮和编辑
- **主题切换**: 支持亮色/暗色主题
- **对话管理**: 对话历史持久化，支持公开/私密设置

## 本地运行

需要配置以下环境变量（参考 [.env.example](.env.example)）：

- `AUTH_SECRET` — 认证密钥，用于加密会话
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob 存储 Token
- `POSTGRES_URL` — PostgreSQL 数据库连接串
- `ENCRYPTION_KEY` — API Key 加密密钥（AES-256-GCM）

可选的功能 Key：

- `LLAMA_CLOUD_API_KEY` — 文档解析（LlamaCloud）
- `IMAGE_GEN_API_KEY` — AI 图片生成（SiliconFlow）
- `ZHIPU_API_KEY` — 文本嵌入模型（智谱 Embedding-3）
- `DASHSCOPE_API_KEY` — RAG 重排序（阿里云 DashScope）
- `TAVILY_API_KEY` — 网络搜索（Tavily）

```bash
# 安装依赖
pnpm install

# 初始化数据库
pnpm db:migrate

# 启动开发服务器
pnpm dev
```

应用将在 [localhost:3000](http://localhost:3000) 启动。

## 常用命令

```bash
pnpm dev          # 开发模式
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务
pnpm lint         # 代码检查
pnpm format       # 代码格式化
pnpm test         # 运行 E2E 测试
pnpm db:generate  # 生成数据库迁移文件
pnpm db:migrate   # 执行数据库迁移
pnpm db:studio    # 打开 Drizzle Studio
```

## 项目结构

```
app/              — Next.js App Router 页面和布局
components/       — React UI 组件 (ui/ 为通用基础组件)
lib/ai/           — 模型/提供商/提示词和工具集成
lib/db/schema.ts  — Drizzle ORM 数据模型定义
lib/rag/          — RAG 检索增强生成相关逻辑
lib/artifacts/    — Artifact 服务端逻辑
tests/e2e/        — Playwright E2E 测试
```
