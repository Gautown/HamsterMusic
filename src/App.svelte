<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './components/Sidebar.svelte';
  import MainContent from './components/MainContent.svelte';
  import MusicLibrary from './components/MusicLibrary.svelte';
  import PlayerBar from './components/PlayerBar.svelte';
  import Settings from './components/Settings.svelte';
  import { playerStore } from './stores/player';
  import { settingsStore } from './stores/settings';
  import type { MusicTrack } from './types';

  let sidebarOpen = $state(true);
  let activeTab = $state('music');
  let settings = $state($settingsStore);

  // 示例播放列表
  const demoTracks: MusicTrack[] = [
    {
      id: '1',
      title: '示例音乐 1',
      artist: '艺术家 A',
      album: '专辑 X',
      is_local: true,
      duration: 240000,
    },
    {
      id: '2',
      title: '示例音乐 2',
      artist: '艺术家 B',
      album: '专辑 Y',
      is_local: false,
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: 372000,
    },
  ];

  onMount(async () => {
    // 加载设置
    await settingsStore.load();
    
    // 初始化播放列表
    playerStore.setPlaylist(demoTracks);
    
    // 设置默认音量
    playerStore.setVolume(settings.defaultVolume / 100);
  });
</script>

<div class="flex flex-col h-screen bg-white text-gray-800">
  <div class="flex flex-1 overflow-hidden">
    <!-- 左侧窄边栏 -->
    <Sidebar bind:open={sidebarOpen} bind:activeTab />
    
    {#if activeTab === 'settings' || activeTab === 'theme'}
      <!-- 设置页面占据中间和右侧区域 -->
      <div class="flex-1 flex">
        <Settings />
      </div>
    {:else if activeTab === 'library'}
      <!-- 音乐库页面 -->
      <div class="flex-1 flex">
        <MusicLibrary />
      </div>
    {:else}
      <!-- 正常布局：中间播放列表 + 右侧播放器 -->
      <div class="w-90 border-r border-gray-200 flex flex-col">
        <MainContent />
      </div>
      
      <div class="flex-1 flex flex-col">
        <PlayerBar />
      </div>
    {/if}
  </div>
</div>
