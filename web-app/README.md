# 🌐 SamacharDaily Web App

User-facing news reader web app — built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**.

---

## 🖥️ Screenshot Overview

| Page | Description |
|------|-------------|
| `/` | Home — Language selector + Trending banner + Category feed |
| `/article/[id]` | Article detail with full text, share button, related sidebar |
| `/search?q=...` | Real-time search across all 145+ sources |

---

## 🚀 Quick Start

```bash
# 1. Copy env
cp .env.example .env.local

# 2. Edit API URL (point to your running backend)
# NEXT_PUBLIC_API_URL=http://localhost:3001

# 3. Install & run
npm install
npm run dev
# → http://localhost:4000
```

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Images | Next.js `<Image>` (optimized) |
| Dates | date-fns |
| Theme | next-themes (dark/light) |
| Type safety | TypeScript strict |

---

## 🌍 Features

- **10 language feed** — Switch between EN/HI/TE/TA/KN/MR/BN/GU/PA/ML in one click
- **Trending Now carousel** — Horizontally scrollable ranked cards with time-decay scores
- **Category tabs** — Top Stories / India / Business / Technology / Sports / Health / Entertainment
- **Article detail** — Full content, author, relative time, view count, share button
- **Share** — Uses native Web Share API on mobile, clipboard fallback on desktop
- **Dark mode** — Persisted preference, system default
- **SEO** — `generateMetadata()` per article page, Open Graph tags
- **Pagination** — Server-side, linked pages
- **Search** — Full-text across all languages via search-service

---

## 📁 Project Structure

```
web-app/
├── app/
│   ├── layout.tsx          # Root layout: Navbar + Footer + ThemeProvider
│   ├── page.tsx            # Home page (SSR)
│   ├── article/[id]/       # Article detail (SSR + SEO metadata)
│   └── search/             # Client-side search
├── components/
│   ├── Navbar              # Sticky top nav with language switcher
│   ├── ArticleCard         # Feed card + compact variant for sidebar
│   ├── ArticleGrid         # Responsive grid + pagination
│   ├── TrendingBanner      # Horizontal scrollable trending carousel
│   ├── CategoryTabs        # Pill tabs for category filter
│   ├── LanguageSelector    # Language emoji + native name pills
│   ├── Footer              # Links by language + category
│   └── ShareButton         # Native share / clipboard fallback
└── lib/
    ├── api.ts              # All fetch calls to the api-gateway
    └── constants.ts        # Languages, categories, API base URL
```

---

## 🔌 API Dependencies

All calls go through the **api-gateway** (`NEXT_PUBLIC_API_URL`):

| Endpoint | Used For |
|----------|----------|
| `GET /api/v1/feed?language=hi&category=sports` | Feed page |
| `GET /api/v1/feed/trending?language=te&limit=8` | Trending banner |
| `GET /api/v1/articles/:id` | Article detail |
| `GET /api/v1/search?q=...` | Search |

---

## 🐳 Docker

```bash
docker compose -f ../backend/docker-compose.yml up web-app
# → http://localhost:4000
```

