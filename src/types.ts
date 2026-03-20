export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  file_path?: string;
  url?: string;
  is_local: boolean;
  cover_art?: string;
  // 在线音乐平台相关字段
  platform?: 'kw' | 'kg' | 'tx' | 'wy' | 'mg'; // 酷我、酷狗、QQ、网易、咪咕
  songmid?: string; // 歌曲 ID（用于获取播放 URL）
  quality?: '128k' | '320k' | 'flac'; // 音质
}

export interface Playlist {
  id: string;
  name: string;
  tracks: MusicTrack[];
  created_at: Date;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  currentTrack: MusicTrack | null;
  playlist: MusicTrack[];
  currentIndex: number;
  playMode?: 'loop' | 'shuffle' | 'single';
}
