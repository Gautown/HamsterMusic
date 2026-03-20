import type { MusicTrack } from '../types';

/**
 * 野花音源 API 配置
 * 基于对 flower/latest.js 的分析
 */
const FLOWER_API_BASE = 'https://api.lx-music.woog.rest';

/**
 * 支持的音乐平台
 */
export const MUSIC_PLATFORMS = {
  kw: { name: '酷我音乐', id: 'kw' },
  kg: { name: '酷狗音乐', id: 'kg' },
  tx: { name: 'QQ 音乐', id: 'tx' },
  wy: { name: '网易云音乐', id: 'wy' },
  mg: { name: '咪咕音乐', id: 'mg' },
};

/**
 * 音质等级
 */
export const QUALITY_LEVELS = {
  '128k': '标准音质',
  '320k': '高品质',
  flac: '无损音质',
};

/**
 * 搜索音乐
 */
export async function searchMusic(
  platform: string,
  query: string,
  page: number = 1
): Promise<MusicTrack[]> {
  try {
    const url = `${FLOWER_API_BASE}/search?platform=${platform}&query=${encodeURIComponent(query)}&page=${page}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      return data.data.map((item: any) => ({
        id: item.id || item.songmid,
        title: item.name || item.title,
        artist: item.artist || '',
        album: item.album || '',
        platform: platform as 'kw' | 'kg' | 'tx' | 'wy' | 'mg',
        songmid: item.songmid || item.id,
        duration: item.interval || item.duration || 0,
        is_local: false,
        quality: '128k',
      }));
    }
    
    return [];
  } catch (error) {
    console.error('搜索音乐失败:', error);
    return [];
  }
}

/**
 * 获取歌曲播放 URL
 */
export async function getMusicUrl(
  platform: string,
  songmid: string,
  quality: string = '128k'
): Promise<string> {
  try {
    const url = `${FLOWER_API_BASE}/url?platform=${platform}&songmid=${songmid}&quality=${quality}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 200 && data.data) {
      return data.data.url || '';
    }
    
    return '';
  } catch (error) {
    console.error('获取播放 URL 失败:', error);
    return '';
  }
}

/**
 * 测试 API 是否可用
 */
