<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { open } from '@tauri-apps/plugin-dialog';
  import { playerStore } from '../stores/player';
  import { sourceStore } from '../stores/music-source';
  import { settingsStore } from '../stores/settings';
  import { importSourceFile } from '../utils/music';
  import { fetchOnlineSource } from '../utils/flower-source';
  import type { MusicTrack } from '../types';
  
  let activeSection = $state('general');
  let settings = $state($settingsStore);
  let isSaving = $state(false);
  let saveSuccess = $state(false);
  let onlineSourceUrl = $state('');
  let isImportingOnline = $state(false);
  let importMessage = $state<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  
  // 加载设置
  $effect(() => {
    settingsStore.load().catch(console.error);
  });
  
  // 自动保存设置（延迟保存）
  let saveTimeout: NodeJS.Timeout | null = null;
  $effect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    saveTimeout = setTimeout(async () => {
      await settingsStore.save();
    }, 1000);
  });
  
  const sections = [
    { id: 'general', label: '常规设置', icon: 'bi-gear' },
    { id: 'playback', label: '播放设置', icon: 'bi-play-circle' },
    { id: 'download', label: '下载设置', icon: 'bi-download' },
    { id: 'shortcuts', label: '快捷键', icon: 'bi-keyboard' },
    { id: 'about', label: '关于', icon: 'bi-info-circle' },
  ];
  
  const qualityOptions = [
    { value: 'low', label: '标准音质', desc: '128kbps' },
    { value: 'medium', label: '较高音质', desc: '192kbps' },
    { value: 'high', label: '极高音质', desc: '320kbps' },
    { value: 'lossless', label: '无损音质', desc: 'FLAC' },
  ];
  
  async function handleSectionChange(section: string) {
    activeSection = section;
  }
  
  async function handleChangePath() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择下载目录'
      });
      
      if (selected) {
        await settingsStore.updateSetting('downloadPath', selected as string);
      }
    } catch (error) {
      console.error('选择目录失败:', error);
    }
  }
  
  function handleResetShortcuts() {
    settingsStore.updateSetting('shortcuts', {
      playPause: 'Ctrl + Space',
      next: 'Ctrl + Right',
      previous: 'Ctrl + Left',
      volumeUp: 'Ctrl + Up',
      volumeDown: 'Ctrl + Down',
    }).catch(console.error);
  }
  
  async function handleImportSource() {
    try {
      const tracks = await importSourceFile();
      if (tracks.length > 0) {
        const playlist = playerStore.playlist;
        const newPlaylist = [...playlist, ...tracks];
        playerStore.setPlaylist(newPlaylist);
        
        // 更新音源状态
        const platforms = [...new Set(tracks.map(t => t.platform).filter(Boolean))];
        if (platforms.length > 0) {
          sourceStore.addSource({
            name: '野花音源',
            version: '1.0',
            platforms: platforms as string[],
            isActive: true,
          });
          
          // 保存到设置
          await settingsStore.addSource('野花音源');
          
          window.alert(`成功导入音源！\n\n已识别平台：${platforms.map(p => getPlatformName(p)).join('、')}\n\n现在可以在播放列表中搜索和播放这些平台的音乐了。`);
        } else {
          window.alert('音源文件导入成功，但未识别到可用平台。');
        }
      }
    } catch (error) {
      console.error('导入音源文件失败:', error);
      window.alert('导入音源文件失败：' + error);
    }
  }
  
  async function handleImportOnlineSource() {
    if (!onlineSourceUrl.trim()) {
      importMessage = {type: 'error', text: '请输入在线音源文件 URL'};
      setTimeout(() => importMessage = null, 3000);
      return;
    }
    
    try {
      isImportingOnline = true;
      importMessage = null;
      
      // 使用野花 API 获取音源内容
      const result = await fetchOnlineSource(onlineSourceUrl.trim());
      
      if (result && result.length > 0) {
        // 获取当前播放列表
        const currentPlaylist = $playerStore.playlist || [];
        const newPlaylist = [...currentPlaylist, ...result];
        playerStore.setPlaylist(newPlaylist);
        
        // 更新音源状态
        const platforms = [...new Set(result.map(t => t.platform).filter(Boolean))];
        if (platforms.length > 0) {
          sourceStore.addSource({
            name: '在线音源',
            version: '1.0',
            platforms: platforms as string[],
            isActive: true,
          });
          
          // 保存到设置
          await settingsStore.addSource('在线音源');
          
          importMessage = {
            type: 'success',
            text: `成功导入在线音源！已识别平台：${platforms.map(p => getPlatformName(p)).join('、')}`
          };
          onlineSourceUrl = '';
        } else {
          importMessage = {
            type: 'info',
            text: '音源文件导入成功，但未识别到可用平台。'
          };
        }
      } else {
        importMessage = {
          type: 'error',
          text: '未能从 URL 获取到音源内容，请检查 URL 是否正确。'
        };
      }
    } catch (error) {
      console.error('导入在线音源失败:', error);
      importMessage = {
        type: 'error',
        text: '导入在线音源失败：' + (error as Error).message
      };
    } finally {
      isImportingOnline = false;
      // 3 秒后清除消息
      setTimeout(() => importMessage = null, 5000);
    }
  }
  
  function getPlatformName(platformCode: string): string {
    const platformMap: Record<string, string> = {
      'kw': '酷我音乐',
      'kg': '酷狗音乐',
      'tx': 'QQ 音乐',
      'wy': '网易云音乐',
      'mg': '咪咕音乐',
    };
    return platformMap[platformCode] || platformCode;
  }
  
  async function handleResetSettings() {
    if (window.confirm('确定要重置所有设置吗？此操作不可恢复。')) {
      await settingsStore.reset();
      window.alert('设置已重置为默认值');
    }
  }
