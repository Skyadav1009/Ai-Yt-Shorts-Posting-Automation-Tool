import React, { useState } from 'react';
import { GeneratorConfig, LoadingState } from '../types';
import { DEFAULT_NICHE, DEFAULT_TONE, DEFAULT_THEME } from '../constants';
import { Loader2, Sparkles } from 'lucide-react';

interface InputFormProps {
  onGenerate: (config: GeneratorConfig) => void;
  loadingState: LoadingState;
}

export const InputForm: React.FC<InputFormProps> = ({ onGenerate, loadingState }) => {
  const [niche, setNiche] = useState(DEFAULT_NICHE);
  const [tone, setTone] = useState(DEFAULT_TONE);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ niche, tone, theme });
  };

  const isGenerating = loadingState === LoadingState.GENERATING;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-500/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Content Configuration</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Niche / Topic</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-500"
              placeholder="e.g. Motivation, Tech, Cooking"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Tone</label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-500"
              placeholder="e.g. Inspiring, Funny, Educational"
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Theme Examples</label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-500"
            placeholder="e.g. Discipline, Focus, Tips"
            disabled={isGenerating}
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className={`w-full mt-4 flex items-center justify-center gap-2 font-semibold py-4 rounded-lg transition-all ${
            isGenerating
              ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 active:scale-[0.99]'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Assets...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Viral Package
            </>
          )}
        </button>
      </form>
    </div>
  );
};