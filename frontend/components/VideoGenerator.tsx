import React, { useState } from 'react';
import { Loader2, Video, AlertCircle, Play } from 'lucide-react';
import { generateVideoPreview } from '../services/gemini';

interface VideoGeneratorProps {
  prompt: string;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ prompt }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      setStatus('generating');
      setError(null);
      
      const url = await generateVideoPreview(prompt);
      setVideoUrl(url);
      setStatus('success');
      
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      
      // Handle missing entity error which usually means API key issue (not paid project)
      if (err.message && (err.message.includes("Requested entity was not found") || err.message.includes("404"))) {
         setError("Access Denied. Please ensure you have selected a valid API key from a paid Google Cloud Project.");
         // Prompt user to select key again if possible, though we rely on them clicking retry
      } else {
         setError(err.message || "Failed to generate video. Please try again.");
      }
    }
  };

  const handleRetryKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    handleGenerate();
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4 hover:border-gray-700 transition-colors overflow-hidden relative group">
       <div className="flex items-center gap-2 text-gray-300 font-medium mb-3">
         <Video className="w-4 h-4 text-brand-400" />
         <h3>AI Video Preview (Veo)</h3>
       </div>

       <div className="relative aspect-[9/16] bg-gray-950 rounded-lg overflow-hidden border border-gray-800 flex flex-col items-center justify-center">
          
          {status === 'idle' && (
             <div className="text-center p-6 w-full">
                <Video className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-4 px-4">
                  Generate a cinematic preview clip using Gemini Veo.
                </p>
                <button 
                  onClick={handleGenerate}
                  className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2 mx-auto"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Generate Footage
                </button>
             </div>
          )}

          {status === 'generating' && (
            <div className="text-center p-6 space-y-3 w-full">
               <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
               <div className="text-sm text-gray-300 font-medium">Generating Video...</div>
               <p className="text-xs text-gray-500 px-4">This usually takes about 30-60 seconds.</p>
            </div>
          )}

          {status === 'success' && videoUrl && (
             <video 
               src={videoUrl} 
               controls 
               autoPlay 
               loop 
               className="w-full h-full object-cover"
             />
          )}

          {status === 'error' && (
            <div className="text-center p-6 w-full">
               <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
               <p className="text-xs text-red-300 mb-4 px-2">{error}</p>
               <div className="flex gap-2 justify-center">
                 <button 
                    onClick={handleRetryKey}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all border border-gray-700"
                  >
                    Select Key
                  </button>
                 <button 
                    onClick={handleGenerate}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all border border-gray-700"
                  >
                    Retry
                  </button>
               </div>
            </div>
          )}
       </div>
        {status === 'idle' && (
            <div className="absolute bottom-3 w-full text-center">
               <span className="text-[10px] text-gray-600 bg-gray-900/80 px-2 py-0.5 rounded">
                  Requires Paid GCP Project
               </span>
            </div>
          )}
    </div>
  );
}