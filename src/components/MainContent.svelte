<script lang="ts">
  import { playerStore } from '../stores/player';
  import { sourceStore } from '../stores/music-source';
  import { importLocalMusic } from '../utils/music';
  import { searchMusic as searchFlowerMusic, getMusicUrl as getFlowerMusicUrl } from '../utils/flower-source';
  import type { MusicTrack } from '../types';
  
  let searchQuery = $state('');
  let activeCategory = $state('全部');
  let onlineSearchResults = $state<Array<MusicTrack>>([]);
  let isSearching = $state(false);
  
  // 从 store 获取状态
  let sourceState = $derived($sourceStore);
  let playlist = $derived($playerStore.playlist);
  let currentTrack = $derived($playerStore.currentTrack);
  let isPlaying = $derived($playerStore.isPlaying);
  
  // 动态生成平台分类
  let categories = $derived(() => {
    const platforms = sourceState.sources.flatMap(s => s.platforms);
    const uniquePlatforms = [...new Set(platforms)];
    return ['全部', ...uniquePlatforms, '本地'];
  });
  
  function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  function playTrack(track: MusicTrack, index: number) {
    playerStore.playTrack(track, index);
  }
  
  function filteredTracks(): MusicTrack[] {
    let tracks = playlist;
    
    // 按分类筛选
    if (activeCategory !== '全部') {
      tracks = tracks.filter((track: MusicTrack) => {
        if (activeCategory === '本地') {
          return track.is_local;
        } else {
          // 按平台代码筛选
          return track.platform === activeCategory;
        }
      });
    }
    
    // 按搜索关键词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tracks = tracks.filter(
        (track: MusicTrack) =>
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query) ||
          track.album?.toLowerCase().includes(query)
      );
    }
    
    return tracks;
  }
  
  async function handleImportLocal() {
    try {
      const tracks = await importLocalMusic();
      if (tracks.length > 0) {
        const newPlaylist = [...playlist, ...tracks];
        playerStore.setPlaylist(newPlaylist);
      }
    } catch (error) {
      console.error('导入本地音乐失败:', error);
    }
  }
  
  async function handleLoadLyrics() {
    console.log('加载歌词');
  }
  
  async function handleOnlineSearch() {
    if (!searchQuery.trim()) {
      return;
    }
    
    // 获取当前活跃平台
    const platform = sourceState.activePlatform;
    if (!platform) {
      window.alert('请先在设置中导入音源文件');
      return;
    }
    
    isSearching = true;
    try {
      const results = await searchFlowerMusic(platform, searchQuery);
      onlineSearchResults = results;
    } catch (error) {
      console.error('在线搜索失败:', error);
      onlineSearchResults = [];
    } finally {
      isSearching = false;
    }
  }
  
  async function handleAddToPlaylist(track: MusicTrack) {
    // 获取播放 URL
    if (track.platform && track.songmid) {
      try {
        const url = await getFlowerMusicUrl(track.platform, track.songmid, track.quality || '128k');
        if (url) {
          track.url = url;
          const newPlaylist = [...playlist, track];
          playerStore.setPlaylist(newPlaylist);
          window.alert('已添加到播放列表：' + track.title);
        }
      } catch (error) {
        console.error('获取播放 URL 失败:', error);
      }
    }
  }
  
  function clearOnlineSearch() {
    onlineSearchResults = [];
    searchQuery = '';
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
</script>

<div class="flex-1 flex flex-col overflow-hidden bg-white">
  <!-- 标题和搜索区域 -->
  <div class="px-4 py-3 border-b border-gray-100">
    <h2 class="text-xl font-bold text-gray-800 mb-3">播放列表</h2>
    
    <!-- 平台分类标签 -->
    {#if sourceState.sources.length > 0}
      <div class="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {#each categories as category}
          <button
            onclick={() => activeCategory = category}
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
            class:bg-indigo-500={activeCategory === category}
            class:text-white={activeCategory === category}
            class:bg-gray-100={activeCategory !== category}
            class:text-gray-600={activeCategory !== category}
            class:hover:bg-gray-200={activeCategory !== category}
          >
            {category === '全部' ? '全部' : category === '本地' ? '本地' : getPlatformName(category)}
          </button>
        {/each}
      </div>
    {/if}
    
    <!-- 在线搜索 -->
    <div class="mb-4 p-4 bg-gray-50 rounded-xl">
      <div class="flex items-center gap-2 mb-3">
        <!-- 平台选择器 -->
        <select
          onchange={(e) => {
            const target = e.target as HTMLSelectElement;
            sourceStore.setActivePlatform(target.value);
          }}
          value={sourceState.activePlatform || ''}
          disabled={sourceState.sources.length === 0}
          class="px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 text-sm disabled:bg-gray-100 disabled:text-gray-400"
        >
          {#if sourceState.sources.length === 0}
            <option value="">请先导入音源</option>
          {:else}
            {#each sourceStore.getAllPlatforms() as platform}
              <option value={platform}>{getPlatformName(platform)}</option>
            {/each}
          {/if}
        </select>
        <div class="flex-1 relative">
          <input
            type="text"
            bind:value={searchQuery}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                handleOnlineSearch();
              }
            }}
            placeholder={sourceState.sources.length > 0 ? "搜索在线音乐..." : "请先导入音源文件"}
            disabled={sourceState.sources.length === 0}
            class="w-full px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button 
            onclick={handleOnlineSearch}
            disabled={sourceState.sources.length === 0}
            class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-indigo-500 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            aria-label="搜索"
            title="搜索"
          >
            {#if isSearching}
              <i class="bi bi-hourglass-split text-white text-sm"></i>
            {:else}
              <i class="bi bi-search text-white text-sm"></i>
            {/if}
          </button>
        </div>
      </div>
      
      <!-- 搜索结果显示 -->
      {#if onlineSearchResults.length > 0}
        <div class="border border-gray-200 rounded-xl bg-white max-h-60 overflow-y-auto">
          {#each onlineSearchResults as track}
            <button
              class="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              onclick={() => handleAddToPlaylist(track)}
            >
              <div class="text-left">
                <p class="text-sm font-medium text-gray-700">{track.title}</p>
                <p class="text-xs text-gray-500">{track.artist}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded">{track.platform?.toUpperCase()}</span>
                <i class="bi bi-plus-circle text-indigo-500"></i>
              </div>
            </button>
          {/each}
        </div>
        <div class="mt-2 text-right">
          <button
            onclick={clearOnlineSearch}
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            关闭搜索结果
          </button>
        </div>
      {/if}
    </div>
    
    <!-- 功能按钮 -->
    <div class="flex items-center gap-2">
      <button
        onclick={handleLoadLyrics}
        class="px-4 py-2 text-sm bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors text-gray-700"
      >
        加载歌词
      </button>
    </div>
  </div>
  
  <!-- 音乐列表 -->
  <div class="flex-1 overflow-y-auto">
    {#each filteredTracks() as track, index}
      <button
        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 bg-transparent text-left"
        class:bg-indigo-50={currentTrack?.id === track.id}
        onclick={() => playTrack(track, index)}
      >
        <!-- 序号 -->
        <div class="w-6 text-sm text-gray-400 flex-shrink-0">
          {#if currentTrack?.id === track.id && isPlaying}
            <i class="bi bi-soundwave text-indigo-500"></i>
          {:else}
            {(index + 1).toString().padStart(2, '0')}
          {/if}
        </div>
        
        <!-- 信息 -->
        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-gray-800 truncate">{track.title}</h3>
          <p class="text-sm text-gray-500 truncate">{track.artist}</p>
        </div>
        
        <!-- 时长 -->
        <div class="text-sm text-gray-400 flex-shrink-0">
          {#if track.duration}
            {formatDuration(track.duration)}
          {:else}
            --:--
          {/if}
        </div>
      </button>
    {:else}
      <div class="flex flex-col items-center justify-center h-full text-gray-400">
        <i class="bi bi-music-note text-4xl mb-4"></i>
        <p class="text-lg">暂无音乐</p>
        <p class="text-sm mt-2">导入本地音乐或音源文件开始播放</p>
      </div>
    {/each}
  </div>
</div>
