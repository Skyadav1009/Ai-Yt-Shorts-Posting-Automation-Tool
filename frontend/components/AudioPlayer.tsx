import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.1; // Slightly faster for Shorts style
    u.pitch = 1.0;
    
    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (preferredVoice) u.voice = preferredVoice;

    u.onend = () => setIsPlaying(false);
    u.onpause = () => setIsPlaying(false);
    u.onerror = () => setIsPlaying(false);
    
    setUtterance(u);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text]);

  const handlePlay = () => {
    if (!utterance) return;
    window.speechSynthesis.cancel(); // Stop any current
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-300 font-medium">
          <Volume2 className="w-4 h-4 text-blue-400" />
          <h3>Voiceover Preview (TTS)</h3>
        </div>
        <div className="text-[10px] uppercase font-bold text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
          Free
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            Play Audio
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-red-500/20 animate-pulse"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop
          </button>
        )}
        <div className="text-xs text-gray-500 ml-auto">
          Previewing with browser Text-to-Speech
        </div>
      </div>
    </div>
  );
};