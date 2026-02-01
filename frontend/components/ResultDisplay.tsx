import React, { useState } from 'react';
import { ShortPackage } from '../types';
import { Copy, FileText, Hash, Clock, Youtube, Video, MessageSquare } from 'lucide-react';
import { PexelsFinder } from './PexelsFinder';
import { VoiceoverPanel } from './VoiceoverPanel';
import { VideoAssemblyPanel } from './VideoAssemblyPanel';
import { YouTubeUploadPanel } from './YouTubeUploadPanel';

interface ResultDisplayProps {
  data: ShortPackage;
  niche?: string;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-white"
      title="Copy to clipboard"
    >
      {copied ? <span className="text-xs font-bold text-green-400">Copied!</span> : <Copy className="w-4 h-4" />}
    </button>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  icon,
  children,
  action
}) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4 hover:border-gray-700 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-gray-300 font-medium">
        {icon}
        <h3>{title}</h3>
      </div>
      {action}
    </div>
    <div className="text-gray-300 text-sm leading-relaxed">{children}</div>
  </div>
);

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, niche }) => {
  // State for video production pipeline
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [assembledVideoUrl, setAssembledVideoUrl] = useState<string | null>(null);

  const handleVideoSelected = (videoUrl: string) => {
    setSelectedVideoUrl(videoUrl);
  };

  const handleAudioGenerated = (audioUrl: string, file: string) => {
    setAudioFile(file);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

      {/* Top Meta Card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
            Viral Concept
          </div>
          <h2 className="text-xl font-bold text-white">{data.idea}</h2>
        </div>
        <div className="flex gap-4 text-xs font-mono text-gray-400 bg-gray-950/50 p-3 rounded-lg border border-gray-800">
          <div className="flex flex-col items-center px-2">
            <Clock className="w-4 h-4 mb-1 text-gray-500" />
            <span>{data.metadata?.estimated_duration_seconds || 30}s</span>
          </div>
          <div className="w-px bg-gray-700"></div>
          <div className="flex flex-col items-center px-2">
            <Youtube className="w-4 h-4 mb-1 text-gray-500" />
            <span>{data.metadata?.posting_time_suggestion || '18:00 UTC'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Script & Metadata (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Section
            title="Script (Voiceover)"
            icon={<FileText className="w-4 h-4 text-blue-400" />}
            action={<CopyButton text={data.voiceover || ''} />}
          >
            <div className="whitespace-pre-line font-medium text-white">{data.voiceover}</div>
          </Section>

          <Section
            title="Subtitles (SRT/Text)"
            icon={<MessageSquare className="w-4 h-4 text-purple-400" />}
            action={<CopyButton text={(data.subtitles || []).join('\n')} />}
          >
            <div className="flex flex-wrap gap-1.5">
              {(data.subtitles || []).map((sub, i) => (
                <span key={i} className="bg-gray-800 px-2 py-1 rounded text-xs border border-gray-700">
                  {sub}
                </span>
              ))}
            </div>
          </Section>

          <Section
            title="Visual Keywords"
            icon={<Video className="w-4 h-4 text-green-400" />}
            action={<CopyButton text={(data.stock_video_keywords || []).join(', ')} />}
          >
            <div className="flex flex-wrap gap-2">
              {(data.stock_video_keywords || []).map((kw, i) => (
                <span key={i} className="bg-green-900/20 text-green-400 border border-green-900/30 px-2 py-1 rounded-md text-xs font-medium">
                  {kw}
                </span>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section
              title="YouTube Title"
              icon={<Youtube className="w-4 h-4 text-red-500" />}
              action={<CopyButton text={data.title} />}
            >
              <div className="text-lg font-bold text-white">{data.title}</div>
            </Section>

            <Section
              title="Hashtags"
              icon={<Hash className="w-4 h-4 text-pink-400" />}
              action={<CopyButton text={(data.hashtags || []).join(' ')} />}
            >
              <div className="text-pink-300 font-mono text-sm leading-relaxed">
                {(data.hashtags || []).map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
              </div>
            </Section>
          </div>

          <Section
            title="Description"
            icon={<FileText className="w-4 h-4 text-gray-400" />}
            action={<CopyButton text={data.description} />}
          >
            <div className="whitespace-pre-line text-sm text-gray-300">{data.description}</div>
          </Section>
        </div>

        {/* Right Column: Video Production Pipeline (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Step 1: Stock Video Selection */}
          <PexelsFinder
            keywords={data.stock_video_keywords || []}
            script={data.voiceover || ''}
            title={data.title || ''}
            onVideoSelected={handleVideoSelected}
          />

          {/* Step 2: AI Voiceover */}
          <VoiceoverPanel
            script={data.voiceover || ''}
            onAudioGenerated={handleAudioGenerated}
          />

          {/* Step 3: Video Assembly */}
          <VideoAssemblyPanel
            videoUrl={selectedVideoUrl}
            audioFile={audioFile}
            subtitles={data.subtitles || []}
            title={data.title || ''}
            onVideoAssembled={(url) => setAssembledVideoUrl(url)}
          />

          {/* Step 4: YouTube Upload */}
          <YouTubeUploadPanel
            videoUrl={assembledVideoUrl}
            title={data.title || ''}
            description={data.description || ''}
            tags={data.hashtags || []}
            niche={niche}
          />
        </div>

      </div>

      <div className="flex justify-center mt-8">
        <div className="text-xs text-gray-600">
          Generated via Groq (LLaMA 3) + Pexels + Edge TTS + FFmpeg • 100% Free Stack
        </div>
      </div>
    </div>
  );
};