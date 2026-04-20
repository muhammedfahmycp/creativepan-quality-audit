# Creative Pan Quality Audit System

## Overview
Standalone quality audit system for Creative Pan F&B brands (Vasko, Desoky & Soda, Hameed, Dukes). Auditors visit branches, fill checklists with Yes/No/N/A + mandatory photos, submit for manager review. Approved scores feed into the KPI system's `quality_audit` achievement via API.

## Status
- **Database**: Schema already in place in shared Supabase. Real data exists (4 brands, 3 audits, 44 responses, 9 photos, 1 role). DO NOT recreate tables.
- **Backend**: Scaffold only — `backend/src/index.js` has Express + health check. No routes, no Supabase client wired, no auth.
- **Frontend**: Exists (Tailwind) from earlier build — MUST BE REBUILT with KPI design language (CSS variables, DM Sans/Inter, inline styles, NO Tailwind). Old code is useful as reference for API shape and page structure.
- **Untracked**: `vasko-kpi/` folder inside this repo is leftover from a mis-clone; safe to delete.

## Architecture

### Deployment
- **Backend**: Separate Railway service (NOT in the KPI backend)
- **Frontend**: Separate Cloudflare Pages deploy
- **Database**: Shared Supabase instance (same as KPI)
- **Photo Storage**: Supabase Storage bucket `qa-photos` (private)

### Shared with KPI
- `branches` table (read-only)
- `areas` table (read-only)
- On audit approval → POST to KPI `/api/achievements/store` with `QA_TO_KPI_API_KEY`

### NOT shared with KPI
- **Users are fully separate.** QA has its own `qa_users` table. A person who uses both systems exists as two independent rows (same email, different UUIDs). Both systems gate Google OAuth to `@creativepan.com.eg` but maintain their own user lists. Rationale: quality auditors may not be KPI users, and vice versa; permissions must not bleed across.

### DO NOT touch KPI code
The KPI system repo is `vasko-kpi` (stable tag `stable-2026-04-19`). This system only interacts with KPI via:
1. Reading `users`, `branches`, `areas` tables from shared Supabase
2. POST to KPI's `/api/achievements/store` on audit approval

## Tech Stack
- **Backend**: Node 18+, Express 4, `@supabase/supabase-js`, `google-auth-library`, `jsonwebtoken`, `multer`, `winston`, `helmet`, `morgan`
- **Frontend**: React 18 + Vite — MUST use KPI design language:
  - CSS variables from KPI's `frontend/src/index.css` (primary `#2F368E`, etc.)
  - Fonts: DM Sans (UI), Inter with tabular-nums (numbers)
  - Inline styles, NO Tailwind
  - Same border radius, shadows, card patterns as KPI
- **Auth**: Google OAuth (`@creativepan.com.eg`) — reuses KPI's OAuth client ID
- **Mobile-first**: tablets and phones are primary devices

## Actual Database Schema (DO NOT change without migration)

### `qa_brands` (4 rows)
```
id UUID PK
name TEXT              -- e.g. "Vasko"
slug TEXT              -- e.g. "vasko" (used in URLs)
color TEXT             -- hex, e.g. "#C9A84C"
sort_order INT
created_at, updated_at
```
Current brands: Vasko, Desoky & Soda, Hameed, Dukes.

### `qa_form_templates` (4 rows)
```
id UUID PK
brand_id UUID → qa_brands.id
version INT
is_current BOOL        -- only one per brand should be true
published_at TIMESTAMPTZ
published_by UUID → users.id (nullable)
created_at, updated_at
```
No `name` field — templates are identified by brand + version.

### `qa_form_sections` (3 rows)
```
id UUID PK
template_id UUID → qa_form_templates.id
title TEXT
sort_order INT
created_at, updated_at
```

### `qa_form_points` (22 rows)
```
id UUID PK
section_id UUID → qa_form_sections.id
description TEXT
max_score INT          -- weight / max points
sort_order INT
created_at, updated_at
```

### `qa_audits` (3 rows)
```
id UUID PK
branch_id UUID → branches.id
brand_id UUID → qa_brands.id
template_id UUID → qa_form_templates.id   -- snapshot of template used
month TEXT             -- "YYYY-MM"
status TEXT            -- seen: 'submitted', 'approved'
                       -- full set: not_started, in_progress, submitted, edits_requested, approved
auditor_id UUID → users.id
auditor_name TEXT      -- denormalized snapshot
total_max_score INT
total_awarded_score INT
score_percentage NUMERIC
manager_comments TEXT  -- review comment from manager
reviewed_by UUID → users.id (nullable)
started_at, submitted_at, approved_at, edit_requested_at TIMESTAMPTZ
created_at, updated_at
```
Note: no `store_manager_name` column yet. If the form captures it, it lives in `manager_comments` or needs a migration.

### `qa_audit_responses` (44 rows) — the answer table
```
id UUID PK
audit_id UUID → qa_audits.id
point_id UUID → qa_form_points.id
is_applicable BOOL     -- false = N/A
awarded_score INT      -- nullable
max_score_snapshot INT -- copy of point.max_score at answer time
comments TEXT
created_at, updated_at
```
Encoding:
- `is_applicable=false` → N/A (excluded from denominator)
- `is_applicable=true, awarded_score=max_score_snapshot` → Yes
- `is_applicable=true, awarded_score=0` → No
- `awarded_score=null` while `is_applicable=true` → unanswered

### `qa_audit_photos` (9 rows)
```
id UUID PK
response_id UUID → qa_audit_responses.id
audit_id UUID → qa_audits.id
storage_path TEXT      -- path within qa-photos bucket
file_name TEXT
file_size_bytes INT
mime_type TEXT
uploaded_by UUID → users.id
created_at
```

