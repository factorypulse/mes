# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## Tech Stack

This is a Next.js application with App Router built for a Manufacturing Execution System (MES):

- **Framework**: Next.js with App Router
- **Language**: TypeScript with strict mode enabled
- **Frontend**: React
- **Styling**: Tailwind CSS with shadcn/ui design system
- **Icons**: Lucide React
- **Authentication**: StackAuth with multi-tenancy support
- **Database**: Prisma Postgres
- **Theme**: Light/dark mode support via next-themes

## Architecture

### Authentication & Multi-tenancy
- Uses StackAuth for authentication with team-based multi-tenancy
- Server-side configuration in `stack.tsx` with cookie-based token storage
- After sign-in redirects to `/dashboard`
- Teams/organizations are central to the MES workflow

### Application Structure
- **Landing Page**: `/` - Marketing/intro page with hero, features, pricing
- **Dashboard**: `/dashboard` - Main application entry point
- **Team Dashboard**: `/dashboard/[teamId]` - Team-specific overview with graphs and recent activity
- **Handler**: `/handler/[...stack]` - StackAuth integration endpoints

### Component Architecture
- **UI Components**: Located in `components/ui/` using shadcn/ui patterns
- **Feature Components**: Top-level components for specific features
- **Layout Components**: `sidebar-layout.tsx` for consistent navigation
- **Shared Utilities**: `lib/utils.ts` contains `cn()` function for class merging

### MES Domain Model (Planned)
Based on the specification, this system will implement:
- **Routings**: Define production workflows with sequential operations
- **Orders**: Production orders that follow routings
- **Work Order Operations (WOOs)**: Individual tasks generated from routings
- **Pause Reasons**: Standardized interruption tracking
- **Data Capture**: Flexible input schemas for operator data collection

### Key Features (V1 Scope)
- Multi-tenant MES system for product tracking
- Operator dashboards for work order management
- Timer-based task tracking with pause/resume functionality
- Dynamic data input forms based on JSON schemas
- File attachments for work instructions and operator uploads
- Real-time WIP monitoring and cycle time analysis
- Tablet-friendly interface for shop floor use

## Development Notes

### Path Aliases
- `@/*` maps to the root directory for cleaner imports

### Styling Approach
- Uses Tailwind with CSS variables for theming
- Clean, minimal, modern design with glassmorphism elements
- Bento-style layouts for dashboard components
- Responsive design with tablet optimization

### File Organization
- App Router structure with route groups: `(landing-page)`, `(overview)`
- Server components by default with client components marked explicitly
- Shared components in `/components` with UI primitives in `/components/ui`

### Authentication Flow
- Server-side authentication checks using StackAuth
- Multi-tenant routing with team ID in URLs
- Protected routes require valid team membership
