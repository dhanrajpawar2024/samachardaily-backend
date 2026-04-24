# 🛠️ SamacharDaily Admin Dashboard

Internal admin panel — built with **React 18 + Vite + TypeScript + Tailwind CSS**.

---

## 🖥️ Pages

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Scraper health, last run stats, 1-click job triggers |
| `/articles` | Articles | Browse, filter by language, delete articles |
| `/sources` | Sources | All 145 news sources grouped by language, per-language scrape trigger |
| `/analytics` | Analytics | Bar/Pie/Line charts — articles per day, language split, hourly views |
| `/users` | Users | User list with language preference (connects to auth-service) |

---

## 🚀 Quick Start

```bash
# 1. Copy env
cp .env.example .env

# 2. Edit to point at your backends
# VITE_API_URL=http://localhost:3001
# VITE_SCRAPER_URL=http://localhost:3007

# 3. Install & run
npm install
npm run dev
# → http://localhost:5000
```

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + Vite 6 |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| Type safety | TypeScript strict |
| Build output | Nginx static (production) |

---

## ⚡ Dashboard Features

### Scraper Control Panel
- View last scrape run stats (articles ingested, duration)
- **One-click job triggers**: Run Scraper / Recalculate Trending / Cleanup
- Real-time status (idle → running → success/error)
- Service health indicators

### Articles Table
- Paginated table (20/page) with all articles
- Filter by language (EN/HI/TE/TA/KN/MR/BN/GU/PA/ML)
- Client-side title search
- View article on web app
- Delete article

### Sources Manager
- All 145 sources grouped by language
- Category color-coded badges
- Per-language scrape trigger button
- Filter by language + search by name/URL

### Analytics Charts
- Bar chart: Articles ingested per day (EN/HI/TE)
- Pie chart: Sources by language
- Line chart: Hourly article views today

---

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── App.tsx             # Router setup
│   ├── main.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx   # Overview + job triggers
│   │   ├── Articles.tsx    # Article management table
│   │   ├── Sources.tsx     # Source registry browser
│   │   ├── Analytics.tsx   # Charts
│   │   └── Users.tsx       # User list
│   ├── components/
│   │   ├── Layout.tsx      # App shell (sidebar + header + outlet)
│   │   ├── Sidebar.tsx     # Collapsible nav sidebar
│   │   ├── Header.tsx      # Top bar with toggle + "View Site" link
│   │   └── StatsCard.tsx   # Reusable metric card with icon + trend
│   └── lib/
│       └── api.ts          # All fetch calls (api-gateway + scraper)
├── nginx.conf              # Production nginx config
└── Dockerfile              # Multi-stage: build → nginx
```

---

## 🐳 Docker

```bash
docker compose -f ../backend/docker-compose.yml up admin-dashboard
# → http://localhost:5000
```

---

## 🔌 API Connections

| Service | Base URL | Used For |
|---------|----------|----------|
| api-gateway | `VITE_API_URL` | Articles list, delete |
| scraper-service | `VITE_SCRAPER_URL` | Health, stats, sources, job triggers |

