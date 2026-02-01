import React, { useState } from 'react';
import { Mic, Play, Pause, Download, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { generateVoiceover, VOICE_OPTIONS, checkBackendHealth } from '../services/tts';

interface VoiceoverPanelProps {
    script: string;
    onAudioGenerated: (audioUrl: string, audioFile: string) => void;
}

export const VoiceoverPanel: React.FC<VoiceoverPanelProps> = ({ script, onAudioGenerated }) => {
    const [status, setStatus] = useState<'idle' | 'checking' | 'generating' | 'success' | 'error'>('idle');
    const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioFile, setAudioFile] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);

    const handleGenerate = async () => {
        if (!script || script.trim() === '') {
            setStatus('error');
            setError('No script available for voiceover. Please regenerate the content.');
            return;
        }

        setStatus('checking');
        setError(null);

        // Check if backend is running
        const isHealthy = await checkBackendHealth();
        if (!isHealthy) {
            setStatus('error');
            setError('Backend server is not running. Please start it with: npm run server');
            return;
        }

        setStatus('generating');

        try {
            const result = await generateVoiceover(script, selectedVoice);
            setAudioUrl(result.audioUrl);
            setAudioFile(result.filename);
            setStatus('success');
            onAudioGenerated(result.audioUrl, `/output/${result.filename}`);
        } catch (err: any) {
            setStatus('error');
            setError(err.message || 'Failed to generate voiceover');
        }
    };

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleDownload = () => {
        if (audioUrl) {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = audioFile || 'voiceover.mp3';
            a.click();
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-300 font-medium">
                    <Mic className="w-4 h-4 text-orange-400" />
                    <h3>AI Voiceover (Edge TTS)</h3>
                </div>
                <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full border border-green-800">
                    FREE
                </span>
            </div>

            {/* Voice Selection */}
            <div className="mb-4">
                <label className="text-xs text-gray-500 block mb-2">Select Voice</label>
                <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    disabled={status === 'generating'}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                    {VOICE_OPTIONS.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                            {voice.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Script Preview */}
            <div className="bg-gray-950 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-400 whitespace-pre-line">{script}</p>
            </div>

            {/* Generate Button */}
            {status === 'idle' || status === 'error' ? (
                <button
                    onClick={handleGenerate}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    <Volume2 className="w-4 h-4" />
                    Generate Voiceover
                </button>
            ) : status === 'checking' || status === 'generating' ? (
                <div className="w-full bg-gray-800 text-gray-300 py-3 rounded-lg flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {status === 'checking' ? 'Checking backend...' : 'Generating audio...'}
                </div>
            ) : null}

            {/* Error Message */}
            {error && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{error}</p>
                </div>
            )}

            {/* Audio Player */}
            {status === 'success' && audioUrl && (
                <div className="mt-4 space-y-3">
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={togglePlayback}
                            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 text-orange-400" />
                            ) : (
                                <Play className="w-5 h-5 text-orange-400" />
                            )}
                        </button>

                        <div className="flex-1 bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                    {audioFile}
                                </span>
                                <button
                                    onClick={handleDownload}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <span className="text-xs text-green-400">✓ Audio ready for video assembly</span>
                    </div>
                </div>
            )}
        </div>
    );
};
