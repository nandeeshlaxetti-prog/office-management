# Office Management

A comprehensive office and legal practice management system built with Next.js, TypeScript, and modern web technologies.

## 🚀 Features

- **Case Management**: Track and manage legal cases with CNR lookup
- **Task Management**: Kanban board for task organization
- **Client Management**: Comprehensive client database
- **Project Management**: Track legal projects and deadlines
- **Team Management**: Manage team members and roles
- **Court Integration**: eCourts API integration for case data
- **Dashboard**: Real-time overview of your legal practice

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Database**: SQLite (with Prisma)
- **Deployment**: Vercel

## 📦 Project Structure

```
├── apps/
│   ├── web/                 # Next.js web application
│   └── desktop/             # Electron desktop app
├── packages/
│   ├── core/               # Core business logic
│   ├── data/               # Database and repositories
│   └── jobs/               # Background job processing
└── tests/                  # E2E tests
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd office-management
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev:web
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set the **Root Directory** to `apps/web`
4. Deploy!

### Environment Variables

Set these in your Vercel dashboard:

- `NODE_ENV` = `production`
- `APP_MODE` = `web`
- `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
- `NEXT_PUBLIC_APP_NAME` = `Office Management`

## 📝 Available Scripts

- `pnpm dev` - Start both web and desktop apps
- `pnpm dev:web` - Start web app only
- `pnpm build:web` - Build web app for production
- `pnpm type-check` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm test:e2e` - Run end-to-end tests

## 🔧 Configuration

The application uses environment variables for configuration. Copy `apps/web/env.example` to `apps/web/.env.local` and modify as needed.

## 📚 Documentation

- [Cases System](./apps/web/CASES_SYSTEM_DOCUMENTATION.md)
- [Tasks System](./apps/web/TASKS_SYSTEM_DOCUMENTATION.md)
- [Dashboard](./apps/web/DASHBOARD_DOCUMENTATION.md)
- [eCourts Integration](./apps/web/ECOURTS_INTEGRATION_DOCUMENTATION.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue on GitHub.