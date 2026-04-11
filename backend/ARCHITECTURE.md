# <i class="bi bi-cpu"></i> Backend Architecture: CCS Sit-in System

This document outlines the backend structure, technologies, and patterns used in the CCS Sit-in System.

---

## 🛠️ Core Technology Stack
- **Framework:** [Rocket.rs](https://rocket.rs/) (v0.5) - A fast, type-safe web framework for Rust.
- **Database:** MySQL/MariaDB managed via [sqlx](https://github.com/launchbadge/sqlx) and `rocket_db_pools`.
- **Database Initialization:** Managed via `DbInitFairing` in `db.rs` (automatically creates tables and seeds default admin).
- **Authentication:** JWT (JSON Web Tokens) via `jsonwebtoken` and `bcrypt` for password hashing.
- **Serialization:** `serde` for JSON handling.
- **Asynchronous Runtime:** `tokio`.

---

## 📂 Directory Structure (`/backend/src`)

- `main.rs`: Entry point. Mounts all routes and attaches database/CORS fairings.
- `models.rs`: Centralized data structures and database schemas (structs for User, SitInRecord, etc.).
- `db.rs`: Database connection setup, initialization fairing, and pool management.
- `auth.rs`: Authentication logic (login, registration, JWT generation).
- `students.rs`: CRUD operations for student accounts and profile management.
- `sitin.rs`: Logic for starting/ending lab sessions and tracking logs.
- `announcements.rs`: Admin-managed announcements system.
- `reports.rs`: Logic for generating statistics and analytical data.
- `feedback.rs`: Student feedback submission and admin reply logic.
- `notifications.rs`: Real-time/stored notification system for users.
- `cors.rs`: Custom CORS fairing for cross-origin requests.

---

## 🔐 Security Patterns
- **JWT Middleware:** Protected routes expect an `Authorization: Bearer <token>` header.
- **Password Hashing:** Passwords are never stored in plain text (using `bcrypt`).
- **Route Guards:** Rocket's request guards are used to validate user roles and session validity.

---

## 📡 API Design
The backend follows a RESTful API pattern under the `/api` prefix:
- `/api/auth`: Identity management.
- `/api/students`: Student data and administrative controls.
- `/api/sitin`: Active session tracking.
- `/api/reports`: Analytical endpoints for dashboards.
- `/api/notifications`: User-specific alerts.

---

## ⚙️ Development Workflow
1. **Model Changes:** Update `models.rs` first.
2. **Database:** Ensure SQL queries in modules match the updated models.
3. **Routing:** Register new endpoints in `main.rs`.
4. **Validation:** Run `cargo check` or `cargo build` to ensure type safety.
