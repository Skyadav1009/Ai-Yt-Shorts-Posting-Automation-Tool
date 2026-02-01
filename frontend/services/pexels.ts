import { PexelsVideo } from '../types';

export const searchPexelsVideos = async (query: string, apiKey: string): Promise<PexelsVideo[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=4`, {
    headers: {
      Authorization: apiKey
    }
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Invalid API Key");
    throw new Error("Failed to fetch videos from Pexels");
  }

  const data = await response.json();
  return data.videos || [];
};