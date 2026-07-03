# Strauss Daly Contract Management System Security Overview

Document date: 2026-06-25  
Application: Strauss Daly Contract Management System  
Repository reviewed: `/var/www/React_Projects/strauss-daly-contract-tracker`

## 1. Document Intent

This document describes the Strauss Daly Contract Management System as it is currently implemented in the reviewed codebase. It is written to support infrastructure and cybersecurity reporting and should be read as a current-state application security overview.

This document is structured into:

- application description
- features currently implemented in the system
- security controls currently present in the system
- current security limitations and risks
- recommendations
- suggested future security feature implementations

## 2. Application Description

The Strauss Daly Contract Management System is an internal web-based contract administration platform used to manage contract records and supporting administrative data.

The system currently supports:

- contract listing, creation, editing, viewing, deletion, import, and export
- contract metadata management including:
  - title
  - counterparty
  - department
  - contract type
  - category
  - portfolio
  - start date
  - review date
  - end date
  - value
  - tags
  - description
- contract notification configuration including:
  - configurable alert deadlines
  - multiple notification emails per contract
  - multiple notification phone numbers per contract
- user management
- department management
- notification center configuration
- notification log viewing
- audit log visibility
- system settings management

## 3. Technology Overview

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- `xlsx` library for Excel import/export

### Backend

- Laravel 13
- PHP 8.3
- SQLite by default in development

### Deployment Model

The application supports:

- React frontend served through Vite during development
- React frontend built into `backend/public/` and served by Laravel in integrated deployments

## 4. Features Currently Implemented

### 4.1 Contract Management

The current contract module includes:

- contract repository list
- clickable contract rows opening a detailed contract view
- contract detail page
- create contract form
- edit contract form
- delete contract action
- support for optional `Review Date`
- support for optional `End Date`
- support for multiple per-contract notification emails
- support for multiple per-contract notification phones
- support for dynamic alert deadline values

### 4.2 Contract Excel Export and Import

The current system can export contract data to Excel and import the same structure back into the system.

The export/import currently includes:

- `Contract ID`
- `Contract Title`
- `Counterparty`
- `Department`
- `Type`
- `Category`
- `Portfolio`
- `Status`
- `Start Date`
- `Review Date`
- `End Date`
- `Duration`
- `Value`
- `Description`
- `Tags`
- alert deadline columns
- contract-level notification email columns
- contract-level notification phone columns
- global notification recipient columns

The import process currently:

- validates required data
- maps department names to existing system departments
- prevents obvious duplicates using `Contract Title + Counterparty`
- uses `Contract ID` as a fallback identifier

### 4.3 Notifications

The current notification module includes:

- system-level channel toggles for Email, SMS, and WhatsApp
- default recipient management
- notification history viewing
- test notification logging
- scheduled expiry reminder logic

### 4.4 User Management

The current user module includes:

- user list
- user create flow
- user edit flow
- user activate / deactivate
- user delete flow

Important current-state note:

- the operational UI for creating users does not currently collect a password field
- the backend creates a password automatically if one is not supplied

### 4.5 Settings and Audit

The current system includes:

- system settings page
- category management
- basic security-related toggles in UI
- audit log viewing

## 5. Security Controls Currently Present In The System

This section describes controls that are currently implemented and observable in the reviewed code.

### 5.1 Backend Input Validation

Laravel validation is currently used for multiple API endpoints.

Observed validation coverage includes:

- required field enforcement
- type validation
- email validation
- max length checks
- numeric minimums
- array validation
- allowed enum-style values in some areas
- foreign key existence checks such as `department_id`

This currently helps protect business-data integrity and reduces malformed input acceptance.

### 5.2 Password Hashing For Backend-Stored Users

The Laravel `User` model currently uses Laravel’s password hashing cast.

Current effect:

- stored passwords are not persisted in plaintext
- backend user password storage benefits from Laravel hashing behavior

### 5.3 Sensitive User Field Hiding

The following user fields are currently hidden from serialized output:

- `password`
- `remember_token`

This helps reduce accidental disclosure in standard JSON responses.

### 5.4 Application Encryption Capability

Laravel application encryption is configured with:

- cipher: `AES-256-CBC`
- key source: `APP_KEY`

This confirms that Laravel’s built-in encryption services are available in the application stack.

Important clarification:

- this does not mean all contract or user business data is currently encrypted field-by-field
- it confirms the framework encryption capability is configured

### 5.5 CORS Restriction

The backend CORS configuration is restricted to the configured frontend origin rather than allowing unrestricted origins.

Current control:

- `allowed_origins` is based on `FRONTEND_URL`

This is a positive browser-facing control for same-application integration.

### 5.6 Audit Logging

The system currently records audit entries for key administrative actions, including:

- contract creation
- contract updates
- contract deletion
- user creation
- user updates
- user deletion
- notification settings updates
- test notification activity
- scheduled contract notification sends

This supports accountability, troubleshooting, and post-event review.

### 5.7 Notification De-Duplication

