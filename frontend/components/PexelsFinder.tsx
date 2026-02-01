import React, { useState, useEffect } from 'react';
import { Search, Image as ImageIcon, Key, Loader2, Video as VideoIcon } from 'lucide-react';
import { PexelsVideo } from '../types';
import { searchPexelsVideos } from '../services/pexels';
import { SmartVideoPlayer } from './SmartVideoPlayer';

interface PexelsFinderProps {
  keywords: string[];
  script: string;
  title: string;
  onVideoSelected?: (videoUrl: string) => void;
}

export const PexelsFinder: React.FC<PexelsFinderProps> = ({ keywords, script, title, onVideoSelected }) => {
  const [apiKey, setApiKey] = useState(() => import.meta.env.VITE_PEXELS_API_KEY || localStorage.getItem('pexels_api_key') || '');
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<PexelsVideo | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState(keywords[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('pexels_api_key', apiKey);
    setShowKeyInput(false);
    // Trigger search immediately after saving
    fetchVideos(selectedKeyword, apiKey);
  };

  const fetchVideos = async (query: string, key: string) => {
    if (!key) return;

    setLoading(true);
    setError(null);
    try {
      const results = await searchPexelsVideos(query, key);
      setVideos(results);
      if (results.length > 0) {
        setSelectedVideo(results[0]);
        if (onVideoSelected) {
          onVideoSelected(results[0].video_files[0].link);
        }
      }
    } catch (err: any) {
      setError(err.message);
      if (err.message === "Invalid API Key") setShowKeyInput(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchVideos(selectedKeyword, apiKey);
    }
  }, [selectedKeyword]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-300 font-medium">
            <VideoIcon className="w-4 h-4 text-green-400" />
            <h3>Generated Video Preview</h3>
          </div>
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-xs text-gray-500 hover:text-white flex items-center gap-1"
          >
            <Key className="w-3 h-3" />
            {apiKey ? 'Change Pexels Key' : 'Set Pexels Key'}
          </button>
        </div>

        {showKeyInput ? (
          <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 mb-6 shadow-inner">
            <div className="flex flex-col gap-3 max-w-sm mx-auto text-center">
              <h4 className="text-white font-semibold">Enable Video Generation</h4>
              <p className="text-xs text-gray-400">
                To generate the final video preview, we need a free Pexels API Key.
                <br />
                <a href="https://www.pexels.com/api/" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                  Get your free key here &rarr;
                </a>
              </p>
              <form onSubmit={handleSaveKey} className="flex flex-col gap-2 mt-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste Pexels API Key..."
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none w-full"
                />
                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-green-900/20">
                  Save & Enable
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Main Video Player */}
            {selectedVideo ? (
              <div className="max-w-xs mx-auto mb-6">
                <SmartVideoPlayer video={selectedVideo} script={script} title={title} />
              </div>
            ) : loading ? (
              <div className="aspect-[9/16] max-w-xs mx-auto bg-gray-950 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-gray-500 gap-3 mb-6">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <span className="text-sm font-medium">Composing video...</span>
              </div>
            ) : error ? (
              <div className="aspect-[9/16] max-w-xs mx-auto bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-center text-red-400 p-4 text-center text-sm mb-6">
                {error}
              </div>
            ) : (
              <div className="aspect-[9/16] max-w-xs mx-auto bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-center text-gray-600 p-4 text-center text-sm mb-6">
                Waiting for input...
              </div>
            )}

            {/* Keyword Selector & Alternatives */}
            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Switch Footage (Keywords)
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {keywords.map(kw => (
                  <button
                    key={kw}
                    onClick={() => setSelectedKeyword(kw)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedKeyword === kw
                      ? 'bg-green-900/30 text-green-400 border-green-800'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600 hover:text-gray-300'
                      }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>

              {videos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {videos.map(video => (
                    <button
                      key={video.id}
                      onClick={() => {
                        setSelectedVideo(video);
                        if (onVideoSelected) {
                          onVideoSelected(video.video_files[0].link);
                        }
                      }}
                      className={`relative aspect-[9/16] rounded-md overflow-hidden border-2 transition-all ${selectedVideo?.id === video.id ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img src={video.image} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};