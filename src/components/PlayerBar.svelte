<script lang="ts">
  import { playerStore } from '../stores/player';
  import { settingsStore } from '../stores/settings';
  
  let audio: HTMLAudioElement;
  let progressValue = $state(0);
  let isDragging = $state(false);
  
  // 订阅播放器状态
  let isPlaying = $derived($playerStore.isPlaying);
  let currentTrack = $derived($playerStore.currentTrack);
  let volume = $derived($playerStore.volume);
  let isMuted = $derived($playerStore.isMuted);
  let duration = $derived($playerStore.duration);
  let currentTime = $derived($playerStore.currentTime);
  let playMode = $derived($playerStore.playMode || 'loop');
  let settings = $derived($settingsStore);
  
  // 当当前曲目变化时，更新音频源
  $effect(() => {
    if (currentTrack && audio) {
      // 优先使用 url（在线音乐），其次使用 file_path（本地音乐）
      if (currentTrack.url) {
        // 在线音乐
        audio.src = currentTrack.url;
      } else if (currentTrack.is_local && currentTrack.file_path) {
        // 本地音乐
        audio.src = `data:audio/mp3;base64,${currentTrack.file_path}`;
      }
      
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  });
  
  // 播放状态变化
  $effect(() => {
    if (audio) {
      if (isPlaying) {
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
    }
  });
  
  // 音量变化
  $effect(() => {
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  });
  
  function handleTimeUpdate() {
    if (!isDragging && audio) {
      playerStore.setCurrentTime(audio.currentTime * 1000);
    }
  }
  
  function handleLoadedMetadata() {
    if (audio) {
      playerStore.setDuration(audio.duration * 1000);
    }
  }
  
  function handleEnded() {
    playerStore.next();
  }
  
  function togglePlay() {
    playerStore.togglePlay();
  }
  
  function playNext() {
    playerStore.next();
  }
  
  function playPrevious() {
    playerStore.previous();
  }
  
  function handleVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    playerStore.setVolume(parseFloat(target.value));
    // 同步到设置
    settingsStore.updateSetting('defaultVolume', Math.round(parseFloat(target.value) * 100));
  }
  
  function handleProgressMouseDown() {
    isDragging = true;
  }
  
  function handleProgressMouseUp() {
    isDragging = false;
    if (audio) {
      audio.currentTime = progressValue / 100;
      playerStore.setCurrentTime((progressValue / 100) * audio.duration * 1000);
    }
  }
  
  function handleProgressInput(event: Event) {
    const target = event.target as HTMLInputElement;
    progressValue = parseFloat(target.value);
  }
  
  // 更新进度条
  $effect(() => {
    if (duration > 0 && !isDragging) {
      progressValue = (currentTime / duration) * 100;
    }
  });
  
  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  function togglePlayMode() {
    const modes: Array<'loop' | 'shuffle' | 'single'> = ['loop', 'shuffle', 'single'];
    const currentIndex = modes.indexOf(playMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    playerStore.setPlayMode(nextMode);
    // 同步到设置
    settingsStore.updateSetting('playMode', nextMode);
  }
  
  function getPlayModeIcon(): string {
    switch (playMode) {
      case 'loop':
        return 'bi-repeat';
      case 'shuffle':
        return 'bi-shuffle';
      case 'single':
        return 'bi-repeat-1';
      default:
        return 'bi-repeat';
    }
  }
  
  function getPlayModeTitle(): string {
    switch (playMode) {
      case 'loop':
        return '循环播放';
      case 'shuffle':
        return '随机播放';
      case 'single':
        return '单曲循环';
      default:
        return '播放模式';
    }
  }
</script>

<div class="flex-1 flex flex-col items-center justify-center p-8 bg-white">
  <div class="w-full max-w-md flex flex-col items-center">
    <!-- 专辑封面 -->
    <div class="w-64 h-64 mb-6 rounded-2xl overflow-hidden shadow-xl">
      {#if currentTrack?.cover_art}
        <img src={currentTrack.cover_art} alt={currentTrack.title} class="w-full h-full object-cover" />
      {:else}
        <div class="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
          <i class="bi bi-music-note text-6xl text-indigo-400"></i>
        </div>
      {/if}
    </div>
    
    <!-- 歌曲信息 -->
    <div class="text-center mb-2">
      {#if currentTrack}
        <h2 class="text-2xl font-bold text-gray-800 mb-1">{currentTrack.title}</h2>
        <p class="text-gray-500">{currentTrack.artist}</p>
      {:else}
        <h2 class="text-2xl font-bold text-gray-400">未播放</h2>
      {/if}
    </div>
    
    <!-- 歌词显示区域 -->
    <div class="w-full h-20 flex items-center justify-center mb-6">
      {#if currentTrack}
        <p class="text-indigo-500 text-sm">——— 暂无歌词 ———</p>
      {:else}
        <p class="text-gray-400 text-sm">暂无歌词</p>
      {/if}
    </div>
    
    <!-- 进度条 -->
    <div class="w-full mb-6">
      <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={progressValue}
        oninput={handleProgressInput}
        onmousedown={handleProgressMouseDown}
        onmouseup={handleProgressMouseUp}
        class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
    
    <!-- 播放控制按钮 -->
    <div class="flex items-center gap-3 mb-4">
      <button
        onclick={playPrevious}
        class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
        title="上一曲"
      >
        <i class="bi bi-skip-start-fill text-lg text-gray-600"></i>
      </button>
      
      <button
        onclick={togglePlay}
        class="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-lg"
        title={isPlaying ? '暂停' : '播放'}
      >
        {#if isPlaying}
          <i class="bi bi-pause-fill text-2xl text-white"></i>
        {:else}
          <i class="bi bi-play-fill text-2xl text-white"></i>
        {/if}
      </button>
      
      <button
        onclick={playNext}
        class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
        title="下一曲"
      >
        <i class="bi bi-skip-end-fill text-lg text-gray-600"></i>
      </button>
      
      <button
        onclick={togglePlayMode}
        class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
        title={getPlayModeTitle()}
      >
        <i class="bi {getPlayModeIcon()} text-lg text-indigo-600"></i>
      </button>
      
      <!-- 音量控制 -->
      <div class="flex items-center gap-2 ml-4">
        <button
          onclick={() => playerStore.toggleMute()}
          class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          title={isMuted || volume === 0 ? '取消静音' : '静音'}
        >
          {#if isMuted || volume === 0}
            <i class="bi bi-volume-mute text-base text-gray-600"></i>
          {:else if volume < 0.5}
            <i class="bi bi-volume-down text-base text-gray-600"></i>
          {:else}
            <i class="bi bi-volume-up text-base text-gray-600"></i>
          {/if}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          oninput={handleVolumeChange}
          class="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>
    </div>
  </div>
  
  <!-- 隐藏的音频元素 -->
  <audio
    bind:this={audio}
    ontimeupdate={handleTimeUpdate}
    onloadedmetadata={handleLoadedMetadata}
    onended={handleEnded}
  ></audio>
</div>
