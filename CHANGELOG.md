# Changelog

All notable changes to the **QCAMS Mobile** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned Features

- FCM / APNs remote push notifications for event assignments and schedule changes.
- Offline scan queueing with background SQLite persistence for connection-blind scanning.
- Server-side paginated event filtering by date and department.

---

## [1.0.0] - 2026-09-07

### Added

- **Authentication & RBAC:**
  - Implemented Laravel Sanctum API authentication (`Api\AuthController`) using username-keyed credentials.
  - Added structured user payload response containing role permissions and resolved profile details.
  - Added role-aware tab navigation (Admin: _Home / Events / Scan_; Faculty: _Home / Events / My QR / Scan_; Student: _Home / Events / My QR_).
- **QR Generation & Scanning Engine:**
  - Personal static encrypted QR payload endpoint (`Api\QrCodeController@myQrCode`) matching web-side `Crypt::encryptString('{id}-{account_type}')` formats for total cross-platform parity.
  - Scanner verification lookup and attendance logging endpoint (`Api\ScanController`).
  - Enforced event-scoped scanning requiring an active event selection before scanning to prevent accidental cross-event logging during overlapping campus schedules.
- **Attendance State Machine:**
  - Tiered attendance logic enforcing **On-Time**, **Late**, and **Cutoff** windows based on event start times.
  - Automatic "Absent" status generation once the cutoff window elapses.
  - Enforced check-out validation that unlocks check-out scanning only after an event's scheduled end time.
- **UI & Dashboard:**
  - Dynamic Home screen with user metrics, quick-action tiles (_Show My QR_ / _Scan Attendance_), and a compact "Event Participation" preview widget (`Api\AttendanceController@myAttendance`).
  - Dedicated "My Attendance" ledger screen featuring infinite scrolling pagination and dynamic status badges (`Not Yet Attended`, `Logged In`, `Present`, `Absent`).
  - Centralized event hub with tab-based state filtering (`Upcoming`, `Ongoing`, `Past`).
- **Notifications & API Utilities:**
  - In-app notification center with an unread badge counter, individual mark-as-read, and mark-all-read capabilities.
  - Global `ForceJsonResponse` middleware applied across the `api` route group to enforce JSON payloads and prevent unwanted HTML redirect responses.

### Fixed

- **API Route Encoding:** Resolved an issue in `Api\ScanController@show` where encrypted QR payloads placed in URL route segments broke Laravel routing due to base64 characters (`/`, `+`, `=`). Payload transmission was refactored to a properly URL-encoded query parameter (`?qr_code=`).
- **Validation Guard Strictness:** Fixed a logical bug in the original web scan controller where `!$request->has('user_id') && !$request->has('user_type')` allowed single-missing-field requests to pass validation guard. Replaced with strict required validation rules on the API layer.
- **Expo Router Tab Rendering:** Fixed missing/blank tab icons caused by conditionally omitting `<Tabs.Screen>` elements based on user roles. Standardized tab layout declaration across all roles by utilizing the `options={{ href: null }}` pattern for hidden routes.
- **Header Content-Type Negotiation:** Resolved Postman and third-party API clients receiving HTML login redirects on HTTP 422 errors by enforcing the `ForceJsonResponse` middleware globally on all `/api/*` endpoints.
