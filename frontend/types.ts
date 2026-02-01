export interface ShortMetadata {
  estimated_duration_seconds: number;
  category: string;
  posting_time_suggestion: string;
}

export interface ShortPackage {
  idea: string;
  script: string;
  voiceover: string;
  stock_video_keywords: string[];
  subtitles: string[];
  title: string;
  description: string;
  hashtags: string[];
  metadata: ShortMetadata;
}

export interface GeneratorConfig {
  niche: string;
  tone: string;
  theme: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
}