# Deployment Guide: CarSaathi Web Application

This project is structured as a monorepo consisting of:
- **Frontend**: Vite + React SPA (`Frontend` workspace)
- **Backend**: Express + TypeScript server (`Backend` workspace)

---

## 🚀 Option 1: Direct Blueprint Deployment (Recommended & Automatic)

This project contains a `render.yaml` Blueprint file. Render can read this file and automatically provision your Database, Backend, and Frontend with the correct configurations, environment variables, and connections in one go.

### Steps to Deploy:
1. Push your repository to **GitHub** or **GitLab**.
2. Log in to your **Render** dashboard and go to **Blueprints** -> **New Blueprint Instance**.
3. Connect your repository.
4. Render will parse the `render.yaml` and display the resources it will create:
   - **PostgreSQL Database** (`car-saathi-db`)
   - **Unified Web Service** (`car-saathi-unified`): Builds and runs both backend and frontend.
   - **Separate Frontend Static Site** (`car-saathi-frontend`): Optional, built separately from the `Frontend` folder.
5. In the blueprint setup page, you only need to fill in:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
6. Click **Approve**. Render will provision and launch all services automatically.

---

## 🛠️ Option 2: Unified Web Service Deployment (Highly Cost-Effective)

Since the Express backend is configured to compile and host the Vite static assets directly from `Frontend/dist`, you can deploy the entire application as a single Web Service. This is the recommended option for free/basic tiers as it uses only one service slot, avoids CORS issues, and works out-of-the-box.

### Steps to Deploy:
1. In your database provider (e.g. Render PostgreSQL, Neon.tech, or Supabase), create a new PostgreSQL database. Note down the **External Connection URI** (e.g. `postgresql://...`).
2. In the Render Dashboard, click **New +** -> **Web Service**.
3. Connect your Git repository.
4. Configure the following settings for the web service:
   - **Name**: `car-saathi`
   - **Environment**: `Node`
   - **Root Directory**: `.` (leave empty or use the root directory)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *[Your PostgreSQL Connection URI]*
   - `JWT_SECRET`: *[A long random secret string for JWT]*
   - `GEMINI_API_KEY`: *[Your Google Gemini AI API Key]*
6. Click **Create Web Service**. Render will install dependencies, compile the TypeScript backend, bundle the React frontend, and start the unified server.

---

## 🌐 Option 3: Separate Frontend & Backend Deployment

If you want to host the frontend on a static CDN (like Render Static Sites or Vercel) and the backend separately on a Node.js environment:

### Step 1: Database Deployment
Create a PostgreSQL instance on Render, Neon, or Supabase, and get the connection URI.

### Step 2: Backend Deployment on Render
1. Click **New +** -> **Web Service** in Render.
2. Configure settings:
   - **Name**: `car-saathi-backend`
   - **Root Directory**: `Backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run compile`
   - **Start Command**: `npm start`
3. Under **Environment Variables**, add:
   - `DATABASE_URL`: *[Your PostgreSQL Connection URI]*
   - `JWT_SECRET`: *[A long random secret string]*
   - `GEMINI_API_KEY`: *[Your Gemini AI API Key]*
   - `PORT`: `3000` (Render will auto-expose this port)
4. Click **Create Web Service** and copy the public URL once it deploys (e.g., `https://car-saathi-backend.onrender.com`).

### Step 3: Frontend Deployment on Render (Static Site)
1. Click **New +** -> **Static Site** in Render.
2. Configure settings:
   - **Name**: `car-saathi-frontend`
   - **Root Directory**: `Frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Under **Environment Variables**, add:
   - `VITE_API_URL`: *[URL of your Render Backend Service (copied in Step 2)]*
4. Under **Redirects/Rewrites**, add a rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
5. Click **Create Static Site**.
