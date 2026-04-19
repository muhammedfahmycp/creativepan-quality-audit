# Vasko Quality Audit System

## Overview
Standalone quality audit system for Creative Pan F&B brands. Auditors visit branches, fill checklists with Yes/No/N/A + mandatory photos, submit for manager review. Approved scores feed into the KPI system's quality_audit achievement.

## Status
- **Frontend**: Exists from prior build (React + Tailwind). NEEDS TO BE REBUILT with KPI system's design (CSS variables, DM Sans/Inter fonts, inline styles — NO Tailwind).
- **Backend**: Needs to be built as a SEPARATE Express service (NOT in the KPI backend).
- **Database**: Tables may already exist in Supabase from prior attempt (`qa_*` prefix). Check before creating.
- **Old frontend code**: in this repo's git history — useful as reference for page structure and API surface.

## Architecture

### Deployment
- **Backend**: Separate Railway service (same Hobby plan project as KPI)
- **Frontend**: Separate Cloudflare Pages deploy
- **Database**: Same Supabase instance as KPI system
- **Photo Storage**: Supabase Storage bucket `qa-photos`

### Shared with KPI System
- `branches` table (read-only from QA side)
- On audit approval → POST to KPI API to update quality_audit achievement

### DO NOT touch KPI code
The KPI system repo is `vasko-kpi`. This system only interacts via:
1. Reading `branches` table from shared Supabase
2. POST to KPI's `/api/achievements/store` endpoint on audit approval

## Tech Stack
- Backend: Node.js/Express
- Frontend: React (Vite) — MUST use KPI system's design language:
  - CSS variables from KPI's index.css (--color-primary: #2F368E, etc.)
  - Fonts: DM Sans (UI), Inter with tabular-nums (numbers)
  - Inline styles, no Tailwind
  - Same border radius, shadows, card patterns
- Auth: Google OAuth (@creativepan.com.eg) with SEPARATE user table (qa_users)
- Mobile-first design (tablets and phones are primary devices)

## Database Tables (qa_ prefix)

Check if these exist before creating:

```sql
qa_users (id, email, name, role, google_id, avatar_url, is_active, created_at)
  -- roles: top_management, quality_manager, auditor

qa_brands (id, name, slug, is_active, created_at)
  -- Start with Vasko only

qa_templates (id, brand_id, name, is_active, created_at, updated_at)

qa_sections (id, template_id, title, display_order, created_at)

qa_points (id, section_id, description, max_score/weight, display_order, created_at)

qa_audits (id, brand_id, branch_id, month, auditor_id, store_manager_name,
           status, total_score, total_weight, achieved_pct,
           started_at, submitted_at, approved_at,
           reviewer_id, review_comment, created_at, updated_at)
  -- statuses: not_started, in_progress, submitted, edits_requested, approved

qa_responses (id, audit_id, point_id, response, comment, created_at, updated_at)
  -- response: yes, no, na

qa_photos (id, response_id, url, created_at)
```

## User Roles & Permissions

| Action | Top Management | Quality Manager | Auditor |
|---|---|---|---|
| View all brands/branches | Yes | Yes | Yes |
| Start/claim an audit | No | No | Yes |
| Fill audit form + photos | No | No | Yes |
| Submit for review | No | No | Yes |
| Review & request edits | No | Yes | No |
| Approve audit | No | Yes | No |
| Build/edit templates | Yes | Yes | No |
| Manage users | Yes | No | No |

## Audit Workflow
1. Branch card shows "Not Started" → Auditor clicks "Start" → claims it
2. Status → "In Progress" — only claiming auditor sees it
3. Auditor fills all points (Yes/No/NA + comment + camera photo each)
4. Auditor enters store manager name at top
5. Clicks "Submit for Review" → Status: "Submitted"
6. Quality Manager reviews → "Approve" or "Request Edits" (with comment)
7. If edits requested → Status: "Edits Requested" → auditor fixes → resubmit
8. On "Approve" → calculate score → store → POST to KPI system

## Scoring Formula
```
awarded = sum of max_score for all YES points
total_applicable = total_weight - sum of max_score for N/A points
achieved_pct = (awarded / total_applicable) × 100
```

## Pages (Mobile-First)
1. Login — Google OAuth
2. Brand Dashboard (/vasko) — branch cards grid with status pills
3. Branch Detail (/vasko/:branchId) — 12-month summary + month cards
4. Audit Form (/vasko/:branchId/audit/:month) — the core mobile form
5. Review Page — manager reviews submitted audits
6. Template Builder (Settings) — sections + points CRUD
7. User Management — top management only

## Photo Requirements
- Camera only: `<input type="file" accept="image/*" capture="environment">`
- No gallery uploads
- Stored in Supabase Storage bucket
- Each photo: {audit_id}/{response_id}_{timestamp}.jpg

## KPI Integration
On approval, POST to:
```
POST https://vasko-kpi-production.up.railway.app/api/achievements/store
{
  branch_id, month, kpi_id: <quality_audit_kpi_id>,
  actual_value: achieved_pct, data_source: 'quality_audit'
}
```
Uses a service API key (env var QA_TO_KPI_API_KEY).

## Build Order
1. Check/create database tables
2. Backend scaffold (Express + Supabase + auth)
3. Auth flow (Google OAuth → qa_users)
4. Template Builder (sections + points CRUD)
5. Brand Dashboard (branch cards with status)
6. Audit Form (mobile-first, camera, autosave)
7. Review Flow (submit → review → approve/reject)
8. Branch Detail (monthly summary + month cards)
9. KPI Integration (POST on approval)
10. Polish (responsive, animations)

## Existing Frontend Reference
The old frontend in this repo's git history (pre-rebuild) has:
- Page structure: AuditFormPage, BranchListPage, BranchSummaryPage, etc.
- Full API client with all endpoints defined
- Uses Tailwind (MUST be replaced with KPI-style CSS variables)
- Useful for understanding the data flow, NOT for copying styles

## Related
- KPI System repo: vasko-kpi (github.com/muhammedfahmycp/vasko-kpi)
- KPI CLAUDE.md has full context on the KPI side
