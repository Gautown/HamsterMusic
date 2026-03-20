<script lang="ts">
  import { playerStore } from '../stores/player';
  import { sourceStore } from '../stores/music-source';
  import { searchMusic as searchFlowerMusic, getMusicUrl as getFlowerMusicUrl } from '../utils/flower-source';
  import type { MusicTrack } from '../types';
  
  let sourceState = $derived($sourceStore);
  let playlist = $derived($playerStore.playlist);
  let currentTrack = $derived($playerStore.currentTrack);
  let isPlaying = $derived($playerStore.isPlaying);
  
  // 活跃的平台标签
  let activePlatform = $state('全部');
  
  // 每个平台的音乐列表
  let platformMusic = $state<Record<string, MusicTrack[]>>({});
  let isLoading = $state<Record<string, boolean>>({});
  
  // 搜索相关
  let searchQuery = $state('');
  let isSearching = $state(false);
  let searchResults = $state<MusicTrack[]>([]);
  
  // 获取所有平台
  let platforms = $derived(() => {
    const platformSet = new Set<string>();
    sourceState.sources.forEach(source => {
      source.platforms.forEach(p => platformSet.add(p));
    });
    return Array.from(platformSet);
  });
  
  // 获取分类标签
  let categories = $derived(() => {
    return ['全部', ...platforms, '本地'];
  });
  
  // 获取当前显示的音乐列表
  let displayTracks = $derived(() => {
    let tracks: MusicTrack[] = [];
    
    if (activePlatform === '全部') {
      // 显示所有平台的音乐
      tracks = Object.values(platformMusic).flat();
    } else if (activePlatform === '本地') {
      // 显示本地音乐
      tracks = playlist.filter(t => t.is_local);
    } else {
      // 显示指定平台的音乐
      tracks = platformMusic[activePlatform] || [];
    }
    
    // 按搜索关键词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tracks = tracks.filter(
        track =>
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query) ||
          track.album?.toLowerCase().includes(query)
      );
    }
    
    return tracks;
  });
  
  // 初始化时加载各平台音乐
  $effect(() => {
    if (sourceState.sources.length > 0 && Object.keys(platformMusic).length === 0) {
      loadAllPlatformMusic();
    }
  });
  
  // 加载所有平台的音乐
  async function loadAllPlatformMusic() {
    const searchTerms = ['热门', '经典', '流行', '新歌'];
    
    for (const platform of platforms) {
      await loadPlatformMusic(platform, searchTerms[Math.floor(Math.random() * searchTerms.length)]);
    }
  }
  
  // 加载指定平台的音乐
  async function loadPlatformMusic(platform: string, searchTerm: string = '热门') {
    if (isLoading[platform]) return;
    
    isLoading = { ...isLoading, [platform]: true };
    
    try {
      const tracks = await searchFlowerMusic(platform, searchTerm, 1);
      if (tracks && tracks.length > 0) {
        platformMusic = { ...platformMusic, [platform]: tracks.slice(0, 20) };
      }
    } catch (error) {
      console.error(`加载 ${platform} 音乐失败:`, error);
    } finally {
      isLoading = { ...isLoading, [platform]: false };
    }
  }
  
  // 刷新平台音乐
  async function handleRefresh(platform: string) {
    const searchTerms = ['经典', '流行', '新歌', '热门', '精选'];
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    await loadPlatformMusic(platform, randomTerm);
  }
  
  // 播放歌曲
  function playTrack(track: MusicTrack, index: number) {
    playerStore.playTrack(track, index);
  }
  
  // 添加到播放列表
  async function handleAddToPlaylist(track: MusicTrack) {
    if (track.platform && track.songmid && !track.is_local) {
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
    } else {
      const newPlaylist = [...playlist, track];
      playerStore.setPlaylist(newPlaylist);
      window.alert('已添加到播放列表：' + track.title);
    }
  }
  
  // 在线搜索
  async function handleSearch() {
    if (!searchQuery.trim() || activePlatform === '本地') return;
    
    isSearching = true;
    try {
      const platform = activePlatform === '全部' ? sourceState.activePlatform || platforms[0] : activePlatform;
      const results = await searchFlowerMusic(platform, searchQuery, 1);
      searchResults = results || [];
    } catch (error) {
      console.error('搜索失败:', error);
      searchResults = [];
    } finally {
      isSearching = false;
    }
  }
  
  // 清除搜索
  function clearSearch() {
    searchResults = [];
    searchQuery = '';
  }
  
  // 获取平台名称
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
  
  // 格式化时长
  function formatDuration(ms: number): string {
    if (!ms) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
</script>

<div class="flex-1 flex flex-col overflow-hidden bg-gray-50">
  <!-- 顶部标题和搜索 -->
  <div class="px-6 py-4 bg-white border-b border-gray-200">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-800">音乐库</h1>
      <div class="flex items-center gap-2">
        <button
          onclick={loadAllPlatformMusic}
          class="px-3 py-1.5 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <i class="bi bi-arrow-clockwise mr-1.5"></i>
          刷新全部
        </button>
      </div>
    </div>
    
    <!-- 平台分类标签 -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2">
      {#each categories as category}
        <button
          onclick={() => activePlatform = category}
          class="px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
          class:bg-indigo-500={activePlatform === category}
          class:text-white={activePlatform === category}
          class:bg-gray-100={activePlatform !== category}
          class:text-gray-600={activePlatform !== category}
          class:hover:bg-gray-200={activePlatform !== category}
        >
          {category === '全部' ? '全部' : category === '本地' ? '本地' : getPlatformName(category)}
        </button>
      {/each}
    </div>
    
    <!-- 搜索栏 -->
    <div class="mt-4 flex items-center gap-2">
      <div class="flex-1 relative">
        <input
          type="text"
          bind:value={searchQuery}
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder={activePlatform === '本地' ? "搜索本地音乐..." : "搜索在线音乐..."}
          disabled={activePlatform === '本地'}
          class="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
        />
        <button 
          onclick={handleSearch}
          disabled={activePlatform === '本地' || !searchQuery.trim()}
          class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-indigo-500 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-label="搜索"
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
    {#if searchResults.length > 0}
      <div class="mt-4 border border-gray-200 rounded-xl bg-white max-h-96 overflow-y-auto">
        <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <span class="text-sm font-medium text-gray-700">搜索结果（{searchResults.length} 首）</span>
          <button onclick={clearSearch} class="text-sm text-gray-500 hover:text-gray-700">
            <i class="bi bi-x-circle mr-1"></i>
            关闭
          </button>
        </div>
        {#each searchResults as track}
          <div
            class="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div class="text-left flex-1">
              <p class="text-sm font-medium text-gray-700">{track.title}</p>
              <p class="text-xs text-gray-500">{track.artist} · {track.album}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded">{track.platform?.toUpperCase()}</span>
              <button 
                onclick={() => handleAddToPlaylist(track)}
                class="w-8 h-8 bg-indigo-500 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors"
                title="添加到播放列表"
              >
                <i class="bi bi-plus-lg text-white text-sm"></i>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- 音乐列表 -->
  <div class="flex-1 overflow-y-auto p-6">
    {#if displayTracks.length > 0}
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- 表头 -->
        <div class="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
          <div class="col-span-1 text-center">#</div>
          <div class="col-span-5">歌曲</div>
          <div class="col-span-4">专辑</div>
          <div class="col-span-1 text-center">平台</div>
          <div class="col-span-1 text-center">时长</div>
        </div>
        
        <!-- 音乐列表 -->
        {#each displayTracks as track, index}
          <button
            class="w-full grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 bg-transparent text-left"
            class:bg-indigo-50={currentTrack?.id === track.id}
            onclick={() => playTrack(track, index)}
          >
            <!-- 序号 -->
            <div class="col-span-1 text-center flex items-center justify-center">
              {#if currentTrack?.id === track.id && isPlaying}
                <i class="bi bi-soundwave text-indigo-500"></i>
              {:else}
                <span class="text-sm text-gray-400">{(index + 1).toString().padStart(2, '0')}</span>
              {/if}
            </div>
            
            <!-- 歌曲信息 -->
            <div class="col-span-5 flex items-center gap-3">
              <div class="min-w-0">
                <h3 class="font-medium text-gray-800 truncate">{track.title}</h3>
                <p class="text-sm text-gray-500 truncate">{track.artist}</p>
              </div>
            </div>
            
            <!-- 专辑 -->
            <div class="col-span-4 flex items-center">
              <span class="text-sm text-gray-600 truncate">{track.album || '-'}</span>
            </div>
            
            <!-- 平台 -->
            <div class="col-span-1 text-center">
              {#if track.platform && !track.is_local}
                <span class="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded">
                  {track.platform.toUpperCase()}
                </span>
              {:else}
                <span class="text-xs text-gray-400">本地</span>
              {/if}
            </div>
            
            <!-- 时长 -->
            <div class="col-span-1 text-center flex items-center justify-center">
              <span class="text-sm text-gray-400">
                {formatDuration(track.duration)}
              </span>
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <!-- 空状态 -->
      <div class="flex flex-col items-center justify-center h-full text-gray-400">
        {#if Object.keys(platformMusic).length === 0}
          <i class="bi bi-music-note text-5xl mb-4"></i>
          <p class="text-lg font-medium">暂无音乐</p>
          <p class="text-sm mt-2">正在加载各平台音乐...</p>
        {:else}
          <i class="bi bi-search text-5xl mb-4"></i>
          <p class="text-lg font-medium">没有找到音乐</p>
          <p class="text-sm mt-2">
            {#if searchQuery}
              试试其他关键词？
            {:else}
              点击"刷新全部"加载更多音乐
            {/if}
          </p>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- 底部状态栏 -->
  <div class="px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
    <div>
      {#if activePlatform === '全部'}
        共 {Object.values(platformMusic).reduce((sum, tracks) => sum + tracks.length, 0)} 首音乐
      {:else if activePlatform === '本地'}
        本地音乐 {playlist.filter(t => t.is_local).length} 首
      {:else}
        {getPlatformName(activePlatform)} {platformMusic[activePlatform]?.length || 0} 首
      {/if}
    </div>
    <div class="flex items-center gap-4">
      {#each platforms as platform}
        <div class="flex items-center gap-1.5">
          {#if isLoading[platform]}
            <i class="bi bi-hourglass-split text-indigo-500 text-xs"></i>
          {:else if platformMusic[platform]?.length > 0}
            <i class="bi bi-check-circle-fill text-green-500 text-xs"></i>
          {:else}
            <i class="bi bi-circle-fill text-gray-300 text-xs"></i>
          {/if}
          <span class="text-xs">{getPlatformName(platform)}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
