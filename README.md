# QCAMS Mobile

Mobile-first companion app for **QCAMS** (QR Code Attendance Management System) — built with **Expo** and **React Native**, consuming the existing Laravel + PostgreSQL backend over a token-authenticated JSON API.

QCAMS already runs as a full Laravel web app (Blade dashboard, PWA support). This app extends that system to mobile: students and faculty carry a personal QR code for check-in, and admins/faculty scan attendees directly from their phone instead of a fixed web scanner station.

---

## Features

- **Authentication** — username/password login via Laravel Sanctum, token stored securely on-device.
- **Role-based navigation** — Admin, Faculty, and Student each see a different set of tabs.
- **Personal QR Code** — students and faculty can display their own encrypted QR code to be scanned in at an event.
- **QR Scanning** — admins and faculty scan attendee QR codes using the device camera, scoped to a specific event (selected before scanning, either from the Scan tab or directly from an event's detail screen).
- **Attendance timing tiers** — login is marked **on time**, **late**, or **cut off**, based on minutes elapsed since the event's start time. Logout only opens once the event has ended.
- **Events feed** — Upcoming / Ongoing / Past tabs, computed from each event's date and start/end time.
- **Home dashboard** — personal details, quick actions (Show QR / Scan Attendance), and a recent event-participation summary.
- **My Attendance** — full scrollable history of events attended, with status badges (Present / Late / Absent / etc.).
- **In-app notifications** — a bell with an unread badge; notifications fire when a user is added to an event and when they log in/out for one. (Push notifications are planned for a later version — see [Roadmap](#roadmap).)

---

## Tech Stack

| Layer | Tec      | Technology                         |
| ---------------- | ---------------------------------- |
| Mobile app       | Expo (Expo Router, TypeScript)     |
| Navigation       | `expo-router` (file-based routing) |
| Camera / QR scan | `expo-camera`                      |
| QR rendering     | `react-native-qrcode-svg`          |
| Auth storage     | `expo-secure-store`                |
| Icons            | `@expo/vector-icons` (Ionicons)    |
| Backend          | Laravel (PHP), PostgreSQL          |
| API auth         | Laravel Sanctum (bearer tokens)    |
| Backend hosting  | Render + Supabase Postgres         |

---

## Project Structure

```
qcams-mobile/
├── app/                        # Routes (Expo Router — file-based)
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar, role-based visibility (href: null pattern)
│   │   ├── index.tsx           # Home — dashboard, attendance preview, notif bell, logout
│   │   ├── events.tsx          # Events feed (Upcoming / Ongoing / Past)
│   │   ├── my-qrcode.tsx       # Personal QR code (hidden for Admin)
│   │   └── scan.tsx            # Camera scanner (hidden for Student)
│   ├── event/
│   │   └── [id].tsx            # Event detail — "Scan Attendance for This Event" entry point
│   ├── attendance.tsx          # Full attendance history (infinite scroll)
│   ├── notifications.tsx       # Full notification list
│   └── _layout.tsx             # Root layout — AuthProvider + auth-gated routing
├── api/
│   ├── client.ts                # apiFetch() — attaches bearer token, base URL, error handling
│   └── types.ts                 # Shared API response types
├── components/
│   └── AttendanceStatusBadge.tsx
├── hooks/
│   └── useAuth.tsx              # Auth context — login, logout, persisted session
├── constants/
├── assets/
└── app.json
```

---

## Getting Started

### Prerequisites

- Node.js and npm
- Expo Go app (for testing on a physical device) or an Android/iOS emulator
- The QCAMS Laravel backend running and reachable (locally or deployed)

### Setup

```bash
npm install
```

Set the API base URL in `api/client.ts`:

```ts
const API_URL = "http://localhost:8000/api"; // local dev
// swap for your LAN IP when testing on a physical device,
// or the deployed Render URL for production/staging
```

> `localhost` only resolves correctly from an iOS Simulator. For a physical device or Android emulator, use your machine's LAN IP (e.g. `http://192.168.1.x:8000/api`) or the deployed API URL.

Run the app:

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` / `i` to launch an emulator.

---

## Backend API Summary

All endpoints are prefixed with `/api` and (except `/login`) require an `Authorization: Bearer <token>` header.

| Method | Endpoint                      | Purpose                                                  |
| ------ | ----------------------------- | -------------------------------------------------------- |
| POST   | `/login`                      | Authenticate, returns token + user (with role + profile) |
| POST   | `/logout`                     | Revoke the current token                                 |
| GET    | `/user`                       | Current authenticated user                               |
| GET    | `/my-qrcode`                  | Encrypted personal QR payload (Student/Faculty)          |
| GET    | `/scan?qr_code=`              | Decrypt and look up a scanned QR's owner                 |
| POST   | `/scan`                       | Log attendance (time in / time out) for an event         |
| GET    | `/events`                     | List events (scoped to participant for non-admins)       |
| GET    | `/events/{event}`             | Single event detail                                      |
| GET    | `/my-attendance`              | Paginated attendance history for the logged-in user      |
| GET    | `/notifications`              | Paginated notification list                              |
| GET    | `/notifications/unread-count` | Unread notification count                                |
| POST   | `/notifications/{id}/read`    | Mark one notification as read                            |
| POST   | `/notifications/read-all`     | Mark all notifications as read                           |

---

## Roles & Tab Visibility

| Tab    | Admin | Faculty | Student |
| ------ | :---: | :-----: | :-----: |
| Home   |  ✅   |   ✅    |   ✅    |
| Events |  ✅   |   ✅    |   ✅    |
| My QR  |  ❌   |   ✅    |   ✅    |
| Scan   |  ✅   |   ✅    |   ❌    |

Admins are not event participants in the current data model, so they have no personal QR code and no attendance history of their own.

---

## Attendance Timing Rules

When a scan is submitted for check-in:

- **On time** — within the configured "on time" window after the event's start.
- **Late** — after the on-time window but before the login cutoff.
- **Cut off** — beyond the cutoff window; the participant is automatically marked **Absent** and can no longer log in.

Logout is only accepted once the event's end time has passed, within a defined grace period.

(Exact minute thresholds are configured in `Api\ScanController` on the backend.)

---

## Roadmap

- [ ] Push notifications (Expo push tokens + scheduled backend job for login/logout/cutoff reminders)
- [ ] Event date filtering server-side (`GET /api/events?date=today`)
- [ ] Offline scan queueing for poor-connectivity venues
- [ ] Admin support for event-attendee tracking (if ever needed)

---

## Related Projects

Part of a broader mobile-first migration effort covering:

Part of a broader mobile-first migration effort covering:

- **QCAMS** (this app)
- Livestock Profiling and Tagging Management System
- SLSU Clinic Appointment System

All three share the same architecture pattern: existing Laravel backend + Expo/React Native mobile client over a Sanctum-authenticated JSON API.
