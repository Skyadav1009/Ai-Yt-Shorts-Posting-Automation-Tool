
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const TOKENS_DIR = path.join(DATA_DIR, 'tokens');

// Ensure directories exist
if (!fs.existsSync(TOKENS_DIR)) {
    fs.mkdirSync(TOKENS_DIR, { recursive: true });
}

// Helper to find client_secret.json
function getCredentialsPath() {
    // Try current directory
    let credPath = path.join(__dirname, 'client_secret.json');
    if (fs.existsSync(credPath)) return credPath;

    // Try parent directory (if run from backend subdir)
    credPath = path.join(__dirname, '../client_secret.json');
    if (fs.existsSync(credPath)) return credPath;

    // Try standard locations
    credPath = path.join(process.cwd(), 'client_secret.json');
    if (fs.existsSync(credPath)) return credPath;

    return null;
}

/**
 * Creates an OAuth2 client with credentials set.
 * Automatically handles token refreshing and saving.
 * 
 * @param {string} accountId The Google Account ID to load tokens for
 * @returns {Promise<import('googleapis').Auth.OAuth2Client>} Configured OAuth2 client
 */
export async function createAuthenticatedClient(accountId) {
    const credPath = getCredentialsPath();
    if (!credPath) {
        throw new Error('client_secret.json not found. Please place it in the project root.');
    }

    const content = fs.readFileSync(credPath);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    // Choose redirect URI (prefer localhost)
    const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000';

    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirectUri
    );

    const tokenPath = path.join(TOKENS_DIR, `${accountId}.json`);
    if (!fs.existsSync(tokenPath)) {
        throw new Error(`No tokens found for account ID: ${accountId}. Please login again.`);
    }

    const tokens = JSON.parse(fs.readFileSync(tokenPath));
    oAuth2Client.setCredentials(tokens);

    // CRITICAL: Listen for refresh events
    // verified that google-auth-library emits 'tokens' when a refresh happens
    oAuth2Client.on('tokens', (newTokens) => {
        console.log(`[Auth] Tokens refreshed for account ${accountId}`);
        saveTokens(accountId, newTokens);
    });

    return oAuth2Client;
}

/**
 * Saves tokens to disk, merging with existing ones to preserve refresh_token
 * if it's not present in the update.
 * 
 * @param {string} accountId 
 * @param {object} newTokens 
 */
export function saveTokens(accountId, newTokens) {
    const tokenPath = path.join(TOKENS_DIR, `${accountId}.json`);
    let existingTokens = {};

    if (fs.existsSync(tokenPath)) {
        try {
            existingTokens = JSON.parse(fs.readFileSync(tokenPath));
        } catch (e) {
            console.error(`[Auth] Error reading existing tokens for ${accountId}:`, e);
        }
    }

    // Merge: New tokens take precedence, but keep old refresh_token if new one is missing
    const finalTokens = {
        ...existingTokens,
        ...newTokens
    };

    // Explicit check: If we have a refresh_token in existing but not new, KEEP IT
    if (existingTokens.refresh_token && !newTokens.refresh_token) {
        finalTokens.refresh_token = existingTokens.refresh_token;
    }

    fs.writeFileSync(tokenPath, JSON.stringify(finalTokens, null, 2));
    console.log(`[Auth] Tokens saved for account ${accountId}`);
}

/**
 * Gets the OAuth2 client for initial auth flow
 */
export function getOAuthClient() {
    const credPath = getCredentialsPath();
    if (!credPath) throw new Error('client_secret.json missing');

    const content = fs.readFileSync(credPath);
    const credentials = JSON.parse(content);
    const { client_secret, client_id } = credentials.installed || credentials.web;

    return new google.auth.OAuth2(
        client_id,
        client_secret,
        process.env.REDIRECT_URI || 'http://localhost:3000'
    );
}
