# 🦷 Dentcare - Smile Scan AI

An AI-powered dental diagnostics and consulting web application. Users can upload or capture a photo of their teeth to scan for dental caries (decay), read detailed reports, consult with a Gemini-powered dental assistant chatbot, and connect with qualified dentists. Doctors can manage patients, write treatment notes, and review scans.

---

## 🚀 Key Features

* **AI Dental Scan**: Upload or take photos of teeth to run real-time caries detection.
* **Interactive Dental Chatbot**: Ask questions about oral hygiene, prevention, and treatment advice from a trained AI dental bot.
* **Doctor Dashboard**: Specialized portal for certified dentists to search patients, view scans, edit reports, and write treatment plans.
* **Patient Portal**: Review personal diagnostic reports, track dental history, and save clinic follow-ups.
* **Supabase Cloud integration**: Secure user authentication, Row-Level Security (RLS) data isolation, image storage, and serverless Edge Functions.

---

## 🛠️ Technology Stack

* **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide React, Shadcn UI, Framer Motion
* **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
* **AI Engine**: Google Gemini API (`gemini-2.5-flash`)

---

## 💻 Local Setup Guide

Follow these steps to get the project running locally:

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/VijayKakde/Dentcare.git
cd Dentcare

# Install npm dependencies
npm install
```

### 2. Configure Environment Variables
Create a file named `.env` in the root folder of the project:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key
```

### 3. Start the Development Server
```bash
npm run dev
```
Open the output URL (usually `http://localhost:8080` or `http://localhost:5173`) in your browser.

---

## ☁️ Supabase Backend Setup

To link your own cloud Supabase account to this project:

### 1. Database Migrations
1. Go to your **Supabase Dashboard** > **SQL Editor**.
2. Run the SQL migrations found in `./supabase/migrations/` in sequential order (this creates tables, RLS rules, and automatic profile triggers).

### 2. Create Storage Bucket
1. Go to **Storage** > **New Bucket**.
2. Create a public bucket named `dental-scans` (to store uploaded patient teeth scans).
3. Set the bucket policies to allow authenticated uploads.

### 3. Deploy Edge Functions & Secrets
1. Link to your Supabase project:
   ```bash
   npx supabase link --project-ref <your-new-project-ref>
   ```
2. Set your Google Gemini API Key in the Supabase secrets:
   ```bash
   npx supabase secrets set GEMINI_API_KEY="your-gemini-api-key-here"
   ```
3. Deploy the Edge Functions:
   ```bash
   npx supabase functions deploy analyze-dental
   npx supabase functions deploy dental-chat
   ```

---

## 🔑 Google OAuth Setup

To enable "Sign in with Google":

1. **Google Cloud Console**:
   * Create OAuth Client ID credentials under **APIs & Services** > **Credentials**.
   * Select **Web Application**.
   * Add Authorized JavaScript origin: `http://localhost:8080` (or your active local port).
   * Add Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
   * Copy the **Client ID** and **Client Secret**.

2. **Supabase Dashboard**:
   * Go to **Authentication** > **Providers** > **Google**.
   * Toggle to **ON** and paste your Client ID and Client Secret.

3. **URL Redirect Settings**:
   * Under **Authentication** > **URL Configuration**, set the **Site URL** to `http://localhost:8080` (or your active local port) and add redirect path `http://localhost:8080/**`.

---

## 🌐 Production Deployment (Vercel)

1. Import your GitHub repository into **Vercel**.
2. Add your environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`) in the configure screen.
3. Once deployed, update your **Site URL** in Supabase and **Authorized JavaScript Origins** in Google Cloud Console with your production Vercel domain (e.g. `https://your-app.vercel.app`).
