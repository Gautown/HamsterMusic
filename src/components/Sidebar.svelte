<script lang="ts">
  let { open = $bindable(true), activeTab = $bindable('music') } = $props();
</script>

<div 
  class="bg-white border-r border-gray-200 flex flex-col items-center py-6 h-full"
  class:w-20={open}
  class:w-0={!open}
>
  <!-- 顶部 Logo 和标题 -->
  <div class="flex flex-col items-center mb-8 flex-shrink-0">
    <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
      <i class="bi bi-music-note-beamed text-white text-lg"></i>
    </div>
    <span class="text-xs text-gray-600 mt-2 font-medium">蝉声音乐</span>
  </div>
  
  <!-- 导航图标 -->
  <nav class="flex-1 flex flex-col gap-3 overflow-y-auto">
    <button
      onclick={() => activeTab = 'music'}
      class="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
      class:bg-indigo-500={activeTab === 'music'}
      class:text-white={activeTab === 'music'}
      class:hover:bg-indigo-100={activeTab !== 'music'}
      class:text-gray-600={activeTab !== 'music'}
      title="播放列表"
    >
      <i class="bi bi-music-note-list text-xl"></i>
    </button>
    
    <button
      onclick={() => activeTab = 'library'}
      class="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
      class:bg-indigo-500={activeTab === 'library'}
      class:text-white={activeTab === 'library'}
      class:hover:bg-indigo-100={activeTab !== 'library'}
      class:text-gray-600={activeTab !== 'library'}
      title="音乐库"
    >
      <i class="bi bi-collection-play text-xl"></i>
    </button>
    
    <button
      onclick={() => activeTab = 'eye'}
      class="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-gray-600 hover:bg-gray-100"
      title="发现"
    >
      <i class="bi bi-eye text-xl"></i>
    </button>
  </nav>
  
  <!-- 底部功能图标 -->
  <div class="flex flex-col gap-3 mt-auto mb-4 flex-shrink-0">
    <button
      onclick={() => activeTab = 'theme'}
      class="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-gray-600 hover:bg-gray-100"
      title="主题"
    >
      <i class="bi bi-palette text-xl"></i>
    </button>
    
    <button
      onclick={() => activeTab = 'settings'}
      class="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-gray-600 hover:bg-gray-100"
      title="设置"
    >
      <i class="bi bi-gear text-xl"></i>
    </button>
  </div>
</div>
