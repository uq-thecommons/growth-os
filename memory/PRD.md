# thecommons. Growth OS - Product Requirements Document

## Original Problem Statement
Build "thecommons. Growth OS": an internal operations platform for a growth agency plus simplified client portal. Multi-tenant structure with Organization → ClientWorkspaces. RBAC with Admin, Growth Lead, Performance, Creative, Analyst/Ops, Client Viewer roles.

## Architecture Overview
- **Frontend**: React with Tailwind CSS, shadcn/ui components
- **Backend**: FastAPI with Python
- **Database**: MongoDB
- **Authentication**: JWT + Emergent Google OAuth
- **AI**: Claude Sonnet 4.5 (stubbed with mock responses)
- **Integrations**: GA4, Meta Ads, Google Ads (stubbed with mock data)
- **Assets**: Cloudinary (stubbed with local file paths)

## User Personas
1. **Admin**: Org settings, integrations, user management, full access
2. **Growth Lead**: Full workspace access, approves weekly reports
3. **Performance**: Distribution + experiments, read creative library
4. **Creative**: Creative library + pipeline, attach assets to experiments
5. **Analyst/Ops**: Measurement module, reporting drafts, tracking health
6. **Client Viewer**: Client portal only - curated, approved content

## Core Requirements
- Multi-tenant with strict workspace isolation
- RBAC enforcement on server-side
- Audit logging for sensitive actions
- Weekly reporting workflow with AI-drafted narratives
- Flexible activation definitions per client
- Asset management with versioning and rights tracking

---

## What's Been Implemented (v1.0 - Jan 2025)

### ✅ Phase 1: Foundation
- [x] Authentication (Email/Password + Google OAuth)
- [x] Organization and ClientWorkspace models
- [x] User management with role assignments
- [x] RBAC middleware enforcement
- [x] Audit logging for key actions
- [x] Seed data with demo users and workspaces

### ✅ Phase 2: Core Features
- [x] Command Center (all-clients overview)
- [x] Workspace Overview with North Star metric
- [x] Experiments Kanban (Backlog → Ready → Live → Analyzing → Decided)
- [x] Structured hypothesis format
- [x] Decision recording (Kill/Iterate/Scale)
- [x] Funnel Builder with step management
- [x] Activation Definition Builder (single event, sequence, composite)

### ✅ Phase 3: Creative & Distribution
- [x] Creative OS asset library
- [x] Asset tagging (angle, hook, format, ICP, funnel stage)
- [x] Versioning support
- [x] Client visibility toggle
- [x] Rights expiry tracking
- [x] Distribution Hub with channel sync
- [x] Performance metrics display

### ✅ Phase 4: Creator Module
- [x] Creator pipeline (Discovery → Complete)
- [x] Fit scoring and engagement tracking
- [x] Deal management structure
- [x] Creator asset linking

### ✅ Phase 5: Reporting & Client Portal
- [x] Weekly Reports workflow (Draft → Internal Review → Client-ready → Sent)
- [x] AI draft generation (stubbed)
- [x] Report approval flow
- [x] Share link generation
- [x] Client Portal (simplified view)
- [x] "Are we winning?" north star display
- [x] "What did we do/learn/next?" sections

### ✅ Phase 6: Admin & Settings
- [x] Admin user management
- [x] Role assignment UI
- [x] Audit log viewer

---

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Full Cloudinary integration for real file uploads
- [ ] Real GA4 API integration
- [ ] Real Meta Ads API integration
- [ ] Real Google Ads API integration
- [ ] Full Claude AI integration for narrative generation

### P1 - High Priority
- [ ] Experiment variant management UI
- [ ] Asset performance overlay from connected channels
- [ ] Creator deals and invoicing
- [ ] PDF export for weekly reports
- [ ] Email notifications for report status changes

### P2 - Medium Priority
- [ ] Activation flatline alerts (automated)
- [ ] Tracking health monitoring dashboard
- [ ] Changelog timeline visualization
- [ ] Creative brief creation and workflow
- [ ] Asset iteration suggestions from AI

### P3 - Nice to Have
- [ ] Dark/light theme toggle
- [ ] Customizable dashboard widgets
- [ ] Bulk asset upload
- [ ] TikTok Spark Ads integration
- [ ] Mobile-responsive optimizations

---

## Next Tasks
1. Integrate real Cloudinary for asset uploads
2. Set up GA4 OAuth and real data sync
3. Implement Meta Marketing API connection
4. Add Google Ads API integration
5. Connect Claude AI for narrative generation
6. Build experiment variant management
7. Add email notifications via SendGrid

---

## Demo Credentials
- **Admin**: admin@thecommons.io / admin123
- **Growth Lead**: growthld@thecommons.io / growth123
- **Client**: client@acme.com / client123