The scheduled notification process currently prevents duplicate logs for the same:

- contract
- trigger day
- notification type
- recipient

This reduces repeat-message noise caused by repeated scheduled execution.

### 5.8 Contract Data Integrity Alignment

The frontend and backend currently align on important contract fields including:

- start date
- review date
- optional end date
- dynamic notification day windows
- multi-email notifications
- multi-phone notifications

This is relevant from a security and operational perspective because it reduces silent data loss and inconsistent state.

### 5.9 Excel Import Validation Controls

The contract Excel import flow currently includes:

- row parsing and normalization
- required-field checks
- department name matching
- duplicate-reduction logic
- row-level import error handling

This helps reduce accidental bad data ingestion.

## 6. Security Measures Present But Limited In Scope

The following items exist in some form, but should not be overstated as mature security controls.

### 6.1 UI-Level Role Handling

The frontend carries role information such as:

- Admin
- Manager
- Viewer

However:

- this is currently primarily a UI behavior concern
- it is not a substitute for backend authorization enforcement

### 6.2 Two-Factor Authentication Toggle In Settings

The settings UI includes a two-factor authentication toggle.

However:

- there is no reviewed end-to-end MFA implementation
- the presence of the toggle should not be described as deployed MFA

### 6.3 Session Timeout Toggle In Settings

The settings UI includes a session timeout toggle.

However:

- no end-to-end enforced session timeout behavior was confirmed in the reviewed authentication flow

## 7. Current Security Limitations And Risks

This section documents what is currently missing or weak in the present implementation.

### 7.1 Authentication Is Currently Mock / Demo Style

The login flow currently:

- uses hardcoded sample users in the frontend
- uses a shared demonstration password `password123`
- stores login state in `localStorage`
- does not validate credentials against the Laravel backend

Current implication:

- authentication is not currently a strong security boundary

### 7.2 API Authorization Is Not Clearly Enforced

The reviewed API routes do not show visible authentication or role middleware for business endpoints.

Current implication:

- backend access control is not clearly enforced at route level
- UI role restrictions should not be treated as true security enforcement

### 7.3 Password Creation Requirements Are Not Enforced

Current-state password concerns:

- the mock login uses a weak shared sample password
- the mock register page accepts any non-empty password
- the operational new-user admin flow does not collect a password from the UI
- the backend may generate a random password if one is omitted
- no explicit policy was found for:
  - minimum length
  - complexity
  - rotation
  - history
  - breach checking
  - forced first-use change

### 7.4 No Proven MFA Implementation

Although the UI includes a two-factor toggle:

- no backend MFA challenge flow was identified
- no enrollment, recovery, or enforcement workflow was found

### 7.5 No Explicit Sensitive Route Throttling Observed

The reviewed application code does not currently demonstrate explicit throttling on:

- login attempts
- test notification actions
- import actions
- administrative changes

### 7.6 No Explicit Browser Security Header Hardening Observed

No custom implementation was found for:

