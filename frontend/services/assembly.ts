// Video Assembly Service - Uses FFmpeg (FREE)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface AssemblyResult {
    videoUrl: string;
    filename: string;
}

export interface AssemblyConfig {
    videoUrl: string;      // Pexels video URL
    audioFile: string;     // Path to generated audio
    subtitles: string[];   // Subtitle lines
    title: string;         // Video title for overlay
}

export const assembleVideo = async (config: AssemblyConfig): Promise<AssemblyResult> => {
    const response = await fetch(`${BACKEND_URL}/api/assemble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assemble video');
    }

    const data = await response.json();
    return {
        videoUrl: `${BACKEND_URL}${data.videoUrl}`,
        filename: data.filename
    };
};
