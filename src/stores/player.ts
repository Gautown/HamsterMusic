import { writable } from 'svelte/store';
import type { MusicTrack, PlayerState } from '../types';

function createPlayerStore() {
  const { subscribe, set, update } = writable<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    currentTrack: null,
    playlist: [],
    currentIndex: -1,
    playMode: 'loop', // 'loop' | 'shuffle' | 'single'
  });

  // 生成随机播放索引
  function shuffleIndex(currentIndex: number, length: number): number {
    if (length <= 1) return currentIndex;
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * length);
    } while (newIndex === currentIndex && length > 1);
    return newIndex;
  }

  return {
    subscribe,

    // 设置播放模式
    setPlayMode: (mode: 'loop' | 'shuffle' | 'single') => {
      update(state => ({
        ...state,
        playMode: mode,
      }));
    },

    // 设置播放列表
    setPlaylist: (tracks: MusicTrack[]) => {
      update(state => ({
        ...state,
        playlist: tracks,
        currentIndex: tracks.length > 0 ? 0 : -1,
        currentTrack: tracks.length > 0 ? tracks[0] : null,
      }));
    },

    // 添加到播放列表
    addToPlaylist: (track: MusicTrack) => {
      update(state => ({
        ...state,
        playlist: [...state.playlist, track],
      }));
    },

    // 播放指定曲目
    playTrack: (track: MusicTrack, index?: number) => {
      update(state => ({
        ...state,
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        currentIndex: index !== undefined ? index : state.currentIndex,
      }));
    },

    // 播放/暂停
    togglePlay: () => {
      update(state => ({
        ...state,
        isPlaying: !state.isPlaying,
      }));
    },

    // 播放
    play: () => {
      update(state => ({
        ...state,
        isPlaying: true,
      }));
    },

    // 暂停
    pause: () => {
      update(state => ({
        ...state,
        isPlaying: false,
      }));
    },

    // 设置时间
    setCurrentTime: (time: number) => {
      update(state => ({
        ...state,
        currentTime: time,
      }));
    },

    // 设置时长
    setDuration: (duration: number) => {
      update(state => ({
        ...state,
        duration,
      }));
    },

    // 设置音量
    setVolume: (volume: number) => {
      update(state => ({
        ...state,
        volume,
        isMuted: volume === 0,
      }));
    },

    // 静音切换
    toggleMute: () => {
      update(state => ({
        ...state,
        isMuted: !state.isMuted,
      }));
    },

    // 下一曲（支持播放模式）
    next: () => {
      update(state => {
        const { playMode, currentIndex, playlist } = state;
        
        if (playlist.length === 0) return state;
        
        let nextIndex = currentIndex;
        
        if (playMode === 'shuffle') {
          // 随机播放
          nextIndex = shuffleIndex(currentIndex, playlist.length);
        } else if (playMode === 'single') {
          // 单曲循环，不切换
          return {
            ...state,
            isPlaying: true,
            currentTime: 0,
          };
        } else {
          // 列表循环
          nextIndex = currentIndex + 1;
          if (nextIndex >= playlist.length) {
            nextIndex = 0; // 循环到第一首
          }
        }
        
        return {
          ...state,
          currentIndex: nextIndex,
          currentTrack: playlist[nextIndex],
          isPlaying: true,
          currentTime: 0,
        };
      });
    },

    // 上一曲（支持播放模式）
    previous: () => {
      update(state => {
        const { playMode, currentIndex, playlist } = state;
        
        if (playlist.length === 0) return state;
        
        let prevIndex = currentIndex;
        
        if (playMode === 'shuffle') {
          // 随机播放
          prevIndex = shuffleIndex(currentIndex, playlist.length);
        } else if (playMode === 'single') {
          // 单曲循环，不切换
          return {
            ...state,
            isPlaying: true,
            currentTime: 0,
          };
        } else {
          // 列表循环
          prevIndex = currentIndex - 1;
          if (prevIndex < 0) {
            prevIndex = playlist.length - 1; // 循环到最后一首
          }
        }
        
        return {
          ...state,
          currentIndex: prevIndex,
          currentTrack: playlist[prevIndex],
          isPlaying: true,
          currentTime: 0,
        };
      });
    },

    // 从播放列表移除
    removeFromPlaylist: (trackId: string) => {
      update(state => {
        const newIndex = state.playlist.findIndex((t: MusicTrack) => t.id === trackId);
        const newPlaylist = state.playlist.filter((t: MusicTrack) => t.id !== trackId);

        let newCurrentIndex = state.currentIndex;
        if (newIndex < state.currentIndex) {
          newCurrentIndex = state.currentIndex - 1;
        } else if (newIndex === state.currentIndex) {
          newCurrentIndex = Math.min(newCurrentIndex, newPlaylist.length - 1);
        }

        return {
          ...state,
          playlist: newPlaylist,
          currentIndex: newCurrentIndex,
          currentTrack: newPlaylist[newCurrentIndex] || null,
        };
      });
    },

    // 清空播放列表
    clearPlaylist: () => {
      set({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 0.7,
        isMuted: false,
        currentTrack: null,
        playlist: [],
        currentIndex: -1,
        playMode: 'loop',
      });
    },
  };
}

export const playerStore = createPlayerStore();
