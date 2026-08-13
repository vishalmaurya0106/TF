# Web App — Data Persistence & Database Safety Master Rules

All code modifications and feature updates in this repository must strictly adhere to the following data safety and database preservation rules.

## 1. Zero Data Loss Policy (Existing Data Preservation)
* Never delete or overwrite existing user/production data during code updates, deployments, restarts, rebuilds, or redeployments.
* Never reset, truncate, drop, or clear database tables or records automatically.
* Never execute `DELETE`, `TRUNCATE`, `DROP TABLE`, or destructive schema changes without explicit user authorization.
* Browser cache, cookie, or local storage clears must never trigger database record deletion.

## 2. Permanent Persistent Storage
* Core domain entities and application state must be stored in a persistent server-side database.
* LocalStorage, SessionStorage, cookies, and temporary memory are for transient UI/session preferences only—never as the sole store for critical records.
* Maintain backward compatibility and preserve all existing database tables, columns, and records.

## 3. Code Change & Refactoring Guidelines
1. Analyze existing project code and database connections before making changes.
2. Preserve existing database schema, column types, and data relations.
3. Modify only the required components/endpoints; do not touch unrelated logic or UI without user request.
4. Keep existing API endpoints intact to prevent breaking changes.
5. Apply schema additions using non-destructive, idempotent migration patterns (e.g. `ADD COLUMN IF NOT EXISTS` with safe default or nullable values).

## 4. Migration & Schema Safety
* Always add new columns as optional/nullable or with explicit default values.
* Recreating tables or dropping columns is strictly forbidden.
* Migrations must be idempotent so re-running them never causes duplicate key errors or data loss.

## 5. Deployment & Runtime Security
* Deployments, rebuilds, container restarts, or environment variable updates must not wipe database storage.
* Database credentials must be secured via environment variables and never exposed to client-side bundles.
* Maintain a clean separation between development/seed data and persistent user production data.
