---
description: How to setup YouTube Upload Credentials
---

# YouTube Automation Setup Guide

To enable auto-uploading to YouTube Shorts, you need a `client_secret.json` file.

## Step 1: Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a **New Project** named `ViralShorts`.
3. Go to **APIs & Services** -> **Library**.
4. Search for `YouTube Data API v3` and click **Enable**.

## Step 2: OAuth Consent Screen
1. Go to **APIs & Services** -> **OAuth consent screen**.
2. Select **External** and Create.
3. Fill in the required fields (App Name: `ViralShorts`, Email: Yours).
4. **IMPORTANT**: Under **Test Users**, add your own Google email address.

## Step 3: Credentials
1. Go to **APIs & Services** -> **Credentials**.
2. Click **Create Credentials** -> **OAuth client ID**.
3. Application Type: **Desktop app**.
4. Click Create and **Download JSON**.

## Step 4: Installation
1. Rename the downloaded file to `client_secret.json`.
2. Move it to the root of your project folder:
   ```
   c:\Users\Shivam Kumar Yadav\Desktop\code\Automated-AI-Powered-Yt-Shorts\client_secret.json
   ```
3. Restart the backend server.
