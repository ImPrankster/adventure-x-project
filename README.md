### **项目技术栈说明**

### **1. 项目概述**

本项目是一个基于现代化技术栈构建的全栈 Web 应用。前端采用 Next.js 框架，结合 shadcn/ui 和 Tailwind CSS 快速构建美观、响应式的用户界面。后端及数据库采用 Convex 平台，实现了实时数据同步和无服务器化。用户认证由 Clerk 提供全方位支持。此外，项目集成了 Kimi 和 Minimax 的 AI 能力，以提供智能化的功能。

### **2. 技术栈详情**

- **前端框架 (Frontend Framework):**
    - **Next.js:** 作为核心的 React 框架，负责应用的路由、页面渲染（支持 SSR/SSG/ISR）和 API 路由。
- **UI & 样式 (UI & Styling):**
    - **shadcn/ui:** 提供了一套设计精良、易于定制的无样式组件库，作为 UI 开发的基础。
    - **Tailwind CSS:** 作为原子化 CSS 框架，为项目提供了高效、灵活的样式解决方案。
- **后端与数据库 (Backend & Database):**
    - **Convex:** 作为全栈后端即服务 (BaaS) 平台，提供了实时数据库、云函数 (Cloud Functions) 和文件存储。前端可直接与其交互，极大地简化了后端开发和数据同步的复杂性。
- **认证服务 (Authentication):**
    - **Clerk:** 提供了完整的用户认证与管理解决方案，轻松集成了登录、注册、会话管理和用户资料等功能，保障了应用安全。
- **AI 服务 (AI Services):**
    - **Kimi API & Minimax API:** 集成了这两个大语言模型 API，用于实现智能问答、内容生成、文本分析等高级 AI 功能。这些 API 通常在 Convex 的云函数或 Next.js 的 API 路由中被安全调用。
- **开发环境 (Development Environment):**
    - **Cursor:** 作为主要的开发编辑器，其深度集成的 AI 辅助编程能力显著提升了代码编写、重构和调试的效率。