</script>

<div class="flex-1 flex flex-col overflow-hidden bg-gray-50">
  <!-- 设置标题 -->
  <div class="px-4 py-3 border-b border-gray-200 bg-white">
    <h1 class="text-lg font-semibold text-gray-800">设置</h1>
  </div>
  
  <div class="flex flex-1 overflow-hidden">
    <!-- 左侧导航 -->
    <div class="w-48 bg-white border-r border-gray-200 overflow-y-auto">
      <nav class="p-2 space-y-0.5">
        {#each sections as section}
          <button
            onclick={() => handleSectionChange(section.id)}
            class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm"
            class:bg-indigo-50={activeSection === section.id}
            class:text-indigo-600={activeSection === section.id}
            class:hover:bg-gray-50={activeSection !== section.id}
            class:text-gray-700={activeSection !== section.id}
          >
            <i class="bi {section.icon} text-base"></i>
            <span class="font-medium">{section.label}</span>
            {#if activeSection === section.id}
              <i class="bi bi-chevron-right ml-auto text-xs"></i>
            {/if}
          </button>
        {/each}
      </nav>
      
      <!-- 版本信息 -->
      <div class="mt-auto pt-3 px-3 border-t border-gray-100 pb-2">
        <div class="text-xs text-gray-400">
          <p>蝉声音乐</p>
          <p>版本 0.0.1</p>
        </div>
      </div>
    </div>
    
    <!-- 右侧内容区 -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- 常规设置 -->
      {#if activeSection === 'general'}
        <div class="space-y-3">
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 class="text-base font-semibold text-gray-800 mb-3">启动与系统</h2>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-700 text-sm">开机自动启动</p>
                <button
                  onclick={() => settingsStore.updateSetting('launchAtStartup', !settings.launchAtStartup)}
                  class="relative w-10 h-5 rounded-full transition-colors"
                  class:bg-indigo-500={settings.launchAtStartup}
                  class:bg-gray-300={!settings.launchAtStartup}
                  aria-label="开机自动启动"
                  title="开机自动启动"
                >
                  <span
                    class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow"
                    class:left-5={settings.launchAtStartup}
                    class:left-0.5={!settings.launchAtStartup}
                  ></span>
                </button>
              </div>
              
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-700 text-sm">关闭窗口时退出软件</p>
                <button
                  onclick={() => settingsStore.updateSetting('exitOnClose', !settings.exitOnClose)}
                  class="relative w-10 h-5 rounded-full transition-colors"
                  class:bg-indigo-500={settings.exitOnClose}
                  class:bg-gray-300={!settings.exitOnClose}
                  aria-label="关闭窗口时退出软件"
                  title="关闭窗口时退出软件"
                >
                  <span
                    class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow"
                    class:left-5={settings.exitOnClose}
                    class:left-0.5={!settings.exitOnClose}
                  ></span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 class="text-base font-semibold text-gray-800 mb-3">通知与显示</h2>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-700 text-sm">显示桌面通知</p>
                <button
                  onclick={() => settingsStore.updateSetting('showNotification', !settings.showNotification)}
                  class="relative w-10 h-5 rounded-full transition-colors"
                  class:bg-indigo-500={settings.showNotification}
                  class:bg-gray-300={!settings.showNotification}
                  aria-label="显示桌面通知"
                  title="显示桌面通知"
                >
                  <span
                    class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow"
                    class:left-5={settings.showNotification}
                    class:left-0.5={!settings.showNotification}
                  ></span>
                </button>
              </div>
              
              <div>
                <label for="language-select" class="block font-medium text-gray-700 text-sm mb-1.5">语言</label>
                <select
                  id="language-select"
                  value={settings.language}
                  onchange={(e) => settingsStore.updateSetting('language', e.target.value)}
                  aria-label="选择语言"
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all text-gray-700 text-sm"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 class="text-base font-semibold text-gray-800 mb-3">自定义音源</h2>
            
            <!-- 消息提示 -->
            {#if importMessage}
              <div class="mb-3 p-3 rounded-lg border text-sm"
                class:bg-green-50={importMessage.type === 'success'}
                class:border-green-200={importMessage.type === 'success'}
                class:text-green-700={importMessage.type === 'success'}
                class:bg-red-50={importMessage.type === 'error'}
                class:border-red-200={importMessage.type === 'error'}
                class:text-red-700={importMessage.type === 'error'}
                class:bg-blue-50={importMessage.type === 'info'}
                class:border-blue-200={importMessage.type === 'info'}
                class:text-blue-700={importMessage.type === 'info'}
              >
                <i class="bi {importMessage.type === 'success' ? 'bi-check-circle' : importMessage.type === 'error' ? 'bi-exclamation-circle' : 'bi-info-circle'} mr-2"></i>
                {importMessage.text}
              </div>
            {/if}
            
            <div class="space-y-3">
              <div>
                <p class="font-medium text-gray-700 text-sm mb-2">本地导入</p>
                <p class="text-xs text-gray-500 mb-2">从本地文件导入音源（.js 格式）</p>
                <button
                  onclick={handleImportSource}
                  class="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                >
                  <i class="bi bi-folder2-open mr-1.5"></i>
                  选择 JS 文件
                </button>
              </div>
              
              <div class="border-t border-gray-100 pt-3">
                <p class="font-medium text-gray-700 text-sm mb-2">在线导入</p>
                <p class="text-xs text-gray-500 mb-2">从 URL 导入在线音源文件</p>
                <div class="flex gap-2">
                  <input
                    type="text"
                    value={onlineSourceUrl}
                    oninput={(e) => onlineSourceUrl = e.target.value}
                    placeholder="输入音源文件 URL（如：https://ghproxy.net/https://raw.githubusercontent.com/...）"
                    class="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all text-gray-700 text-sm"
                  />
                  <button
                    onclick={handleImportOnlineSource}
                    disabled={isImportingOnline || !onlineSourceUrl.trim()}
                    class="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    {#if isImportingOnline}
                      <i class="bi bi-hourglass-split mr-1.5"></i>
                      导入中...
                    {:else}
                      <i class="bi bi-cloud-download mr-1.5"></i>
                      在线导入
                    {/if}
                  </button>
                </div>
                <div class="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <p class="text-xs text-blue-700">
                    <i class="bi bi-info-circle mr-1"></i>
                    示例 URL: <code class="text-blue-600">https://ghproxy.net/https://raw.githubusercontent.com/pdone/lx-music-source/main/flower/latest.js</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- 播放设置 -->
      {#if activeSection === 'playback'}
        <div class="space-y-3">
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 class="text-base font-semibold text-gray-800 mb-3">音质与播放</h2>
            
            <div class="space-y-3">
              <div>
                <fieldset>
                  <legend class="block font-medium text-gray-700 text-sm mb-2">默认播放音质</legend>
                  <div class="space-y-1.5">
                    {#each qualityOptions as option}
                      <label class="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all"
                        class:border-indigo-500={settings.quality === option.value}
                        class:bg-indigo-50={settings.quality === option.value}
                        class:border-gray-200={settings.quality !== option.value}
                        class:hover:bg-gray-50={settings.quality !== option.value}
                      >
                        <input
                          type="radio"
                          name="quality"
                          value={option.value}
                          onchange={() => settingsStore.updateSetting('quality', option.value)}
                          checked={settings.quality === option.value}
                          class="w-3.5 h-3.5 text-indigo-500"
                        />
                        <div class="flex-1">
                          <p class="font-medium text-gray-700 text-sm">{option.label}</p>
                        </div>
                      </label>
                    {/each}
                  </div>
                </fieldset>
              </div>
              
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-700 text-sm">启用无缝播放</p>
                <button
                  onclick={() => settingsStore.updateSetting('enableGapless', !settings.enableGapless)}
                  class="relative w-10 h-5 rounded-full transition-colors"
                  class:bg-indigo-500={settings.enableGapless}
                  class:bg-gray-300={!settings.enableGapless}
                  aria-label="启用无缝播放"
                  title="启用无缝播放"
                >
                  <span
                    class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow"
                    class:left-5={settings.enableGapless}
                    class:left-0.5={!settings.enableGapless}
                  ></span>
                </button>
              </div>
              
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-700 text-sm">自动播放</p>
                <button
                  onclick={() => settingsStore.updateSetting('autoPlay', !settings.autoPlay)}
                  class="relative w-10 h-5 rounded-full transition-colors"
                  class:bg-indigo-500={settings.autoPlay}
                  class:bg-gray-300={!settings.autoPlay}
                  aria-label="自动播放"
                  title="自动播放"
                >
                  <span
                    class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow"
                    class:left-5={settings.autoPlay}
                    class:left-0.5={!settings.autoPlay}
                  ></span>
                </button>
              </div>
              
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-700 text-sm">插入耳机自动播放</p>
                <button
                  onclick={() => settingsStore.updateSetting('playOnHeadset', !settings.playOnHeadset)}
                  class="relative w-10 h-5 rounded-full transition-colors"
                  class:bg-indigo-500={settings.playOnHeadset}
                  class:bg-gray-300={!settings.playOnHeadset}
                  aria-label="插入耳机自动播放"
                  title="插入耳机自动播放"
                >
                  <span
                    class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow"
                    class:left-5={settings.playOnHeadset}
                    class:left-0.5={!settings.playOnHeadset}
                  ></span>
                </button>
              </div>
              
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-700 text-sm">播放模式</p>
                <select
                  value={settings.playMode}
                  onchange={(e) => settingsStore.updateSetting('playMode', e.target.value as 'loop' | 'shuffle' | 'single')}
                  class="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all text-gray-700 text-sm"
                >
                  <option value="loop">列表循环</option>
                  <option value="shuffle">随机播放</option>
                  <option value="single">单曲循环</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 class="text-base font-semibold text-gray-800 mb-3">音量设置</h2>
            
            <div class="space-y-3">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="font-medium text-gray-700 text-sm">默认音量</label>
                  <span class="text-xs text-gray-500">{settings.defaultVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.defaultVolume}
                  oninput={(e) => settingsStore.updateSetting('defaultVolume', parseInt(e.target.value))}
                  class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- 下载设置 -->
      {#if activeSection === 'download'}
        <div class="space-y-3">
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 class="text-base font-semibold text-gray-800 mb-3">下载路径</h2>
            
            <div class="space-y-3">
              <div>
                <label for="download-path" class="block font-medium text-gray-700 text-sm mb-1.5">默认下载目录</label>
                <div class="flex gap-2">
                  <input
                    id="download-path"
                    type="text"
                    value={settings.downloadPath}
                    readonly
                    aria-label="下载目录路径"
                    class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm"
                  />
                  <button
                    onclick={handleChangePath}
                    class="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium text-sm"
                    aria-label="更改下载目录"
                    title="更改下载目录"
                  >
                    <i class="bi bi-folder2-open mr-1.5"></i>
                    更改
                  </button>
                </div>
              </div>
              
              <div class="flex items-center justify-between">
                <p class="font-medium text-gray-700 text-sm">自动下载收藏歌曲</p>
                <button
                  onclick={() => settingsStore.updateSetting('autoDownload', !settings.autoDownload)}
                  class="relative w-10 h-5 rounded-full transition-colors"
                  class:bg-indigo-500={settings.autoDownload}
                  class:bg-gray-300={!settings.autoDownload}
                  aria-label="自动下载收藏歌曲"
                  title="自动下载收藏歌曲"
                >
                  <span
                    class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow"
                    class:left-5={settings.autoDownload}
                    class:left-0.5={!settings.autoDownload}
                  ></span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 class="text-base font-semibold text-gray-800 mb-3">下载音质</h2>
            
            <div class="space-y-1.5">
              {#each qualityOptions as option}
                <label class="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all"
                  class:border-indigo-500={settings.downloadQuality === option.value}
                  class:bg-indigo-50={settings.downloadQuality === option.value}
                  class:border-gray-200={settings.downloadQuality !== option.value}
                  class:hover:bg-gray-50={settings.downloadQuality !== option.value}
                >
                  <input
                    type="radio"
                    name="downloadQuality"
                    value={option.value}
                    onchange={() => settingsStore.updateSetting('downloadQuality', option.value)}
                    checked={settings.downloadQuality === option.value}
                    class="w-3.5 h-3.5 text-indigo-500"
                  />
                  <div class="flex-1">
                    <p class="font-medium text-gray-700 text-sm">{option.label}</p>
                  </div>
                </label>
              {/each}
            </div>
          </div>
        </div>
      {/if}
      
      <!-- 快捷键设置 -->
      {#if activeSection === 'shortcuts'}
        <div class="space-y-3">
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-base font-semibold text-gray-800">快捷键设置</h2>
              <button
                onclick={handleResetShortcuts}
                class="px-2 py-1 text-xs text-indigo-500 hover:bg-indigo-50 rounded transition-colors font-medium"
              >
                <i class="bi bi-arrow-counterclockwise mr-1"></i>
                重置默认
              </button>
            </div>
            
            <div class="space-y-2">
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p class="font-medium text-gray-700 text-sm">播放/暂停</p>
                <div class="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-700">
                  {settings.shortcuts.playPause}
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p class="font-medium text-gray-700 text-sm">下一曲</p>
                <div class="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-700">
                  {settings.shortcuts.next}
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p class="font-medium text-gray-700 text-sm">上一曲</p>
                <div class="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-700">
                  {settings.shortcuts.previous}
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p class="font-medium text-gray-700 text-sm">音量增加</p>
                <div class="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-700">
                  {settings.shortcuts.volumeUp}
                </div>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p class="font-medium text-gray-700 text-sm">音量减小</p>
                <div class="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-700">
                  {settings.shortcuts.volumeDown}
                </div>
              </div>
            </div>
            
            <div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div class="flex items-start gap-2">
                <i class="bi bi-info-circle text-blue-500 text-sm mt-0.5"></i>
                <div class="text-xs text-blue-700">
                  <p class="font-medium mb-0.5">提示</p>
                  <p>点击快捷键框可以自定义快捷键组合。支持 Ctrl、Alt、Shift 修饰键组合。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- 关于页面 -->
      {#if activeSection === 'about'}
        <div class="space-y-3">
          <!-- 应用信息 -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md mx-auto mb-3">
              <i class="bi bi-music-note-beamed text-2xl text-white"></i>
            </div>
            <h2 class="text-xl font-bold text-gray-800 mb-1">蝉声为歌</h2>
            <p class="text-gray-500 text-sm mb-3">禅意音乐播放器</p>
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
              <i class="bi bi-patch-check"></i>
              版本 1.0.0
            </div>
          </div>
          
          <!-- 功能链接 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button class="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
              <div class="flex items-center gap-2">
                <i class="bi bi-book text-gray-400 text-sm"></i>
                <span class="font-medium text-gray-700 text-sm">使用帮助</span>
              </div>
              <i class="bi bi-chevron-right text-gray-400 text-xs"></i>
            </button>
            
            <button class="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
              <div class="flex items-center gap-2">
                <i class="bi bi-bug text-gray-400 text-sm"></i>
                <span class="font-medium text-gray-700 text-sm">问题反馈</span>
              </div>
              <i class="bi bi-chevron-right text-gray-400 text-xs"></i>
            </button>
            
            <button class="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-2">
                <i class="bi bi-file-text text-gray-400 text-sm"></i>
                <span class="font-medium text-gray-700 text-sm">用户协议</span>
              </div>
              <i class="bi bi-chevron-right text-gray-400 text-xs"></i>
            </button>
          </div>
          
          <!-- 技术栈 -->
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 class="font-semibold text-gray-800 text-sm mb-2">技术栈</h3>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-500">前端框架</span>
                <span class="text-gray-700 font-medium">Svelte 5 + TypeScript</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">桌面框架</span>
                <span class="text-gray-700 font-medium">Tauri 2.0</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">UI 框架</span>
                <span class="text-gray-700 font-medium">TailwindCSS</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">图标库</span>
                <span class="text-gray-700 font-medium">Bootstrap Icons</span>
              </div>
            </div>
          </div>
          
          <!-- 版权说明 -->
          <div class="text-center text-xs text-gray-400">
            <p>© 2024 蝉声为歌。All rights reserved.</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
