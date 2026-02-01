import React, { useState, useEffect } from 'react';
import { Youtube, Upload, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface YouTubeUploadPanelProps {
    videoUrl: string | null;
    title: string;
    description: string;
    tags: string[];
}

export const YouTubeUploadPanel: React.FC<YouTubeUploadPanelProps> = ({
    videoUrl,
    title,
    description,
    tags
}) => {
    const [status, setStatus] = useState<'idle' | 'auth_needed' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);
    const [authUrl, setAuthUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authCode, setAuthCode] = useState('');

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    const handleUpload = async () => {
        if (!videoUrl) return;

        setStatus('uploading');
        setError(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/youtube/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl, title, description, tags })
            });

            const data = await response.json();

            if (response.status === 401) {
                setStatus('auth_needed');
                setAuthUrl(data.authUrl);
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setUploadUrl(data.videoUrl);
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setError(err.message);
        }
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${BACKEND_URL}/api/youtube/auth-callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: authCode })
            });

            const data = await response.json();
            if (response.ok) {
                setStatus('idle');
                handleUpload(); // Retry upload
            } else {
                setError('Auth failed: ' + data.error);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-300 font-medium">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <h3>YouTube Upload</h3>
                </div>
                <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full border border-red-800">
                    AUTOMATION
                </span>
            </div>

            {status === 'idle' || status === 'error' ? (
                <div className="space-y-3">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
                            {error}
                        </div>
                    )}
                    <button
                        onClick={handleUpload}
                        disabled={!videoUrl}
                        className={`w-full font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${videoUrl
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <Upload className="w-4 h-4" />
                        Upload to YouTube Shorts
                    </button>
                </div>
            ) : status === 'auth_needed' ? (
                <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <h4 className="text-white text-sm font-semibold mb-2">Authorization Required</h4>
                    <p className="text-xs text-gray-400 mb-3">
                        To upload videos, you need to grant permission.
                    </p>
                    <a
                        href={authUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm mb-3 flex items-center justify-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Authorize with Google
                    </a>

                    <form onSubmit={handleAuthSubmit} className="space-y-2">
                        <label className="text-xs text-gray-500">Paste Authorization Code here (if redirected, copy from URL):</label>
                        <input
                            type="text"
                            value={authCode}
                            onChange={(e) => setAuthCode(e.target.value)}
                            placeholder="4/0A..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none"
                        />
                        <button type="submit" className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm">
                            Verify Code
                        </button>
                    </form>
                </div>
            ) : status === 'uploading' ? (
                <div className="w-full bg-gray-800 text-gray-300 py-3 rounded-lg flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading to YouTube...
                </div>
            ) : status === 'success' ? (
                <div className="space-y-3">
                    <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-green-300">Upload Successful!</span>
                    </div>

                    <a
                        href={uploadUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm"
                    >
                        View on YouTube
                    </a>
                </div>
            ) : null}
        </div>
    );
};
