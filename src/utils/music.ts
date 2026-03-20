import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { MusicTrack } from '../types';

/**
 * 导入本地音乐文件
 */
export async function importLocalMusic(): Promise<MusicTrack[]> {
  try {
    const selected = await open({
      multiple: true,
      filters: [{
        name: 'Audio Files',
        extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'wma']
      }]
    });

    if (!selected) return [];

    const files = Array.isArray(selected) ? selected : [selected];
    const tracks: MusicTrack[] = [];

    for (const file of files) {
      try {
        const metadata = await invoke<MusicTrack>('get_music_metadata', {
          filePath: file
        });
        tracks.push(metadata);
      } catch (error) {
        console.error(`Failed to get metadata for ${file}:`, error);
      }
    }

    return tracks;
  } catch (error) {
    console.error('Failed to import local music:', error);
    return [];
  }
}

/**
 * 导入音源文件（播放列表文件）
 */
export async function importSourceFile(): Promise<MusicTrack[]> {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Source Files',
        extensions: ['json', 'm3u', 'm3u8', 'pls', 'txt']
      }]
    });

    if (!selected) return [];

    try {
      const tracks = await invoke<MusicTrack[]>('parse_source_file', {
        filePath: selected
      });
      return tracks;
    } catch (error) {
      console.error('Failed to parse source file:', error);
      return [];
    }
  } catch (error) {
    console.error('Failed to import source file:', error);
    return [];
  }
}

/**
 * 从在线音源获取曲目
 */
export async function fetchOnlineTracks(sourceUrl: string): Promise<MusicTrack[]> {
  try {
    const tracks = await invoke<MusicTrack[]>('fetch_online_tracks', {
      sourceUrl
    });
    return tracks;
  } catch (error) {
    console.error('Failed to fetch online tracks:', error);
    return [];
  }
}

/**
 * 格式化时长显示
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