export async function testAPI(): Promise<boolean> {
  try {
    const url = `${FLOWER_API_BASE}/test`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 从在线 URL 获取音源文件
 */
export async function fetchOnlineSource(sourceUrl: string): Promise<MusicTrack[]> {
  try {
    console.log('开始获取在线音源:', sourceUrl);
    const response = await fetch(sourceUrl);
    console.log('响应状态:', response.status);
    
    const sourceCode = await response.text();
    console.log('获取到的音源文件长度:', sourceCode.length);
    console.log('音源文件前 200 字符:', sourceCode.substring(0, 200));
    
    // 解析音源文件，提取平台信息
    const platforms = parseSourcePlatforms(sourceCode);
    
    if (platforms.length === 0) {
      console.warn('未识别到平台，返回空数组');
      return [];
    }
    
    console.log('识别到平台:', platforms);
    
    // 为每个平台获取音乐列表
    const allTracks: MusicTrack[] = [];
    const searchQueries = ['热门', '经典', '流行'];
    
    for (const platform of platforms) {
      try {
        // 使用热门口令搜索该平台的音乐
        const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
        const tracks = await searchMusic(platform, query, 1);
        
        if (tracks && tracks.length > 0) {
          // 取前几首歌曲
          const topTracks = tracks.slice(0, 10);
          allTracks.push(...topTracks);
          console.log(`平台 ${platform} 获取到 ${topTracks.length} 首歌曲`);
        }
      } catch (e) {
        console.error(`获取平台 ${platform} 音乐列表失败:`, e);
      }
    }
    
    // 如果成功获取到音乐，返回实际音乐列表
    if (allTracks.length > 0) {
      console.log('共获取到音乐:', allTracks.length, '首');
      return allTracks;
    }
    
    // 如果 API 获取失败，返回平台占位符
    console.log('API 获取失败，返回平台占位符');
    return platforms.map(platform => ({
      id: `source-${platform}`,
      title: `${getPlatformName(platform)} 音源`,
      artist: '野花音源',
      album: '在线音源',
      platform: platform as 'kw' | 'kg' | 'tx' | 'wy' | 'mg',
      songmid: `source-${platform}`,
      duration: 0,
      is_local: false,
      quality: '128k',
    }));
  } catch (error) {
    console.error('获取在线音源失败:', error);
    return [];
  }
}

/**
 * 解析音源文件中的平台信息
 */
function parseSourcePlatforms(sourceCode: string): string[] {
  const platforms: string[] = [];
  
  console.log('开始解析音源文件，长度:', sourceCode.length);
  
  // 尝试 1: 查找显式的 platforms 定义
  const platformMatches = sourceCode.match(/platforms?\s*[:=]\s*\[([^\]]+)\]/gi);
  if (platformMatches) {
    console.log('找到 platforms 定义:', platformMatches.length);
    for (const match of platformMatches) {
      const platformCodes = match.match(/['"](\w+)['"]/g);
      if (platformCodes) {
        platformCodes.forEach(code => {
          const cleanCode = code.replace(/['"]/g, '');
          if (['kw', 'kg', 'tx', 'wy', 'mg'].includes(cleanCode) && !platforms.includes(cleanCode)) {
            platforms.push(cleanCode);
          }
        });
      }
    }
  }
  
  // 尝试 2: 查找支持的平台列表
  if (platforms.length === 0) {
    const supportedPlatforms = sourceCode.match(/supportedPlatforms\s*[:=]\s*\[([^\]]+)\]/i);
    if (supportedPlatforms) {
      console.log('找到 supportedPlatforms:', supportedPlatforms[0]);
      const codes = supportedPlatforms[0].match(/['"](\w+)['"]/g);
      if (codes) {
        codes.forEach(code => {
          const cleanCode = code.replace(/['"]/g, '');
          if (['kw', 'kg', 'tx', 'wy', 'mg'].includes(cleanCode) && !platforms.includes(cleanCode)) {
            platforms.push(cleanCode);
          }
        });
      }
    }
  }
  
  // 尝试 3: 查找类似 'kw': { ... } 的定义
  if (platforms.length === 0) {
    const platformPattern = /['"]?(kw|kg|tx|wy|mg)['"]?\s*[:=]\s*\{/g;
    let match;
    while ((match = platformPattern.exec(sourceCode)) !== null) {
      const platform = match[1];
      if (!platforms.includes(platform)) {
        platforms.push(platform);
        console.log('找到平台定义:', platform);
      }
    }
  }
  
  // 尝试 4: 解码十六进制编码的字符串并查找平台
  if (platforms.length === 0) {
    console.log('使用十六进制解码方法查找平台');
    // 查找类似 '\x6b\x77\x7c...' 的十六进制编码字符串
    const hexStringPattern = /'((\\x[0-9a-fA-F]{2})+)'/g;
    let hexMatch;
    
    while ((hexMatch = hexStringPattern.exec(sourceCode)) !== null) {
      const hexString = hexMatch[1];
      try {
        // 解码十六进制字符串
        const decoded = hexString.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        });
        
        console.log('解码十六进制字符串:', decoded.substring(0, 50));
        
        // 检查解码后的字符串是否包含平台标识
        ['kw', 'kg', 'tx', 'wy', 'mg'].forEach(platform => {
          if (decoded.includes(platform) && !platforms.includes(platform)) {
            platforms.push(platform);
            console.log('从十六进制解码找到平台:', platform, '内容:', decoded);
          }
        });
      } catch (e) {
        // 忽略解码错误
      }
    }
  }
  
  // 尝试 5: 简单的文本包含检查（最后的手段）
  if (platforms.length === 0) {
    console.log('使用前 4 种方法未找到平台，使用简单文本匹配');
    ['kw', 'kg', 'tx', 'wy', 'mg'].forEach(platform => {
      const platformRegex = new RegExp(`['"]?${platform}['"]?\\s*[:=]`, 'i');
      if (platformRegex.test(sourceCode)) {
        platforms.push(platform);
        console.log('简单匹配找到平台:', platform);
      }
    });
  }
  
  console.log('最终识别到的平台:', platforms);
  return platforms;
}

/**
 * 获取平台名称
 */
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
