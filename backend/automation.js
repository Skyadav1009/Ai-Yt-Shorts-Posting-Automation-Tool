
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import 'dotenv/config';
import * as auth from './auth.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const TOKENS_DIR = path.join(DATA_DIR, 'tokens');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Constants
const NICHES = [
    "Tech Facts & Future Tech",
    "Deep Psychology Facts",
    "History Mysteries",
    "Space & Universe Facts",
    "Business & Money Mindset",
    "Life Hacks & Productivity",
    "Weird & Fun Facts"
];

const SYSTEM_PROMPT_TEMPLATE = `
SYSTEM ROLE
You are an AI content engine inside a fully automated YouTube Shorts posting system.
Your task is to generate all creative assets required to publish ONE YouTube Short per day, without human intervention.
OBJECTIVE
Generate ONE viral YouTube Short including Idea, Script, Voiceover, Keywords, Subtitles, Title, Description, Hashtags, and Metadata.
GLOBAL CONSTRAINTS
- Platform: YouTube Shorts
- Video length: 30–45 seconds
- Aspect ratio: 9:16 vertical
- Target audience: Gen Z (18–30)
- Style: Fast-paced, emotional, scroll-stopping
- Language: Simple, conversational English
- No emojis in script or subtitles
- Output must be JSON ONLY
NICHE CONFIGURATION
Niche: {{NICHE}}
Tone: {{TONE}}
Theme examples: {{THEME}}
STEP-BY-STEP GENERATION TASKS
1. SHORT IDEA
Generate one strong viral idea that hooks in the first 2 seconds, feels relatable, creates curiosity, and is evergreen.
2. SCRIPT
Write a spoken script optimized for voiceover.
Rules: 90–120 words max, first line must be a hook, short punchy sentences, natural spoken flow, strong ending takeaway, no emojis, no timestamps.
3. VOICEOVER TEXT
Return the same script, but remove visual references, ensure smooth spoken rhythm, add natural pauses using line breaks.
4. STOCK VIDEO SEARCH KEYWORDS
Provide 5–7 short keyword phrases for vertical stock videos. Rules: Cinematic, abstract, no people speaking to camera.
5. SUBTITLES TEXT
Return subtitle content: Word-by-word timing friendly, short lines (max 6 words), capitalize important words, same wording as script.
6. TITLE
Max 50 characters, curiosity-driven, emotional, must include #Shorts.
7. DESCRIPTION
1-2 short lines, call to action, include #Shorts, no links.
8. HASHTAGS
5-8 hashtags, niche related + shorts related, all lowercase.
9. METADATA
estimated_duration_seconds, category, posting_time_suggestion (UTC).
REQUIRED OUTPUT FORMAT (JSON ONLY):
{
  "idea": "Viral concept string",
  "script": "Full script text...",
  "voiceover": "Clean spoken text for TTS...",
  "stock_video_keywords": ["keyword 1", "keyword 2"],
  "subtitles": ["Subtitle line 1", "Subtitle line 2"],
  "title": "Video Title #Shorts",
  "description": "Video description...",
  "hashtags": ["#tag1", "#tag2"],
  "metadata": {
    "estimated_duration_seconds": 30,
    "category": "Education",
    "posting_time_suggestion": "15:00 UTC"
  }
}
`;

// Helper: Get DB
function getDb() {
    if (!fs.existsSync(DB_PATH)) return { accounts: [], mappings: {} };
    return JSON.parse(fs.readFileSync(DB_PATH));
}

// 1. Generate Script (Groq)
async function generateScript(niche) {
    console.log('[Automation] Generating script for niche:', niche);
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY missing");

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE
        .replace("{{NICHE}}", niche)
        .replace("{{TONE}}", "Engaging, Fast-Paced, Viral")
        .replace("{{THEME}}", "Viral Facts, Hidden Truths");

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Generate ONE complete YouTube Short package now. Return ONLY valid JSON." }
                ],
                temperature: 0.8,
                max_tokens: 2048,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("No content from Groq");

        return JSON.parse(content);
    } catch (error) {
        console.error('[Automation] Script Generation Failed:', error);
        throw error;
    }
}

// 2. TTS (Edge-TTS)
async function generateVoiceover(text) {
    console.log('[Automation] Generating voiceover...');
    const timestamp = Date.now();
    const outputFile = path.join(OUTPUT_DIR, `auto_voice_${timestamp}.mp3`);

    // Using ChristopherNeural
    const voice = 'en-US-ChristopherNeural';

    await new Promise((resolve, reject) => {
        const process = spawn('python', [
            '-m', 'edge_tts',
            '--voice', voice,
            '--text', text,
            '--write-media', outputFile
        ]);

        process.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`edge-tts exited with code ${code}`));
        });
        process.on('error', reject);
    });

    return outputFile;
}

