# 📅 Absolute Timetable

<div align="center">

![Absolute Timetable](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A beautiful, modern daily planner with glassmorphism design, PDF export, and Telegram integration.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Configuration](#-configuration) • [Deployment](#-deployment)

</div>

---

## ✨ Features

### 📱 **Responsive Design**
- **Mobile-First**: Optimized for all screen sizes from 320px to 4K
- **Touch-Optimized**: Large touch targets and smooth animations
- **Adaptive UI**: Collapsible sidebar and mobile drawer navigation
- **Dark Mode**: Beautiful glassmorphism with light/dark theme support

### 🎯 **Time Management**
- **Time Blocks**: Create and manage daily time blocks
- **Quick Add**: Fast task creation with duration presets (15m, 30m, 1h, 2h)
- **Repeat Daily**: Auto-create recurring tasks for each new day
- **Completion Tracking**: Mark tasks complete with visual progress indicators
- **Categories**: Color-coded categories (Work, Personal, Health, etc.)

### 📊 **Analytics & Insights**
- **Week View**: See your entire week at a glance
- **Completion Stats**: Track daily and weekly completion rates
- **Time Analytics**: Visualize how you spend your time
- **Category Breakdown**: See time distribution across categories

### 📄 **PDF Export**
- **Automated Daily Reports**: GitHub Actions cron job sends PDFs at 04:00 Cambodia time
- **Telegram Integration**: Receive daily plans directly in Telegram
- **Manual Export**: Download or send PDFs on-demand
- **A4 Format**: Print-ready with clean, professional layout

### 🔐 **Authentication & Security**
- **Supabase Auth**: Secure email/password authentication
- **Row Level Security**: Database-level access control
- **Protected Routes**: Server-side authentication guards
- **Secure API**: CRON secret and admin UI protection

### 🎨 **Design**
- **Glassmorphism UI**: Modern frosted glass effect
- **Smooth Animations**: 60fps transitions and interactions
- **Gradient Accents**: Beautiful color gradients throughout
- **Loading States**: Skeleton screens and loading indicators
- **Accessibility**: WCAG 2.1 compliant with ARIA labels

---

## 🖼️ Demo

**Production**: [https://timetable-one-azure.vercel.app](https://timetable-one-azure.vercel.app)

### Screenshots

#### Dashboard - Desktop
![Dashboard Desktop](docs/screenshots/dashboard-desktop.png)

#### Dashboard - Mobile
![Dashboard Mobile](docs/screenshots/dashboard-mobile.png)

#### Export Preview
![Export Preview](docs/screenshots/export-preview.png)

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** or **pnpm**
- **Supabase** account (free tier works)
- **Telegram Bot** (optional, for PDF delivery)

### 1. Clone the Repository

```bash
git clone https://github.com/chensakkolmlbb2025-spec/timetable.git
cd timetable
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Telegram (optional)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# Security
CRON_SECRET="your-strong-secret"
ADMIN_UI_SECRET="your-admin-secret"
```

### 4. Set Up Database

Run the database migrations in your Supabase SQL editor:

```bash
# 1. Create tables and RLS policies
cat db/migrations/supabase-schema.sql | pbcopy  # macOS
# or
cat db/migrations/supabase-schema.sql | xclip   # Linux

# Paste into Supabase SQL Editor and execute

# 2. Add repeat_daily column
cat db/migrations/2025-12-14-add-repeat-daily.sql | pbcopy

# 3. Add exports log table
cat db/migrations/2025-12-14-add-exports-log.sql | pbcopy

# 4. Add telegram_response column
cat db/migrations/2025-12-14-add-telegram-response.sql | pbcopy
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## ⚙️ Configuration

### Supabase Setup

1. **Create Project**: Go to [supabase.com](https://supabase.com) and create a new project
2. **Get Credentials**: 
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → Project API keys → anon public
   - Service Role: Settings → API → Project API keys → service_role (keep secure!)
3. **Run Migrations**: Copy SQL from `db/migrations/` and execute in SQL Editor
4. **Enable Email Auth**: Authentication → Providers → Email (enabled by default)

### Telegram Bot Setup (Optional)

1. **Create Bot**:
   ```
   Open Telegram and message @BotFather
   Send: /newbot
   Follow prompts to get your bot token
   ```

2. **Get Chat ID**:
   ```bash
   # Send a message to your bot, then run:
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   
   # Look for "chat":{"id": YOUR_CHAT_ID}
   ```

3. **Test Bot**:
   ```bash
   npm run test:telegram
   ```

### GitHub Actions Cron

The app includes a daily export cron job. To set it up:

1. **Add Repository Secrets**:
   - Go to GitHub → Settings → Secrets and variables → Actions
   - Add secrets:
     - `CRON_TARGET_URL`: Your production URL (e.g., `https://timetable-one-azure.vercel.app`)
     - `CRON_SECRET`: Same as in `.env.local`

2. **Schedule**: Runs daily at 21:00 UTC (04:00 Cambodia time)
3. **Workflow**: See `.github/workflows/daily-telegram-export.yml`

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select "Next.js" framework preset

3. **Add Environment Variables**:
   - Copy all variables from `.env.local`
   - Paste into Vercel → Project Settings → Environment Variables
   - **Important**: Add variables for Production, Preview, and Development

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Visit your production URL

### Build Locally

```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
absolute-timetable/
├── app/                      # Next.js app router pages
│   ├── (auth)/              # Authentication routes
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── reset-password/
│   ├── dashboard/           # Main dashboard
│   ├── week/                # Week view
│   ├── templates/           # Template management
│   ├── analytics/           # Analytics page
│   ├── export/              # PDF export & preview
│   ├── settings/            # User settings
│   ├── api/                 # API routes
│   │   ├── cron/           # Cron endpoints
│   │   ├── export/         # Export endpoints
│   │   ├── telegram/       # Telegram webhook
│   │   └── ...
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                 # UI primitives
│   ├── auth-provider.tsx   # Auth context
│   ├── dashboard-nav.tsx   # Navigation component
│   └── ...
├── lib/                     # Utilities & helpers
│   ├── supabase/           # Supabase clients
│   ├── telegram/           # Telegram integration
│   ├── storage.ts          # Data layer
│   ├── exports.ts          # Export management
│   ├── pdf-export.ts       # PDF generation
│   └── ...
├── db/migrations/           # Database migrations
├── .github/workflows/       # GitHub Actions
├── public/                  # Static assets
└── types/                   # TypeScript types
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React Server Components)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **PDF**: [jsPDF](https://github.com/parallax/jsPDF)
- **Deployment**: [Vercel](https://vercel.com/)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)

---

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed database with test data

# Testing
npm run test:telegram    # Test Telegram bot connection
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Design Inspiration**: Modern glassmorphism UI trends
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Fonts**: [Geist](https://vercel.com/font) by Vercel
- **Deployment**: Powered by [Vercel](https://vercel.com/)

---

## 📧 Contact

**Maintainer**: @chensakkolmlbb2025-spec

**Project Link**: [https://github.com/chensakkolmlbb2025-spec/timetable](https://github.com/chensakkolmlbb2025-spec/timetable)

**Live Demo**: [https://timetable-one-azure.vercel.app](https://timetable-one-azure.vercel.app)

---

<div align="center">

Made with ❤️ using Next.js and Supabase

⭐ Star this repo if you find it helpful!

</div>

## Supabase configuration

This project uses Supabase for authentication and persistent storage. Add the following environment variables to `.env.local` (or your hosting environment). Don't commit `.env.local` to source control — it is included in `.gitignore`.

Required environment variables:

- NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL (example: `https://xyzabc123.supabase.co`).
- NEXT_PUBLIC_SUPABASE_ANON_KEY: The public anon key. This is safe to expose client-side as a `NEXT_PUBLIC_` variable.
- SUPABASE_SERVICE_ROLE_KEY: Optional. Service role key used for admin operations on the server only. Do not expose this to the client.

How to get the keys:

1. Open your Supabase project dashboard.
2. Go to Settings → API.
3. The `Project URL` is your `NEXT_PUBLIC_SUPABASE_URL`.
4. The `anon` (public) key is the `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. The `service_role` key should be used only on the server and set as `SUPABASE_SERVICE_ROLE_KEY` in production.

Example `.env.local` (copy `.env.example` to `.env.local` and fill in values):

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Security note: The service role key has broad permissions (including reading/writing any row). Use it only on trusted server environments. If you need server admin calls while honoring RLS, consider using Supabase server SDKs or the service role key in guarded server endpoints.

## Troubleshooting: "Database error saving new user"

If you encounter a message like "Database error saving new user" during sign up, here are the common causes and steps to fix them:

- RLS (Row Level Security) or missing INSERT/UPDATE policy: Make sure your `profiles` table has a policy that allows authenticated users to create their own profile, or run a server-side creation using the service role key. See `db/supabase-schema.sql` for a sample policy.
- Missing profiles table or trigger: If the `profiles` table hasn't been created or the `handle_new_auth_user` trigger is not present, the client-side upsert may fail. Apply the `db/supabase-schema.sql` script via Supabase SQL Editor or as a migration.
- Upsert attempted before session exists: The Supabase signUp flow may or may not create a session immediately (e.g., when email confirmation is required). The client-side upsert will only be attempted when a session is present. If it fails due to RLS on update, consider using a server-side route that uses the service role key to create the profile.
- Server function permissions: The trigger function `handle_new_auth_user` should be `SECURITY DEFINER` so it can insert profiles irrespective of the caller role. The migration already sets that flag.

If you need help debugging, check the following:

1. Open the Supabase project → Database → Table Editor and verify `public.profiles` exists.
2. Check the project's Row Level Security policies under Database → Policies for `public.profiles`.
3. Confirm the `auth.users` trigger exists and the `public.handle_new_auth_user` function is set to `SECURITY DEFINER`.
4. Check the browser console and server logs for specific error messages returned by Supabase; those often point to 'permission denied' or 'relation does not exist'.

If you'd like, I can add a server endpoint that creates the profile with the service role key (secure server-only route), or add more resilient client-side fallback logic.

Note: This project includes a secure fallback route accessible at `/api/profiles/upsert` that uses the `SUPABASE_SERVICE_ROLE_KEY` to upsert a `profiles` row if client-side upsert fails due to RLS. The route requires the user's `access_token` in the `x-supabase-access-token` header and will validate the token corresponds to the user id before performing the admin upsert.


# AbsoluteTimetable
# AbsoluteTimetable
