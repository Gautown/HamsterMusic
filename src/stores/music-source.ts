import { writable } from 'svelte/store';

export interface MusicSourceInfo {
  name: string;
  version: string;
  platforms: string[];
  isActive: boolean;
}

export interface SourceState {
  sources: MusicSourceInfo[];
  activePlatform: string | null;
}

function createSourceStore() {
  const initialState: SourceState = {
    sources: [],
    activePlatform: null,
  };

  const { subscribe, update, set } = writable<SourceState>(initialState);

  return {
    subscribe,
    
    // 添加音源
    addSource: (source: MusicSourceInfo) => {
      update(state => ({
        ...state,
        sources: [...state.sources, source],
        activePlatform: source.platforms[0] || state.activePlatform,
      }));
    },
    
    // 移除音源
    removeSource: (sourceName: string) => {
      update(state => {
        const newSources = state.sources.filter(s => s.name !== sourceName);
        return {
          ...state,
          sources: newSources,
          activePlatform: newSources.length > 0 
            ? newSources[0].platforms[0] 
            : null,
        };
      });
    },
    
    // 设置活跃平台
    setActivePlatform: (platform: string) => {
      update(state => ({
        ...state,
        activePlatform: platform,
      }));
    },
    
    // 获取所有平台
    getAllPlatforms: () => {
      let platforms: string[] = [];
      update(state => {
        state.sources.forEach(source => {
          platforms = [...platforms, ...source.platforms];
        });
        return state;
      });
      return [...new Set(platforms)];
    },
  };
}

export const sourceStore = createSourceStore();
