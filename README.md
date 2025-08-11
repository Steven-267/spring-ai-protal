### spring-ai-protal（前端 Web）

基于 Vue 3 + Vite 的前端应用，提供 AI 聊天、多模态（图片/音频/视频）对话、PDF 问答、智能客服与旅游向导 Agent 的可视化界面。


### 技术栈
- Vue 3、Vue Router、Pinia（可选）
- Vite 6、TypeScript、Sass
- UI/功能：Naive UI、@heroicons/vue、highlight.js、marked、dompurify


### 功能亮点
- AI 聊天：支持多模态消息上传（图片/音频/视频），流式响应渲染
- PDF 问答：上传 PDF 后进行向量检索问答，内置 PDF 预览
- 智能客服：带结构化预约信息提示的小助手界面
- 旅游向导 Agent：结合后端高德工具链（MCP）进行路线、天气与周边检索
- 明暗主题切换、页面过渡动画与响应式布局


### 目录结构（节选）
```
spring-ai-protal/
  ├─ src/
  │  ├─ views/
  │  │  ├─ AIChat.vue          # 多模态聊天页面
  │  │  ├─ ChatPDF.vue         # PDF 上传/预览/问答
  │  │  ├─ CustomerService.vue # 智能客服
  │  │  └─ TourAgent.vue       # 旅游向导 Agent
  │  ├─ components/
  │  │  └─ ChatMessage.vue     # 消息气泡与 Markdown/代码高亮
  │  ├─ router/
  │  │  └─ index.ts            # 路由配置
  │  └─ services/
  │     └─ api.js              # 与后端交互的封装
  └─ public/
     └─ pdf.worker.js          # PDF 渲染所需 Worker
```


### 前置条件
- Node.js 18+（推荐 20+）
- npm 9+（或 pnpm/yarn，自行替换命令）


### 本地开发
1) 安装依赖
```
npm install
```

2) 启动开发服务器（默认端口 5173）
```
npm run dev
```

3) 访问
```
http://localhost:5173
```


### 与后端联调
后端默认地址为 `http://localhost:8080`。本前端默认直接请求后端地址，修改入口如下：

- `src/services/api.js` 顶部常量 `BASE_URL`
- `src/views/ChatPDF.vue` 内部常量 `BASE_URL`（用于下载/获取 PDF 文件）

若需通过 Nginx 统一代理至 `/api`：
- 将上述两个 `BASE_URL` 改为 `'/api'`（或按需拼接）
- 使用仓库内示例 `spring-ai-nginx/conf/nginx.conf`，将 `/api` 反代到后端 `http://localhost:8080`

后续可将 `BASE_URL` 抽为环境变量（如 `VITE_API_BASE_URL`）并在代码中读取，这里暂保持与现有实现一致。


### 路由与页面
- `/`：首页
- `/ai-chat`：AI 多模态聊天，支持图片/音频/视频上传；消息流式更新
- `/customer-service`：智能客服；识别预约信息并弹窗展示
- `/chat-pdf`：PDF 上传/预览/问答；支持历史会话切换与清空
- `/tour-agent`：旅游向导 Agent；结合地图工具生成规划与链接


### 已用后端接口（参考）
基址为 `BASE_URL`（见上文）。
- `POST /ai/chat`（流式）：发送聊天消息；表单字段 `prompt`，可附带 `files` 多文件与 `chatId`
- `GET /ai/service?prompt&chatId`（流式）：智能客服
- `GET /ai/travel?prompt&chatId`（流式）：旅游向导 Agent
- `GET /ai/pdf/chat?prompt&chatId`（流式）：PDF 问答
- `POST /ai/pdf/upload/{chatId}`：上传 PDF（字段名 `file`）
- `GET /ai/pdf/file/{chatId}`：下载/获取 PDF 文件（用于前端预览）
- 历史会话：`GET/DELETE /ai/history/{type}`、`GET/DELETE /ai/history/{type}/{chatId}`（`type` ∈ `chat|pdf|service|travel`）


### 构建与预览
- 构建产物：
```
npm run build
```
产物位于 `dist/`。

- 本地预览：
```
npm run preview
```


### 部署建议
- 静态托管 `dist/`（如 Nginx/OSS/CDN），并将 API 通过反向代理映射为 `/api` → 后端 `http://<host>:8080`
- 示例（Nginx 片段）：
```nginx
location /api {
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  rewrite /api/(.*) /$1 break;
  proxy_pass http://localhost:8080;
}
```


### 常见问题
- 无法连接后端：确认 `BASE_URL` 是否指向正确地址；开发阶段推荐使用反向代理规避 CORS
- 流式响应无显示：检查浏览器控制台及网络面板，确认后端响应头与内容是否持续推送
- PDF 预览失败：确保后端存在对应 `chatId` 的文件；检查 `GET /ai/pdf/file/{chatId}` 返回是否 200
- 多模态上传失败：检查文件类型与大小限制；后端需支持对应的 `multipart/form-data`


### 许可
如仓库根目录添加 `LICENSE`，以其为准。
