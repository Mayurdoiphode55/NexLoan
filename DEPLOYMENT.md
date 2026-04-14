# NexLoan — Deployment Guide

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Vercel         │────▶│   Render          │────▶│  Supabase       │
│   (Next.js)      │     │   (FastAPI)       │     │  (PostgreSQL)   │
│   Frontend       │     │   Backend API     │     │  Database       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │       │
                              ▼       ▼
                        ┌─────────┐ ┌──────────────┐
                        │ Upstash │ │ Cloudflare   │
                        │ (Redis) │ │ R2 (Storage) │
                        └─────────┘ └──────────────┘
```

---

## 1. Backend — Deploy to Render

### Steps:

1. **Push backend to GitHub**
   ```bash
   cd backend
   git init
   git add .
   git commit -m "NexLoan API - Phase 8"
   git remote add origin https://github.com/YOUR_USER/nexloan-api.git
   git push -u origin main
   ```

2. **Connect to Render**
   - Go to [render.com](https://render.com) → New → Web Service
   - Connect your GitHub repo
   - Render will auto-detect `render.yaml`
   - Set all environment variables (see checklist below)

3. **Environment Variables on Render:**

   | Variable | Source | Example |
   |---|---|---|
   | `DATABASE_URL` | Supabase | `postgresql+asyncpg://user:pass@host:5432/dbname` |
   | `REDIS_URL` | Upstash | `redis://default:token@host:port` |
   | `JWT_SECRET` | Generate | Any 32+ char random string |
   | `GROQ_API_KEY` | Groq Console | `gsk_...` |
   | `GROQ_VISION_MODEL` | Fixed | `llama-3.2-11b-vision-preview` |
   | `GROQ_TEXT_MODEL` | Fixed | `llama-3.1-8b-instant` |
   | `RESEND_API_KEY` | Resend Dashboard | `re_...` |
   | `R2_ACCOUNT_ID` | Cloudflare R2 | Account ID |
   | `R2_ACCESS_KEY_ID` | Cloudflare R2 | Access Key |
   | `R2_SECRET_ACCESS_KEY` | Cloudflare R2 | Secret Key |
   | `R2_BUCKET_NAME` | Cloudflare R2 | `nexloan-docs` |
   | `R2_PUBLIC_URL` | Cloudflare R2 | Public bucket URL |
   | `DEBUG` | Fixed | `false` |

---

## 2. Frontend — Deploy to Vercel

### Steps:

1. **Push frontend to GitHub**
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "NexLoan Frontend - Phase 8"
   git remote add origin https://github.com/YOUR_USER/nexloan-frontend.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) → New Project
   - Import your GitHub repo
   - Framework: Next.js (auto-detected)
   - Set environment variable:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g., `https://nexloan-api.onrender.com`) |

3. **Deploy** — Vercel will build and deploy automatically.

---

## 3. Supabase PostgreSQL Setup

1. Go to [supabase.com](https://supabase.com) → New Project (Free Tier)
2. Copy the **Connection String** from Settings → Database → URI
3. Replace `postgresql://` with `postgresql+asyncpg://` for SQLAlchemy async
4. Add as `DATABASE_URL` on Render

---

## 4. Upstash Redis Setup

1. Go to [upstash.com](https://upstash.com) → Create Database (Free Tier)
2. Select **Regional** → closest region to Render
3. Copy the **Redis URL** from the dashboard
4. Add as `REDIS_URL` on Render

---

## 5. Cloudflare R2 Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Create a new bucket (e.g., `nexloan-docs`)
3. Enable **Public Access** for the bucket
4. Go to R2 → Manage R2 API Tokens → Create API Token
5. Copy Account ID, Access Key ID, and Secret Access Key
6. Add all R2 variables to Render

---

## 6. Post-Deployment Verification

Run through this checklist after both services are live:

- [ ] `GET https://your-api.onrender.com/health` returns `{"status": "ok"}`
- [ ] Frontend loads at your Vercel URL
- [ ] Registration + OTP flow works end-to-end
- [ ] Loan application + KYC upload works
- [ ] Admin page at `/admin` shows pending KYC items
- [ ] Underwriting + disbursement works
- [ ] Chatbot responds to messages
- [ ] Dark/Light mode toggle works

---

## Important Notes

- **Cold Starts:** Render free tier has cold starts (~30s). First request after inactivity may be slow.
- **Admin Security:** The `/api/admin/*` endpoints have NO authentication in this prototype. Add role-based auth before production use.
- **CORS:** Backend allows all origins (`*`) for prototype. Restrict to your Vercel domain in production.
- **Database Migrations:** Run `alembic upgrade head` after first deployment if using Alembic.
