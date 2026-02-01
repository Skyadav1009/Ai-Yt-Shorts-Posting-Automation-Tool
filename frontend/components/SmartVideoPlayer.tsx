import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { PexelsVideo } from '../types';

interface SmartVideoPlayerProps {
  video: PexelsVideo;
  script: string;
  title: string;
}

export const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({ video, script, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Initialize TTS
  useEffect(() => {
    const u = new SpeechSynthesisUtterance(script);
    u.rate = 1.05; 
    u.pitch = 1.0;
    
    // Attempt to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (preferredVoice) u.voice = preferredVoice;

    u.onend = () => {
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };

    setUtterance(u);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [script]);

  const togglePlay = () => {
    if (!videoRef.current || !utterance) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // Restart TTS if it finished
      window.speechSynthesis.cancel(); 
      window.speechSynthesis.speak(utterance);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const videoFile = video.video_files.find(f => f.height >= 720 && f.height <= 1080) || video.video_files[0];

  return (
    <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group">
      {/* Video Layer */}
      <video
        ref={videoRef}
        src={videoFile.link}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted // Muted because we rely on TTS for audio
      />

      {/* Overlay: Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* Overlay: UI Elements */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
        
        {/* Top: Title */}
        <div className="mt-8">
          <h2 className="text-white font-bold text-xl leading-tight drop-shadow-md bg-black/40 backdrop-blur-sm p-3 rounded-lg border border-white/10 inline-block">
            {title}
          </h2>
        </div>

        {/* Center: Play Button (Interactive) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="bg-brand-500/90 hover:bg-brand-500 text-white p-5 rounded-full backdrop-blur-md shadow-lg shadow-brand-500/30 transition-all hover:scale-105 group-hover:flex"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}
        </div>

        {/* Bottom: Controls & Caption Placeholder */}
        <div className="space-y-3 pointer-events-auto">
          
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-lg border border-white/10">
            <p className="text-white text-sm font-medium leading-relaxed line-clamp-3 opacity-90">
              {script}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button 
              onClick={togglePlay}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-all"
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              {isPlaying ? 'Pause' : 'Preview'}
            </button>

            <div className="flex items-center gap-2 text-xs text-white/60">
               <Volume2 className="w-3 h-3" />
               <span>TTS Audio</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pexels Attribution */}
      <div className="absolute bottom-1 right-2 text-[10px] text-white/30 pointer-events-none">
        Video via Pexels
      </div>
    </div>
  );
};