- `Content-Security-Policy`
- `X-Frame-Options` or equivalent framing restriction
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Strict-Transport-Security`

### 7.7 HTTPS Enforcement Not Evident In App Code

The reviewed code does not explicitly enforce HTTPS.

Current implication:

- secure transport depends on external hosting / reverse proxy / web-server configuration

### 7.8 Contract File Upload Security Not Yet Implemented

The UI currently exposes a contract document upload interaction, but no fully implemented secure server-side upload flow was identified.

Missing current controls include:

- server-side MIME validation
- content scanning
- private storage handling
- access-controlled retrieval
- upload audit trail

### 7.9 No Field-Level Encryption Of Business Data Observed

The reviewed app code does not currently show field-level encryption for:

- contract descriptions
- counterparties
- notification recipients
- file references

This means application-layer data protection is limited mainly to standard database persistence and framework capability rather than explicit data-at-rest encryption logic.

### 7.10 Notification Delivery Security Is Limited

The system currently tracks notification settings and logs, but the reviewed code does not demonstrate a complete hardened provider integration for real outbound:

- email
- SMS
- WhatsApp

### 7.11 Audit Log Protection Could Be Stronger

Audit logging exists, but the reviewed implementation does not show:

- immutable logging
- tamper evidence
- central SIEM forwarding
- retention controls
- alerting on high-risk events

## 8. Current Password Security Position

As of the reviewed implementation, the strongest password-related control currently present is:

- hashed password storage in Laravel for persisted backend users

The system does not currently demonstrate enforced password policy for active application sign-in and user lifecycle.

Therefore, the current system should be described as:

- having backend password hashing capability
- not yet having mature password governance or password-authentication enforcement

## 9. Current Encryption Position

### Currently Present

- Laravel encryption capability using `AES-256-CBC`
- hashed password storage
- origin-restricted CORS

### Not Currently Evidenced In The Reviewed Code

- field-level encryption for contract records
- database encryption at rest logic in app layer
- secure encrypted document storage workflow
- explicit HSTS / TLS enforcement in application code

## 10. Current-State Security Posture Summary

The Strauss Daly Contract Management System currently has:

- reasonable business-data validation
- useful audit visibility
- some baseline secure coding practices from Laravel
- password hashing for stored backend user credentials

The system currently does not yet have:

- real production-grade authentication
- confirmed backend authorization enforcement
- MFA
- strong password policy enforcement
- hardened file upload controls
- explicit browser security header hardening
- explicit API abuse protection

Current assessment:

- appropriate only for controlled internal development or restricted internal usage
- not yet suitable for broader exposure without additional security hardening

## 11. Recommendations

The following recommendations are based on the current code state and should be treated as improvement actions, not current features.

### 11.1 Authentication And Authorization

Recommended:

1. Replace mock login with real Laravel-backed authentication.
2. Implement Sanctum or a comparable session/token strategy.
3. Enforce authentication middleware on all business APIs.
4. Enforce backend RBAC for:
   - contract administration
   - user management
   - settings changes
   - notification configuration
   - audit visibility

### 11.2 Password Security

Recommended:

1. Enforce a password policy:
   - minimum 12 characters
   - uppercase
   - lowercase
   - numeric
   - special character
2. Block common and breached passwords.
3. Require first-login password reset for new users.
4. Add secure password reset flow with expiring tokens.
5. Add account lockout / throttling for failed login attempts.

### 11.3 MFA

Recommended:

1. Implement real MFA for privileged roles.
2. Add enrollment, recovery, enforcement, and audit trails for MFA.

### 11.4 Transport And Browser Security

Recommended:

1. Enforce HTTPS in production.
2. Add HSTS.
3. Add:
   - CSP
   - X-Content-Type-Options
   - frame protection
   - Referrer-Policy
4. Ensure secure cookie settings if session authentication is introduced.

### 11.5 API Hardening

Recommended:

1. Add throttling to:
   - login
   - import
   - notification test
   - user administration
   - settings changes
2. Add stricter production error handling to avoid leaking internal details.
3. Limit CORS strictly to approved production origins.

### 11.6 File Upload Security

Recommended:

1. Implement backend upload processing.
2. Validate file type and size server-side.
3. Scan uploads for malware.
4. Store files outside the public web root.
5. Use controlled download endpoints or signed URLs.
6. Add upload/download/delete audit entries.

### 11.7 Monitoring And Audit Strengthening

Recommended:

1. Forward logs to a central monitoring platform or SIEM.
2. Add alerting for privileged changes and suspicious actions.
3. Introduce retention and integrity controls for audit records.

### 11.8 Data Protection

Recommended:

1. Evaluate encryption at rest for database and backups.
2. Consider field-level encryption for sensitive contract attributes where justified.
3. Protect outbound notification secrets in a secure secret-management process.

## 12. Suggested Future Security Feature Implementations

This section describes concrete security capabilities that could be implemented in the system.

### 12.1 Identity Features

- real login against backend users
- password reset workflow
- first-login password change
- MFA enrollment and enforcement
- session timeout enforcement
- privileged admin approval workflows

### 12.2 Authorization Features

- route middleware by role
- contract actions restricted by role
- settings restricted to admin-only
- notification center restricted to approved operators
- audit log access restriction

### 12.3 Document Security Features

- secure contract upload pipeline
- encrypted document storage
- document access logging
- malware scanning
- document versioning and retention controls

### 12.4 Monitoring Features

- SIEM integration
- suspicious login alerts
- bulk import anomaly alerts
- notification abuse alerts
- admin change notifications

### 12.5 Data Governance Features

- record retention rules
- deletion approval flow
- archival workflow
- stronger backup governance

## 13. Recommended Password Standard For This System

Recommended target standard:

- minimum length: `12`
- uppercase, lowercase, numeric, and special character required
- passphrases allowed
- first-login password reset
- breached-password screening
- lockout after repeated failures
- MFA for `Admin` accounts

## 14. Recommended Encryption Standard For This System

Recommended target standard:

- TLS 1.2+ or TLS 1.3
- HSTS enabled in production
- Laravel application key protected securely
- encrypted storage at infrastructure level
- encrypted backups
- encrypted contract documents where applicable
- secrets managed in environment / vault-backed stores

## 15. Short Management Summary

Suggested summary for broader reporting:

> Strauss Daly Contract Management is a React and Laravel-based internal contract administration platform with implemented business-data validation, audit logging, password hashing for backend-stored users, and CORS restriction to the approved frontend origin. The current codebase does not yet demonstrate production-grade authentication, backend authorization enforcement, MFA, hardened document upload controls, browser security headers, or explicit API abuse protections. The next security maturity phase should prioritize real identity and access control, password and MFA enforcement, HTTPS and header hardening, secure file handling, and centralized monitoring.

## 16. Supporting Files

This document is intended to reflect the current reviewed state of the codebase on `2026-06-25`.

If the application’s authentication, authorization, upload handling, encryption, or hosting controls change, this document should be revised accordingly.
