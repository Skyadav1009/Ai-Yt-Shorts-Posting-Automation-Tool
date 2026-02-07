import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = 3001;

// Start Automation Scheduler
import { startAutomation } from './automation.js';
startAutomation();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/output', express.static(path.join(__dirname, 'output')));

// Ensure output directory exists
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// ============================================
// EDGE TTS - FREE Text-to-Speech
// ============================================
app.post('/api/tts', async (req, res) => {
    const { text, voice = 'en-US-ChristopherNeural' } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const timestamp = Date.now();
    const audioFile = path.join(outputDir, `voiceover_${timestamp}.mp3`);

    try {
        // Use edge-tts CLI (Python package) via python module to ensure it works on Windows
        await new Promise((resolve, reject) => {
            // Use 'python -m edge_tts' to avoid PATH issues
            const process = spawn('python', [
                '-m', 'edge_tts',
                '--voice', voice,
                '--text', text,
                '--write-media', audioFile
            ]);

            process.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`edge-tts exited with code ${code}`));
            });

            process.on('error', reject);
        });

        res.json({
            success: true,
            audioUrl: `/output/voiceover_${timestamp}.mp3`,
            filename: `voiceover_${timestamp}.mp3`
        });

    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({ error: 'Failed to generate audio. Make sure edge-tts is installed: pip install edge-tts' });
    }
});

// Get available voices
app.get('/api/tts/voices', async (req, res) => {
    try {
        const voices = await new Promise((resolve, reject) => {
            let output = '';
            const process = spawn('python', ['-m', 'edge_tts', '--list-voices']);

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.on('close', () => {
                const voiceList = output.split('\n')
                    .filter(line => line.includes('Name:'))
                    .map(line => line.replace('Name: ', '').trim());
                resolve(voiceList);
            });

            process.on('error', reject);
        });

        res.json({ voices });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get voices' });
    }
});

// ============================================
// FFMPEG - Video Assembly
// ============================================
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

app.post('/api/assemble', async (req, res) => {
    const { videoUrl, audioFile, subtitles, title } = req.body;

    if (!videoUrl || !audioFile) {
        return res.status(400).json({ error: 'Video URL and audio file are required' });
    }

    const timestamp = Date.now();
    const outputFile = path.join(outputDir, `final_${timestamp}.mp4`);
    const tempVideoFile = path.join(outputDir, `temp_video_${timestamp}.mp4`);
    const srtFile = path.join(outputDir, `subtitles_${timestamp}.srt`);

    try {
        // 1. Download the video from Pexels
        console.log('Downloading video...');
        const videoResponse = await fetch(videoUrl);
        const videoBuffer = await videoResponse.arrayBuffer();
        fs.writeFileSync(tempVideoFile, Buffer.from(videoBuffer));

        // 2. Create SRT file from subtitles
        if (subtitles && subtitles.length > 0) {
            const srtContent = generateSRT(subtitles);
            fs.writeFileSync(srtFile, srtContent);
        }

        // 3. Use FFmpeg to merge video + audio + subtitles
        console.log('Assembling video...');
        const audioPath = path.join(__dirname, audioFile.replace('/output/', 'output/'));

        await new Promise((resolve, reject) => {
            let command = ffmpeg(tempVideoFile)
                .input(audioPath)
                .outputOptions([
                    '-c:v libx264',
                    '-c:a aac',
                    '-map 0:v:0',
                    '-map 1:a:0',
                    '-shortest',
                    '-y' // Overwrite output files without asking
                ]);

            // Add subtitles if available
            // Note: subtitles filter requires escaping slightly differently in fluent-ffmpeg
            if (fs.existsSync(srtFile)) {
                // Path needs to be properly escaped for Windows filter string
                const escapedSrtPath = srtFile.replace(/\\/g, '/').replace(/:/g, '\\:');
                command = command.videoFilters(
                    `subtitles='${escapedSrtPath}':force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'`
                );
            }

            command
                .on('start', (cmdLine) => console.log('Spawned Ffmpeg with command: ' + cmdLine))
                .on('error', (err) => {
                    console.error('An error occurred: ' + err.message);
                    reject(err);
                })
                .on('end', () => {
                    console.log('Processing finished !');
                    resolve(null);
                })
                .save(outputFile);
        });

        // Cleanup temp files
        if (fs.existsSync(tempVideoFile)) fs.unlinkSync(tempVideoFile);
        if (fs.existsSync(srtFile)) fs.unlinkSync(srtFile);

        res.json({
            success: true,
            videoUrl: `/output/final_${timestamp}.mp4`,
            filename: `final_${timestamp}.mp4`
        });

    } catch (error) {
        console.error('Assembly Error:', error);
        res.status(500).json({ error: 'Failed to assemble video.' });
    }
});

// Generate SRT format from subtitles array
function generateSRT(subtitles) {
    let srt = '';
    const wordsPerSecond = 2.5; // Approximate speaking rate
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

// ============================================
// ADMIN DASHBOARD & ACCOUNT MANAGEMENT
// ============================================
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const DB_PATH = path.join(DATA_DIR, 'db.json');
const TOKENS_DIR = path.join(DATA_DIR, 'tokens');
if (!fs.existsSync(TOKENS_DIR)) fs.mkdirSync(TOKENS_DIR);

// Initialize DB
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
        accounts: [],
        mappings: {}
    }, null, 2));
}

