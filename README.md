# 蝉音 ZenSound 🎵

一个基于 Tauri 2.0 的本地和在线音乐播放器应用

## 功能特性

- 🎵 **本地音乐播放** - 支持导入本地音乐文件（MP3、FLAC、WAV、OGG、M4A、WMA）
- 🌐 **在线音源** - 支持从在线音源获取和播放音乐
- 📁 **音源文件导入** - 支持导入播放列表文件（JSON、M3U、PLS 等）
- 🎨 **精美界面** - 使用 TailwindCSS 打造的现代化暗色主题界面
- ⚡ **高性能** - 基于 Tauri 2.0 和 Svelte，轻量且快速

## 技术栈

- **前端**: Svelte + TypeScript
- **样式**: TailwindCSS
- **后端**: Tauri 2.0 (Rust)
- **音频**: HTML5 Audio + Howler.js

## 开发指南

### 环境要求

- **Node.js 18+** - https://nodejs.org/
- **Rust 1.70+** - https://rustup.rs/
- **Visual Studio Build Tools** (Windows, 使用 MSVC 工具链时)
  - 下载：https://visualstudio.microsoft.com/visual-cpp-build-tools/
  - 安装时选择"使用 C++ 的桌面开发"工作负载

**重要：** 推荐使用 MSVC 工具链以获得更好的 Windows 支持。详见 [DEVELOPMENT.md](DEVELOPMENT.md)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建应用

```bash
npm run tauri build
```

## 项目结构

```
zensound/
├── src/                      # 前端源码
│   ├── components/          # Svelte 组件
│   │   ├── Sidebar.svelte   # 侧边栏
│   │   ├── MainContent.svelte  # 主内容区
│   │   └── PlayerBar.svelte # 播放器控制栏
│   ├── stores/              # Svelte Store
│   │   └── player.ts        # 播放器状态管理
│   ├── utils/               # 工具函数
│   │   └── music.ts         # 音乐相关工具
│   ├── types.ts             # TypeScript 类型定义
│   ├── App.svelte           # 主应用组件
│   └── main.ts              # 入口文件
├── src-tauri/               # Tauri 后端源码
│   ├── src/
│   │   └── main.rs          # Rust 后端主文件
│   ├── capabilities/        # Tauri 权限配置
│   └── Cargo.toml           # Rust 依赖配置
├── package.json             # Node.js 依赖
├── tauri.conf.json          # Tauri 配置
├── tailwind.config.js       # TailwindCSS 配置
└── vite.config.ts           # Vite 配置
```

## 主要功能说明

### 导入本地音乐

点击侧边栏的"导入本地音乐"按钮，选择音频文件即可添加到播放列表。

### 导入音源文件

支持导入以下格式的播放列表文件：
- JSON 格式
- M3U / M3U8 格式
- PLS 格式

### 在线音源

可以通过导入音源文件或输入在线音源 URL 来获取在线音乐。

## 开发计划

- [ ] 歌词显示
- [ ] 均衡器
- [ ] 播放模式（单曲循环、随机播放等）
- [ ] 音乐标签编辑
- [ ] 主题切换
- [ ] 更多音源平台支持

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**蝉音 ZenSound** - 沉浸式音乐体验 🎵
