import { writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

export interface AppSettings {
  // 常规设置
  launchAtStartup: boolean;
  showNotification: boolean;
  exitOnClose: boolean;
  language: string;
  
  // 播放设置
  defaultVolume: number;
  enableGapless: boolean;
  autoPlay: boolean;
  playOnHeadset: boolean;
  quality: string;
  playMode: 'loop' | 'shuffle' | 'single';
  
  // 下载设置
  downloadPath: string;
  downloadQuality: string;
  autoDownload: boolean;
  
  // 快捷键
  shortcuts: {
    playPause: string;
    next: string;
    previous: string;
    volumeUp: string;
    volumeDown: string;
  };
  
  // 音源管理
  importedSources: string[];
}

const defaultSettings: AppSettings = {
  launchAtStartup: false,
  showNotification: true,
  exitOnClose: false,
  language: 'zh-CN',
  
  defaultVolume: 80,
  enableGapless: true,
  autoPlay: false,
  playOnHeadset: true,
  quality: 'high',
  playMode: 'loop',
  
  downloadPath: '',
  downloadQuality: 'high',
  autoDownload: false,
  
  shortcuts: {
    playPause: 'Ctrl + Space',
    next: 'Ctrl + Right',
    previous: 'Ctrl + Left',
    volumeUp: 'Ctrl + Up',
    volumeDown: 'Ctrl + Down',
  },
  
  importedSources: [],
};

const STORAGE_KEY = 'zensound_settings';

function createSettingsStore() {
  const { subscribe, set, update } = writable<AppSettings>(defaultSettings);

  return {
    subscribe,
    
    // 加载设置
    load: async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<AppSettings>;
          const merged = { ...defaultSettings, ...parsed };
          set(merged);
          
          // 同步到后端
          await invoke('set_close_to_tray', { value: !merged.exitOnClose });
        }
      } catch (error) {
        console.error('加载设置失败:', error);
        set(defaultSettings);
      }
    },
    
    // 保存设置
    save: async () => {
      try {
        update(state => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          return state;
        });
      } catch (error) {
        console.error('保存设置失败:', error);
      }
    },
    
    // 更新设置
    updateSetting: async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      update(state => {
        const newState = { ...state, [key]: value };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
      
      // 特殊处理：同步到后端
      if (key === 'exitOnClose') {
        await invoke('set_close_to_tray', { value: !(value as boolean) });
      }
    },
    
    // 重置设置
    reset: async () => {
      set(defaultSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      await invoke('set_close_to_tray', { value: true });
    },
    
    // 添加已导入的音源
    addSource: async (sourceName: string) => {
      update(state => {
        const newState = {
          ...state,
          importedSources: [...state.importedSources, sourceName],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },
    
    // 移除已导入的音源
    removeSource: async (sourceName: string) => {
      update(state => {
        const newState = {
          ...state,
          importedSources: state.importedSources.filter(s => s !== sourceName),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },
  };
}

export const settingsStore = createSettingsStore();
