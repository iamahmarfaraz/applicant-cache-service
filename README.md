
# Application Cache Service

## Purpose
Node.js backend-only service that maintains an **in-memory cache of applicant data** per tenant to eliminate heavy MySQL reads.

## Core Design
- Token-based tenant isolation
- Background cron-based DB sync
- Cursor pagination from memory
- Incremental sync using lastSyncTime
- No Redis (explicit requirement)

## Request Flow
1. Frontend calls `/api/applicants` with Authorization token
2. Token identifies tenant
3. Cache initializes if missing
4. Cron job fetches DB data in batches of 1000
5. API responds immediately from memory (paginated)

## Folder Responsibilities
- `routes/` – API endpoints
- `controllers/` – request orchestration
- `services/` – DB & stored procedure calls
- `cache/` – in-memory tenant cache
- `cron/` – background synchronization
- `db/` – MySQL pool

## Why Map + Array
- Map → O(1) update by alertId
- Array → ordered pagination

## Cron Sync
- Uses node-cron
- Prevents request timeout
- Runs until <1000 rows fetched

## Memory Safety
- lastAccessedAt per tenant
- Inactive tenant eviction (planned)

## Status
Ready for frontend integration & UAT.