### `qa_users` — standalone, NOT shared with KPI
```
id UUID PK (default gen_random_uuid)
email TEXT UNIQUE NOT NULL   -- checked to end with @creativepan.com.eg
name TEXT NOT NULL
google_id TEXT UNIQUE        -- filled on first Google OAuth login
avatar_url TEXT
role TEXT NOT NULL           -- 'top_management' | 'quality_manager' | 'quality_auditor'
is_active BOOLEAN NOT NULL DEFAULT true
created_at, updated_at       -- updated_at auto-maintained via trigger
```
Bootstrap admin: `mohamed.fahmy@creativepan.com.eg` (top_management).

FKs pointing here:
- `qa_audits.auditor_id` (RESTRICT), `qa_audits.reviewed_by` (SET NULL)
- `qa_audit_photos.uploaded_by` (RESTRICT)
- `qa_form_templates.published_by` (SET NULL)

### Shared tables (owned by KPI, read-only here)
- `branches` — id, name, email, area_id, foodics_branch_id, is_active
- `areas` — id, name, operations_manager_id, area_manager_id

KPI's `users` table is NOT referenced by QA.

## User Roles & Permissions

Roles are stored in `qa_user_roles.role`. Possible values:
- `top_management`
- `quality_manager`
- `quality_auditor`

| Action | Top Mgmt | Quality Manager | Quality Auditor |
|---|---|---|---|
| View all brands/branches | Yes | Yes | Yes |
| Start/claim an audit | No | No | Yes |
| Fill audit form + photos | No | No | Yes |
| Submit for review | No | No | Yes |
| Review & request edits | No | Yes | No |
| Approve audit | No | Yes | No |
| Build/edit templates | Yes | Yes | No |
| Manage users/roles | Yes | No | No |

## Audit Workflow
1. Branch card shows "Not Started" → Auditor taps "Start" → `qa_audits` row created with status `in_progress`, `started_at` set
2. Status `in_progress` — only the claiming auditor sees the form
3. Auditor fills each point (Yes/No/NA + optional comment + camera photo)
4. On "Submit for Review" → status `submitted`, `submitted_at` set
5. Quality Manager reviews → **Approve** or **Request Edits** (with comment)
6. If edits requested → status `edits_requested`, `edit_requested_at` set; auditor fixes and resubmits
7. On Approve → `score_percentage` calculated and stored, `approved_at` set → POST to KPI

## Scoring Formula
```
awarded = SUM(qa_audit_responses.awarded_score WHERE is_applicable)
max_applicable = SUM(qa_audit_responses.max_score_snapshot WHERE is_applicable)
score_percentage = (awarded / max_applicable) * 100
```

## Pages (Mobile-First)
1. **Login** — Google OAuth
2. **Brand Dashboard** (`/:brandSlug`) — branch cards grid with current-month status pills
3. **Branch Detail** (`/:brandSlug/:branchId`) — 12-month summary + month cards
4. **Audit Form** (`/:brandSlug/:branchId/audit/:month`) — mobile-first form with camera + autosave
5. **Review Page** — manager reviews submitted audits
6. **Template Builder** (Settings) — sections + points CRUD per brand
7. **User Management** — top management only

## Photo Requirements
- Camera only: `<input type="file" accept="image/*" capture="environment">`
- No gallery uploads
- Stored in Supabase Storage bucket `qa-photos`
- Path: `{audit_id}/{response_id}_{timestamp}.jpg` (matches existing `storage_path` format)

## KPI Integration
On audit approval, POST to:
```
POST https://vasko-kpi-production.up.railway.app/api/achievements/store
Authorization: Bearer $QA_TO_KPI_API_KEY
{
  branch_id, month, kpi_id: <quality_audit_kpi_id>,
  actual_value: score_percentage,
  data_source: 'quality_audit'
}
```
Uses env var `QA_TO_KPI_API_KEY`. **Verify this endpoint exists on KPI side before shipping approval flow** — add it there if missing (additive, low risk).

## Build Order
1. ~~Verify DB schema~~ ✅ done — schema aligned above
2. Backend: Supabase client + logger + env validation
3. Backend: Google OAuth login route → JWT issuance (reads `users` + `qa_user_roles`)
4. Backend: Auth middleware + role guards
5. Backend: Read-only routes (brands, branches, areas, current template for brand)
6. Backend: Audit CRUD (start, save response, upload photo, submit, review, approve)
7. Backend: Template Builder routes (sections + points CRUD)
8. Frontend: Rebuild with KPI design tokens (index.css, fonts, CSS variables)
9. Frontend: Login + AuthContext
10. Frontend: Brand Dashboard + Branch Detail
11. Frontend: Audit Form (camera, autosave)
12. Frontend: Review + Approve
13. Frontend: Template Builder + User Management
14. KPI integration: verify/add `/api/achievements/store` on KPI, wire POST on approval
15. Polish + mobile QA on real devices

## Existing Frontend Reference
The Tailwind frontend in `src/` has:
- Pages: `AuditFormPage`, `AuditHistoryPage`, `BranchListPage`, `BranchSummaryPage`, `BrandTabs`, `Login`, `ProfilePage`, and settings pages
- API client at `src/utils/api.js` — mine this for endpoint names/shapes that match the existing DB schema
- Contexts: `AuthContext`, `ToastContext`
- Uses Tailwind — **do not copy styles**, only data flow and API shape

## Related
- KPI System repo: `vasko-kpi` (github.com/muhammedfahmycp/vasko-kpi)
- KPI stable tag: `stable-2026-04-19` — rollback point if anything breaks
- KPI's CLAUDE.md has full context on the KPI side
