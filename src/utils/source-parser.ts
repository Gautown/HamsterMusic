import type { MusicTrack } from '../types';

/**
 * 音源接口定义
 */
interface MusicSource {
  name: string;
  version: string;
  search?: (query: string, page?: number) => Promise<MusicTrack[]>;
  getMusicUrl?: (songId: string, quality?: string) => Promise<string>;
}

/**
 * 解析并执行 JS 音源文件
 * 注意：混淆的 JS 音源文件需要完整的洛雪音乐环境
 */
export async function parseSourceJS(jsContent: string): Promise<MusicSource | null> {
  try {
    // 检查是否是混淆的 JS 文件
    if (jsContent.includes('\\x') || jsContent.includes('function Z(p,O)')) {
      console.warn('检测到混淆的 JS 音源文件，需要完整的洛雪音乐环境');
      // 对于混淆的 JS，返回一个特殊标记
      return {
        name: '野花🌷 (混淆音源)',
        version: '需要洛雪环境',
        search: undefined,
        getMusicUrl: undefined
      };
    }
    
    // 尝试直接执行未混淆的 JS
    let source: any = null;
    
    try {
      const executeJS = new Function('return ' + jsContent);
      const result = executeJS();
      
      if (result && typeof result === 'object') {
        source = result;
      }
    } catch (execError) {
      console.warn('直接执行 JS 失败:', execError);
    }
    
    // 尝试从全局作用域获取音源对象
    if (!source && typeof window !== 'undefined') {
      const possibleNames = ['source', 'musicSource', 'lxSource', 'exports', 'module', 'default'];
      for (const name of possibleNames) {
        if ((window as any)[name]) {
          source = (window as any)[name];
          break;
        }
      }
    }
    
    return source;
  } catch (error) {
    console.error('解析 JS 音源失败:', error);
    return null;
  }
}

/**
 * 从 JS 音源搜索音乐
 */
export async function searchFromSource(source: MusicSource, query: string, page: number = 1): Promise<MusicTrack[]> {
  if (!source.search) {
    throw new Error('音源不支持搜索功能');
  }
  
  try {
    const results = await source.search(query, page);
    return results || [];
  } catch (error) {
    console.error('搜索失败:', error);
    return [];
  }
}

/**
 * 获取歌曲播放 URL
 */
export async function getMusicUrlFromSource(
  source: MusicSource, 
  songId: string, 
  quality: string = 'standard'
): Promise<string> {
  if (!source.getMusicUrl) {
    throw new Error('音源不支持获取播放 URL');
  }
  
  try {
    const url = await source.getMusicUrl(songId, quality);
    return url || '';
  } catch (error) {
    console.error('获取播放 URL 失败:', error);
    return '';
  }
}

/**
 * 测试音源是否有效
 */
export function testSource(source: MusicSource): boolean {
  return !!(source.name && source.version);
}
