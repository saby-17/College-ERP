# Government College for Women, Karnal ERP - Blueprint MVP

A responsive, interactive staff-web prototype based on the supplied *College Academic & Administration Management System* blueprint. All identities, records and measures are fictional demonstration data.

## Run locally

```powershell
cd college-erp
..\.venv\Scripts\python.exe server.py
```

Then open `http://localhost:8080`.

The local administrator credentials are intentionally not included in the repository. Keep them in your secure deployment records.

## GitHub and deployment

This repository can be published on GitHub for source control. Do not upload the master student CSV, exported spreadsheets, PDFs, local environment files or browser data. The included `.gitignore` keeps these files out of the repository.

GitHub Pages cannot host this application because it cannot run `server.py`, server-side login sessions or PDF parsing. Use GitHub for the code and deploy the same repository to a Python-capable host such as Render, Railway or Fly.io for a live ERP URL.

Before any public deployment, replace the local demo account with secure environment-based credentials and a real identity provider/database. Do not use the included local demo password for a production college system.

## Included prototype flows

- Principal overview, student directory and 14-part student academic file.
- Student search, filters, duplicate roll-number warning, in-session creation and scoped Excel export.
- Attendance roster flow with a recorded demo audit event.
- Assessment register with Draft -> Submitted -> Verified -> Locked transitions.
- Document review queue, metadata-only upload registration and verification transition.
- Fourteen report requests, role/scope reference and in-session audit-history export.
- Admission-sheet and result-sheet CSV imports with templates, preview, header/duplicate/range validation and a confirmation step.
- Communications outbox to prepare targeted SMS, email and in-app notices with an audience and channel record.
- Responsive navigation, keyboard search shortcut and modal focus restoration.

## Blueprint alignment

The client demonstrates the major operating surfaces from the blueprint: stable student identity, semester records, attendance, internal assessment workflows, document/DMC review, faculty monitoring, reporting, role scopes and audit history. [`schema.sql`](schema.sql) is a PostgreSQL starting-point for users and permissions, academic structure, students/admissions, attendance, assessments, documents, faculty activity, notifications and append-only audit events.

## Production boundary

This is a local demonstration environment, not a production ERP or security certification. It includes a server-side session gate and local demo account, but it does not include a production identity provider, database-backed users, MFA, encrypted audit storage or remote deployment controls. Before using real student data, implement the blueprint's NestJS/API, PostgreSQL migrations, SSO/MFA, per-request RBAC and scope checks, private scanned object storage, quarantined XLSX/CSV processing, transactional import batches, consent-aware SMS/email providers, background outbox workers, optimistic revisions, immutable audit destination, backups/restore testing and release gates.