function getDb() {
    return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDb(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Hardcoded as requested
    if (username === 'shivam' && password === '2K23CSUN01049') {
        res.json({ success: true, token: 'admin-session-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// List Accounts
app.get('/api/admin/accounts', (req, res) => {
    const db = getDb();
    res.json(db);
});

// Update Mappings
app.post('/api/admin/mappings', (req, res) => {
    const { mappings } = req.body;
    const db = getDb();
    db.mappings = mappings;
    saveDb(db);
    res.json({ success: true });
});

// Delete Account
app.delete('/api/admin/accounts/:id', (req, res) => {
    const { id } = req.params;
    const db = getDb();
    db.accounts = db.accounts.filter(acc => acc.id !== id);
    // Also delete token file
    const tokenPath = path.join(TOKENS_DIR, `${id}.json`);
    if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);

    saveDb(db);
    res.json({ success: true, accounts: db.accounts });
});

// ============================================
// YOUTUBE MULTI-ACCOUNT UPLOAD
// ============================================
import { google } from 'googleapis';
import open from 'open';

const SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/userinfo.email', // To identify user
    'https://www.googleapis.com/auth/userinfo.profile'
];

// Helper to find client_secret.json (Local vs Render)
function getCredentialsPath() {
    const localPath = path.join(process.cwd(), 'client_secret.json');
    const secretPath = '/etc/secrets/client_secret.json';

    if (fs.existsSync(localPath)) return localPath;
    if (fs.existsSync(secretPath)) return secretPath;

    return localPath; // Default to local path for error message
}

// 1. Generate Auth URL (for a generic 'add account' flow)
app.get('/api/youtube/auth-url', (req, res) => {
    const CREDENTIALS_PATH = getCredentialsPath();
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        return res.status(500).json({ error: 'client_secret.json missing' });
    }

    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id } = credentials.installed || credentials.web;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, process.env.REDIRECT_URI || 'http://localhost:3000');
    const url = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial for refresh tokens
        scope: SCOPES,
        prompt: 'consent' // Force refresh token generation
    });

    res.json({ url });
});

// 2. Handle Callback & Add Account
app.post('/api/youtube/add-account', async (req, res) => {
    const { code } = req.body;
    const CREDENTIALS_PATH = getCredentialsPath();
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id } = credentials.installed || credentials.web;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, process.env.REDIRECT_URI || 'http://localhost:3000');

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Get User Profile
        const oauth2 = google.oauth2({
            auth: oAuth2Client,
            version: 'v2'
        });

        const { data: userInfo } = await oauth2.userinfo.get();
        const accountId = userInfo.id; // Google User ID

        // Save Tokens
        fs.writeFileSync(path.join(TOKENS_DIR, `${accountId}.json`), JSON.stringify(tokens));

        // Update DB
        const db = getDb();
        const existingIdx = db.accounts.findIndex(a => a.id === accountId);
        const accountData = {
            id: accountId,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            addedAt: new Date().toISOString()
        };

        if (existingIdx >= 0) {
            db.accounts[existingIdx] = accountData;
        } else {
            db.accounts.push(accountData);
        }

        saveDb(db);

        res.json({ success: true, account: accountData });

    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ error: 'Failed to authenticate: ' + error.message });
    }
});

// 3. Upload to Specific Account
app.post('/api/youtube/upload', async (req, res) => {
    const { videoUrl, title, description, tags, niche } = req.body; // Niche comes from frontend

    if (!videoUrl || !title) return res.status(400).json({ error: 'Video URL/Title required' });

    const db = getDb();

    // DETERMINE TARGET ACCOUNT
    let targetAccountId = null;

    if (db.mappings && niche && db.mappings[niche]) {
        targetAccountId = db.mappings[niche];
        console.log(`Routing '${niche}' content to account ID: ${targetAccountId}`);
    } else if (db.accounts.length > 0) {
        targetAccountId = db.accounts[0].id; // Fallback to first
        console.log(`No mapping found for '${niche}', falling back to default account: ${db.accounts[0].email}`);
    } else {
        return res.status(500).json({ error: 'No YouTube accounts connected. Please connect one in the Dashboard.' });
    }

    // Load Tokens
    const tokenPath = path.join(TOKENS_DIR, `${targetAccountId}.json`);
    if (!fs.existsSync(tokenPath)) {
        return res.status(500).json({ error: 'Credentials for target account not found. Try reconnecting.' });
    }

    // Auth setup (same as before)
    const CREDENTIALS_PATH = getCredentialsPath();
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, process.env.REDIRECT_URI || 'http://localhost:3000');

    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(tokenPath)));

    try {
        // Check validity/refresh if needed handled by google-auth-library automatically usually, 
        // but explicit check is safer if using outdated tokens.
        // For now relying on auto-refresh via access_type=offline

        const videoFilename = videoUrl.split('/').pop();
        const videoPath = path.join(outputDir, videoFilename);
        const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });

        console.log(`Uploading to account ${targetAccountId}...`);

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
                body: fs.createReadStream(videoPath),
            },
        });

        res.json({
            success: true,
            videoId: response.data.id,
            videoUrl: `https://youtube.com/shorts/${response.data.id}`,
            accountUsed: targetAccountId
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Upload Failed', details: error.message });
    }
});

// Endpoint to save tokens (Legacy support removed/replaced above)


// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           ViralShorts Backend Server Running!              ║
╠════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                ║
║  TTS Endpoint: POST /api/tts                               ║
║  Assembly Endpoint: POST /api/assemble                     ║
║  YouTube Endpoint: POST /api/youtube/upload                ║
╚════════════════════════════════════════════════════════════╝
  `);
});
