import React, { useState } from 'react';
import { Film, Loader2, AlertCircle, Download, CheckCircle } from 'lucide-react';
import { assembleVideo, AssemblyConfig } from '../services/assembly';
import { checkBackendHealth } from '../services/tts';

interface VideoAssemblyPanelProps {
    videoUrl: string | null;
    audioFile: string | null;
    subtitles: string[];
    title: string;
    onVideoAssembled?: (url: string) => void;
}

export const VideoAssemblyPanel: React.FC<VideoAssemblyPanelProps> = ({
    videoUrl,
    audioFile,
    subtitles,
    title,
    onVideoAssembled
}) => {
    const [status, setStatus] = useState<'idle' | 'checking' | 'assembling' | 'success' | 'error'>('idle');
    const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canAssemble = videoUrl && audioFile;

    const handleAssemble = async () => {
        if (!videoUrl || !audioFile) return;

        setStatus('checking');
        setError(null);

        // Check if backend is running
        const isHealthy = await checkBackendHealth();
        if (!isHealthy) {
            setStatus('error');
            setError('Backend server is not running. Please start it with: npm run server');
            return;
        }

        setStatus('assembling');

        try {
            const config: AssemblyConfig = {
                videoUrl,
                audioFile,
                subtitles,
                title
            };

            const result = await assembleVideo(config);
            setFinalVideoUrl(result.videoUrl);
            setStatus('success');

            if (onVideoAssembled) {
                onVideoAssembled(result.videoUrl);
            }
        } catch (err: any) {
            setStatus('error');
            setError(err.message || 'Failed to assemble video');
        }
    };

    const handleDownload = () => {
        if (finalVideoUrl) {
            const a = document.createElement('a');
            a.href = finalVideoUrl;
            a.download = 'viral_short.mp4';
            a.click();
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-300 font-medium">
                    <Film className="w-4 h-4 text-purple-400" />
                    <h3>Video Assembly (FFmpeg)</h3>
                </div>
                <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full border border-green-800">
                    FREE
                </span>
            </div>

            {/* Prerequisites Check */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    {videoUrl ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                    )}
                    <span className={videoUrl ? 'text-green-400' : 'text-gray-500'}>
                        Stock video selected
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    {audioFile ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                    )}
                    <span className={audioFile ? 'text-green-400' : 'text-gray-500'}>
                        Voiceover generated
                    </span>
                </div>
            </div>

            {/* Assemble Button */}
            {status === 'idle' || status === 'error' ? (
                <button
                    onClick={handleAssemble}
                    disabled={!canAssemble}
                    className={`w-full font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${canAssemble
                            ? 'bg-purple-600 hover:bg-purple-500 text-white'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <Film className="w-4 h-4" />
                    {canAssemble ? 'Assemble Final Video' : 'Complete steps above first'}
                </button>
            ) : status === 'checking' || status === 'assembling' ? (
                <div className="w-full bg-gray-800 text-gray-300 py-3 rounded-lg flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {status === 'checking' ? 'Checking backend...' : 'Assembling video (this may take a moment)...'}
                </div>
            ) : null}

            {/* Error Message */}
            {error && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{error}</p>
                </div>
            )}

            {/* Success - Video Player & Download */}
            {status === 'success' && finalVideoUrl && (
                <div className="mt-4 space-y-3">
                    <div className="relative aspect-[9/16] max-w-xs mx-auto bg-gray-950 rounded-xl overflow-hidden border-2 border-purple-500">
                        <video
                            src={finalVideoUrl}
                            controls
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <button
                        onClick={handleDownload}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download Final Video
                    </button>
                </div>
            )}
        </div>
    );
};
