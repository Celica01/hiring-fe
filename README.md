# Hiring App Frontend

A modern hiring management application built with Next.js 15, TypeScript, and Shadcn/ui components.

## Features

- 📊 **Dashboard** - Overview of jobs and candidates with key statistics
- 💼 **Job Management** - Create, view, and manage job postings
- 👥 **Candidate Management** - View and manage candidate applications
- 📝 **Application Form** - Dynamic form generation based on job configuration
- 🎨 **Modern UI** - Built with Shadcn/ui components and Tailwind CSS
- 🔒 **Type Safety** - Full TypeScript support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Configuration

Make sure your backend API is running on `http://localhost:3000` and provides the following endpoints:

- `GET /jobs` - List all jobs
- `POST /jobs` - Create a new job
- `GET /candidates` - List all candidates  
- `POST /candidates` - Create a new candidate
- `GET /job-config` - Get job configuration

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── apply/[slug]/      # Job application pages
│   ├── candidates/        # Candidate management
│   ├── jobs/              # Job management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard
├── components/
│   ├── layout/            # Layout components
│   └── ui/                # Shadcn/ui components
├── lib/
│   ├── api.ts             # API client
│   └── utils.ts           # Utility functions
└── types/
    └── index.ts           # TypeScript definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Components

### Dashboard
- Overview statistics for jobs and candidates
- Quick access to recent jobs and candidates
- Direct links to job applications

### Job Management
- List all job postings
- Create new jobs with salary ranges
- Auto-generate URL slugs
- Status management (Active, Inactive, Draft)

### Candidate Management
- View all candidate applications
- Display candidate contact information and profiles
- Tabular view with actions

### Application Form
- Dynamic form generation based on job configuration
- File upload support for profile photos
- Form validation and error handling
- Success page after submission

## API Integration

The frontend integrates with the backend API using a centralized API client (`src/lib/api.ts`). All API calls include error handling and loading states.

## Styling

The application uses Shadcn/ui components built on top of Radix UI primitives and styled with Tailwind CSS. The design system provides:

- Consistent spacing and typography
- Dark/light mode support
- Responsive design
- Accessible components