// 3. Get Stock Video (Pexels)
async function getStockVideo(query) {
    console.log('[Automation] Searching Pexels for:', query);
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) throw new Error("PEXELS_API_KEY missing");

    try {
        const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=4`, {
            headers: { Authorization: apiKey }
        });

        if (!response.ok) throw new Error('Pexels API Error');
        const data = await response.json();
        if (!data.videos || data.videos.length === 0) throw new Error('No videos found');

        // Pick random video from top 4
        const video = data.videos[Math.floor(Math.random() * data.videos.length)];
        // Get highest quality link
        const videoFile = video.video_files.find(f => f.quality === 'hd' && f.width < f.height) || video.video_files[0];
        return videoFile.link;

    } catch (error) {
        console.error('[Automation] Pexels Error:', error);
        throw error;
    }
}

// 4. Assemble Video (FFmpeg)
async function assembleVideo(videoUrl, audioPath, subtitles) {
    console.log('[Automation] Assembling video...');
    const timestamp = Date.now();
    const outputFile = path.join(OUTPUT_DIR, `auto_final_${timestamp}.mp4`);
    const tempVideoFile = path.join(OUTPUT_DIR, `auto_temp_video_${timestamp}.mp4`);
    const srtFile = path.join(OUTPUT_DIR, `auto_subtitles_${timestamp}.srt`);

    // Set ffmpeg path
    if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

    try {
        // Download Video
        const videoResponse = await fetch(videoUrl);
        const videoBuffer = await videoResponse.arrayBuffer();
        fs.writeFileSync(tempVideoFile, Buffer.from(videoBuffer));

        // Create SRT
        const srtContent = generateSRT(subtitles);
        fs.writeFileSync(srtFile, srtContent);

        // Run FFmpeg
        await new Promise((resolve, reject) => {
            let command = ffmpeg(tempVideoFile)
                .input(audioPath)
                .outputOptions([
                    '-c:v libx264',
                    '-c:a aac',
                    '-map 0:v:0',
                    '-map 1:a:0',
                    '-shortest', // Stop when shortest input ends (audio usually)
                    '-y'
                ]);

            // Add subtitles
            if (fs.existsSync(srtFile)) {
                // Windows critical escaping for subtitles filter
                const escapedSrtPath = srtFile.replace(/\\/g, '/').replace(/:/g, '\\:');
                command = command.videoFilters(
                    `subtitles='${escapedSrtPath}':force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'`
                );
            }

            command
                .on('end', resolve)
                .on('error', reject)
                .save(outputFile);
        });

        // Cleanup temp
        if (fs.existsSync(tempVideoFile)) fs.unlinkSync(tempVideoFile);
        if (fs.existsSync(srtFile)) fs.unlinkSync(srtFile);
        // Note: Keep audio file? Or delete? User might want to debug.
        // fs.unlinkSync(audioPath); 

        return outputFile;

    } catch (error) {
        console.error('[Automation] Assembly Error:', error);
        throw error;
    }
}

// Helper: Generate SRT from array (copied from index.js)
function generateSRT(subtitles) {
    let srt = '';
    const wordsPerSecond = 2.5;
    let currentTime = 0;

    subtitles.forEach((line, index) => {
        const wordCount = line.split(' ').length;
        const duration = wordCount / wordsPerSecond;
        const startTime = formatSRTTime(currentTime);
        const endTime = formatSRTTime(currentTime + duration);

        srt += `${index + 1}\n`;
        srt += `${startTime} --> ${endTime}\n`;
        srt += `${line}\n\n`;

        currentTime += duration;
    });
    return srt;
}

function formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// 5. Upload to YouTube
async function uploadToYouTube(filePath, title, description, tags, niche) {
    console.log('[Automation] Uploading to YouTube...');
    const db = getDb();

    // Determine account
    let targetAccountId = null;
    if (db.mappings && niche && db.mappings[niche]) {
        targetAccountId = db.mappings[niche];
    } else if (db.accounts.length > 0) {
        targetAccountId = db.accounts[0].id; // Fallback
    } else {
        throw new Error('No connected YouTube accounts found.');
    }

    try {
        // Use Centralized Auth (handles refresh tokens automatically)
        const oAuth2Client = await auth.createAuthenticatedClient(targetAccountId);

        // Upload
        const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });

        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: title.substring(0, 100),
                    description: description,
                    tags: tags,
                    categoryId: '22',
                },
                status: {
                    privacyStatus: 'public',
                    selfDeclaredMadeForKids: false,
                },
            },
            media: {
                body: fs.createReadStream(filePath),
            },
        });

        console.log(`[Automation] Upload Success! Video ID: ${response.data.id}`);
        return response.data;

    } catch (error) {
        console.error(`[Automation] Upload Failed for account ${targetAccountId}:`, error.message);
        throw error;
    }
}


// MAIN AUTOMATION FLOW
export async function runAutomationTask() {
    console.log('=============================================');
    console.log('[Automation] Starting Scheduled Task: ' + new Date().toISOString());
    console.log('=============================================');

    try {
        // 1. Pick Niche
        const niche = NICHES[Math.floor(Math.random() * NICHES.length)];
        console.log(`[Automation] Selected Niche: ${niche}`);

        // 2. Generate Content
        const scriptData = await generateScript(niche);
        console.log('[Automation] Script generated:', scriptData.title);

        // 3. Generate Audio
        const audioPath = await generateVoiceover(scriptData.voiceover);
        console.log('[Automation] Audio generated:', audioPath);

        // 4. Get Video
        const videoUrl = await getStockVideo(scriptData.stock_video_keywords[0]);
        console.log('[Automation] Video found:', videoUrl);

        // 5. Assemble
        const finalVideoPath = await assembleVideo(videoUrl, audioPath, scriptData.subtitles);
        console.log('[Automation] Video Assembled:', finalVideoPath);

        // 6. Upload
        await uploadToYouTube(
            finalVideoPath,
            scriptData.title,
            scriptData.description,
            scriptData.hashtags,
            niche
        );

        console.log('[Automation] Task Completed Successfully!');

    } catch (error) {
        console.error('[Automation] Task Failed:', error);
    }
}

// CRON JOB
// Schedule: Every 6 hours "0 */6 * * *"
export function startAutomation() {
    console.log('[Automation] Scheduler active: Running every 6 hours.');

    // Run immediately on start for testing? Maybe not, user said "every 6 hours".
    // Or run immediately once to verify? Better to stick to schedule or maybe run if no recent upload.
    // I'll stick to cron.

    cron.schedule('0 */6 * * *', () => {
        runAutomationTask();
    });
}
