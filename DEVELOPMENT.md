# 蝉音 ZenSound 开发指南

## 项目概述

蝉音 (ZenSound) 是一个基于 Tauri 2.0 的跨平台音乐播放器应用，支持本地音乐播放和在线音源获取。

**技术栈：**
- 前端：Svelte + TypeScript
- 样式：TailwindCSS
- 后端：Tauri 2.0 (Rust)
- 音频：HTML5 Audio

## 环境要求

### 必需工具

1. **Node.js 18+**
   - 下载地址：https://nodejs.org/

2. **Rust**
   - 安装：https://rustup.rs/
   - 推荐工具链选择（二选一）：

### 方案 A：使用 MSVC 工具链（推荐 Windows 用户）

**优点：** 更好的 Windows 集成，编译速度快
**缺点：** 需要安装 Visual Studio Build Tools

#### 安装步骤：

1. 安装 Visual Studio Build Tools：
   - 下载：https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - 运行安装程序
   - 选择 **"使用 C++ 的桌面开发"** 工作负载
   - 确保勾选 **"Windows 10/11 SDK"** 和 **"MSVC v14.x"** 组件
   - 完成安装

2. 切换到 MSVC 工具链：
   ```bash
   rustup default stable-x86_64-pc-windows-msvc
   ```

3. 验证安装：
   ```bash
   rustc --version
   cargo --version
   ```

### 方案 B：使用 GNU 工具链

**优点：** 轻量级，不需要 Visual Studio
**缺点：** 需要安装 MinGW-w64，需要配置 dlltool

#### 安装步骤：

1. 安装 MSYS2：
   - 下载：https://www.msys2.org/
   - 运行安装程序

2. 安装 MinGW-w64 工具链：
   ```bash
   pacman -S mingw-w64-x86_64-toolchain
   ```

3. 添加环境变量：
   - 将 `C:\msys64\mingw64\bin` 添加到系统 PATH

4. 切换到 GNU 工具链：
   ```bash
   rustup default stable-x86_64-pc-windows-gnu
   ```

## 开发流程

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式运行

```bash
npm run tauri dev
```

这会同时启动：
- Vite 开发服务器（http://localhost:1420）
- Tauri 应用窗口

### 3. 构建应用

```bash
npm run tauri build
```

构建产物位置：
- Windows: `src-tauri/target/release/bundle/msi/` 或 `nsis/`

## 项目结构

```
zensound/
├── src/                      # 前端源码
│   ├── components/
│   │   ├── Sidebar.svelte    # 侧边栏组件
│   │   ├── MainContent.svelte # 主内容区
│   │   └── PlayerBar.svelte  # 播放器控制栏
│   ├── stores/
│   │   └── player.ts         # 播放器状态管理
│   ├── utils/
│   │   └── music.ts          # 音乐工具函数
│   ├── types.ts              # TypeScript 类型定义
│   ├── App.svelte            # 主应用组件
│   ├── main.ts               # 入口文件
│   └── app.css               # 全局样式
├── src-tauri/
│   ├── src/
│   │   ├── main.rs           # Rust 主入口
│   │   └── lib.rs            # Rust 库（包含命令）
│   ├── capabilities/
│   │   └── main.json         # Tauri 权限配置
│   ├── Cargo.toml            # Rust 依赖配置
│   ├── build.rs              # Rust 构建脚本
│   └── tauri.conf.json       # Tauri 配置
├── Cargo.toml                # Rust workspace 配置
├── package.json              # Node.js 依赖
├── vite.config.ts            # Vite 配置
├── tailwind.config.js        # TailwindCSS 配置
└── README.md                 # 项目说明
```

## 主要功能

### 1. 本地音乐播放

- 支持格式：MP3, FLAC, WAV, OGG, M4A, WMA
- 通过侧边栏"导入本地音乐"按钮导入
- 使用系统文件选择对话框

### 2. 在线音源

- 支持从 URL 播放在线音乐
- 支持导入播放列表文件（JSON, M3U, PLS）
- 通过侧边栏"导入音源文件"按钮导入

### 3. 播放器功能

- 播放/暂停控制
- 上一曲/下一曲
- 进度条拖拽
- 音量调节
- 静音切换

## 常见问题解决

### 问题 1：编译错误 "link.exe not found"

**原因：** 使用 MSVC 工具链但未安装 Visual Studio Build Tools

**解决方案：**
1. 安装 Visual Studio Build Tools
2. 确保安装 "使用 C++ 的桌面开发" 工作负载
3. 重启终端后重试

### 问题 2：编译错误 "dlltool.exe not found"

**原因：** 使用 GNU 工具链但未安装 MinGW

**解决方案：**
1. 安装 MSYS2 和 MinGW-w64
2. 将 MinGW bin 目录添加到 PATH
3. 或者切换到 MSVC 工具链

### 问题 3：Tauri 启动错误 "No package info in the config file"

**原因：** Tauri 2.0 workspace 配置问题

**解决方案：**
已在项目中修复，确保：
- 根目录有 Cargo.toml
- src-tauri/Cargo.toml 包含完整的 [package] 信息
- tauri.conf.json 中的 version 与 Cargo.toml 一致

### 问题 4：前端热更新不工作

**解决方案：**
```bash
# 清除缓存
rm -rf node_modules/.vite
npm run dev
```

## 扩展开发

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/lib.rs` 添加命令函数：

```rust
#[tauri::command]
fn my_command(arg: String) -> Result<String, String> {
    Ok(format!("Hello, {}", arg))
}
```

2. 注册命令：

```rust
.invoke_handler(tauri::generate_handler![
    get_music_metadata,
    parse_source_file,
    fetch_online_tracks,
    my_command,  // 添加新命令
])
```

3. 前端调用：

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('my_command', { arg: 'World' });
```

### 添加新的 Tauri 插件

1. 在 `src-tauri/Cargo.toml` 添加依赖：

```toml
[dependencies]
tauri-plugin-xxx = "2"
```

2. 在 `src-tauri/src/lib.rs` 初始化：

```rust
.plugin(tauri_plugin_xxx::init())
```

3. 在 `src-tauri/capabilities/main.json` 添加权限

4. 在 `tauri.conf.json` 添加插件配置

## 下一步开发计划

- [ ] 歌词显示功能
- [ ] 音乐标签编辑
- [ ] 均衡器
- [ ] 播放模式（单曲循环、随机播放）
- [ ] 主题切换（亮色/暗色）
- [ ] 更多音源平台支持

## 资源链接

- [Tauri 2.0 官方文档](https://v2.tauri.app/)
- [Svelte 文档](https://svelte.dev/docs)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
- [Rust 编程语言](https://www.rust-lang.org/learn)

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**蝉音 ZenSound** - 沉浸式音乐体验 🎵
