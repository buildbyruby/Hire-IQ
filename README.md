# SmartHR — AI-Powered Recruitment & Workforce Management

SmartHR is a full-stack HR platform that screens resumes using AI and manages a live employee directory.

## What it does

- Resume Analysis — upload a PDF, select a job, get an instant AI ATS score (0-100) with strengths, weaknesses, and suggestions.
- HR Dashboard — live employee directory with clock in/out tracking, search, edit and delete.
- Manage Records — create job postings and onboard new employees.

## Why I built it this way

Most student HR projects stop at basic create/read/update/delete with no intelligence layer. I wanted an AI that actually reasons about a resume against a specific job, not just keyword matching. I also chose one full-stack framework (Next.js) instead of separate frontend and backend projects, so everything runs from one command.

## Tech stack

- Next.js 15 (App Router) — one project for frontend and backend
- TypeScript — catches errors before runtime
- Tailwind CSS — consistent design system
- Supabase (PostgreSQL) — production-grade database
- Prisma — type-safe database queries
- Groq (Llama 3.3 70B) — free AI engine, no daily quota
- pdf2json — extracts resume text server-side
- Sonner — toast notifications
- Vercel — hosting and deployment

## Database schema

Department has many Jobs and many Employees.
Employee has many PerformanceLogs and many AttendanceLogs.

## Getting started locally

git clone https://github.com/ruby14-bit/smart-hr-analyzer.git
cd smart-hr-analyzer
npm install
npx prisma db push
npm run dev

## Roadmap

- Analysis history
- Candidate comparison
- Analytics dashboard
- Authenticated multi-user accounts

Built as a final-year project, designed to function as a genuine product.
