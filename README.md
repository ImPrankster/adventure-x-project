### 作品指南
[作品指南飞书链接](https://q8aq2rpyhu.feishu.cn/wiki/Ftt6wWTNGiFrzikP6B7ckev2nYf)

### 体验链接 
https://idea-mesh.vercel.app (暂时只适配Web)

### 界面展示
见作品指南

### **项目技术栈说明**

#### **1. 项目概述**

本项目是一个基于现代化技术栈构建、并部署在 **Vercel** 平台的全栈 Web 应用。前端采用 Next.js 框架，结合 shadcn/ui 和 Tailwind CSS 快速构建美观、响应式的用户界面。后端及数据库采用 Convex 平台，实现了实时数据同步和无服务器化。用户认证由 Clerk 提供全方位支持。此外，项目集成了 Kimi 和 Minimax 的 AI 能力，以提供智能化的功能，并且感谢MiniMax, Clacky提供的Vibe coding和agent支持，帮助我们完善后端和算法部分开发，另外感谢paraflow平台提供的UI设计支持。
。

#### **2. 技术栈详情**

*   **前端框架 (Frontend Framework):**
    *   **Next.js:** 作为核心的 React 框架，负责应用的路由、页面渲染（支持 SSR/SSG/ISR）和 API 路由。
      

*   **UI & 样式 (UI & Styling):**
    *   **shadcn/ui:** 提供了一套设计精良、易于定制的无样式组件库，作为 UI 开发的基础。
    *   **Tailwind CSS:** 作为原子化 CSS 框架，为项目提供了高效、灵活的样式解决方案。
    *   **paraflow** 平台提供帮助

*   **后端与数据库 (Backend & Database):**
    *   **Convex:** 作为全栈后端即服务 (BaaS) 平台，提供了实时数据库、云函数 (Cloud Functions) 和文件存储。前端可直接与其交互，极大地简化了后端开发和数据同步的复杂性。
    *   **MiniMax**, **Clacky**提供的Vibe coding和agent支持

*   **认证服务 (Authentication):**
    *   **Clerk:** 提供了完整的用户认证与管理解决方案，轻松集成了登录、注册、会话管理和用户资料等功能，保障了应用安全。

*   **AI 服务 (AI Services):**
    *   **Kimi API & Minimax API:** 集成了这两个大语言模型 API，用于实现智能问答、内容生成、文本分析等高级 AI 功能。这些 API 通常在 Convex 的云函数或 Next.js 的 API 路由中被安全调用。

*   **部署与托管 (Deployment & Hosting):**
    *   **Vercel:** 作为项目的部署和托管平台。它与 Next.js 无缝集成，提供全球 CDN、自动 CI/CD、Serverless Functions 等功能，确保了应用的高性能、高可用性和快速迭代。

*   **开发环境 (Development Environment):**
    *   **Cursor:** 作为主要的开发编辑器，其深度集成的 AI 辅助编程能力显著提升了代码编写、重构和调试的效率。
    *   **MiniMax**, **Clacky**提供Vibe coding和agent支持

#### **3. 整体架构**

1.  **用户交互:** 用户通过浏览器访问由 **Next.js** 渲染的前端页面。
2.  **认证流程:** **Clerk** 负责处理用户的登录、注册流程，并管理用户会话。
3.  **数据交互:** 登录后，前端组件通过 Convex 客户端直接与 **Convex** 后端进行实时数据读写（Queries & Mutations）。
4.  **业务逻辑:**
    *   简单的业务逻辑在前端处理。
    *   复杂的或需要安全验证的业务逻辑（如调用 AI API）则通过 **Convex 的云函数** 执行。
5.  **AI 功能:** Convex 云函数接收到前端请求后，携带密钥安全地调用 **Kimi** 或 **Minimax** 的 API，并将结果返回给前端。
6.  **界面呈现:** **shadcn/ui** 组件和 **Tailwind CSS** 样式共同构成了用户所见的最终界面。
7.  **部署与托管:** 整个应用通过 **Vercel** 进行自动化部署和全球分发，利用其平台优势实现快速、可靠的线上服务。


**欢迎大家star, 基于这个真的尝试更多保留思维多样性的尝试！！！！**
