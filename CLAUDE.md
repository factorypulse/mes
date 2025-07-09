# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Manufacturing Execution System (MES) focused on product tracking, Work-In-Progress (WIP) monitoring, and operational status management. The project is currently in the planning phase with comprehensive specifications but no implementation yet.

## Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19
- **Backend**: Next.js 15 API routes (Node.js)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: BetterAuth (complete docs in `better_auth_docs.txt`)
- **UI Framework**: shadcn/ui design system
- **Icons**: Lucide
- **Styling**: Tailwind CSS 4
- **Background Jobs**: BullMQ with Redis

## Key Documentation Files

- **`spec.md`**: Comprehensive product specification (19,768 bytes) - contains detailed user stories, data models, API endpoints, and technical implementation guidelines
- **`UI.md`**: UI design guidelines including glassmorphism styling, bento concept, and accessibility requirements
- **`stack.md`**: Technology stack overview and UI vibe specifications
- **`better_auth_docs.txt`**: Complete BetterAuth documentation for authentication implementation

## High-Level Architecture

The system is designed with these core modules:

1. **Routings Management**: Production paths and operations definition
2. **Order Management**: Production order creation and tracking
3. **Work Order Operations (WOO)**: Individual operational steps
4. **Operator Workflow**: Shop floor operator interface
5. **Pause Reason Management**: Standardized interruption tracking
6. **Reporting & Analytics**: Performance insights and dashboards

## Data Models

Core database tables to implement:
- `mes_routings`: Production routing definitions
- `mes_routing_operations`: Individual operation steps
- `mes_orders`: Production orders
- `mes_work_order_operations`: Work order operations (WOOs)
- `mes_pause_reasons`: Standardized pause reasons

Integration with existing `Account`, `User`, and `Org` models for multi-tenant support.

## Development Setup (To Be Implemented)

When implementing this project:

1. Initialize Next.js 15 project with App Router
2. Configure PostgreSQL database
3. Set up Redis for caching and background jobs
4. Implement BetterAuth for authentication
5. Install and configure shadcn/ui components
6. Set up Tailwind CSS 4

## Implementation Guidelines

- Follow role-based access control patterns defined in `spec.md`
- Implement multi-tenant architecture with account-based data isolation
- Use glassmorphism UI design as specified in `UI.md`
- Start implementation with Routings Management module
- Ensure all components support light/dark mode
- Follow accessibility guidelines outlined in UI documentation

## Code Organization

Expected structure when implemented:
- `/app`: Next.js App Router pages and API routes
- `/components`: Reusable React components using shadcn/ui
- `/lib`: Utility functions and database connections
- `/types`: TypeScript type definitions
- `/hooks`: Custom React hooks
- `/middleware`: Authentication and authorization middleware

## Important Notes

- This is a documentation-only project currently - no source code exists yet
- All user stories and requirements are thoroughly documented in `spec.md`
- BetterAuth complete documentation is available locally in `better_auth_docs.txt`
- UI guidelines emphasize clean, minimal, modern design with glassmorphism effects
- System designed for manufacturing environments with real-time operational tracking