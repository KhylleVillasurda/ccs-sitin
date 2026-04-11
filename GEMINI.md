# <i class="bi bi-gemini"></i> Project Mandates: CCS Sit-in System

This document defines the foundational standards, architectural patterns, and development workflows for the **CCS Sit-in System**. These instructions take absolute precedence over general defaults.

---

## <i class="bi bi-layers"></i> 1. Core Architecture

### <i class="bi bi-gear-wide-connected"></i> Backend (Rust)
- **Framework:** [Rocket.rs](https://rocket.rs/) (v0.5)
- **Database:** MySQL/MariaDB via `sqlx` and `rocket_db_pools`.
- **Serialization:** `serde` (JSON).
- **Security:** `bcrypt` for password hashing, `jsonwebtoken` (JWT) for session management.
- **Project Structure:**
  - `src/main.rs`: Entry point and route mounting.
  - `src/models.rs`: Data structures and database schemas.
  - `src/auth.rs`: Authentication logic (login, register).
  - `src/db.rs`: Database connection and initialization.
  - Specialized modules: `students.rs`, `sitin.rs`, `announcements.rs`, `reports.rs`.

### <i class="bi bi-window-sidebar"></i> Frontend (React)
- **Tooling:** [Vite](https://vitejs.dev/) with React (JSX).
- **Routing:** `react-router-dom` (v6) with `ProtectedRoute` for role-based access control.
- **HTTP Client:** `axios` for API communication.
- **State Management:** React Context API for authentication (`useAuth.jsx`).
- **Styling:** Vanilla CSS + [Bootstrap Icons](https://icons.getbootstrap.com/).

---

## <i class="bi bi-code-slash"></i> 2. Engineering Standards

### <i class="bi bi-check2-square"></i> General Principles
- **Idiomatic Code:** Follow Rust's `clippy` and React's best practices.
- **Consistency:** Maintain existing naming conventions (e.g., camelCase for frontend, snake_case for backend).
- **Security First:** Never log sensitive data. Always validate JWTs on protected routes.
- **Types:** Use TypeScript-like rigor in JSX and strict type-safety in Rust.

### <i class="bi bi-palette"></i> UI/UX Standards
- **Icons:** **ALWAYS** use Bootstrap Icons (`<i class="bi bi-icon-name"></i>`). Do NOT use emojis.
- **Visual Feedback:** Use clear indicators for status (e.g., green for free, red for occupied/danger).
- **Components:** Modularize UI into `src/components/` for reusability.

---

## <i class="bi bi-diagram-3"></i> 3. Feature-Specific Requirements

### <i class="bi bi-calendar-check"></i> Lab Reservation Logic (High-Fidelity)
- **Visual Grid:** Use a responsive CSS grid to represent the lab layout based on the data blueprint in `TODO.md`.
- **Component UI:** 
  - **PC Icon:** Use `<i class="bi bi-pc-display"></i>` or `<i class="bi bi-display"></i>`.
  - **Border/Wall:** Use subtle visual separators (e.g., `<hr>` or styled `<div>` borders).
- **Status Indicators (State-based):**
  - **Available (Free):** <i class="bi bi-pc-display text-success"></i> Green icon + "Available" tooltip.
  - **Occupied/Reserved:** <i class="bi bi-pc-display text-danger"></i> Red icon (optionally with a "forbidden" overlay or low opacity) + "Occupied" tooltip.
  - **Selected (Pending):** <i class="bi bi-pc-display text-primary"></i> Blue icon (when the student clicks to select).
- **Interactivity:**
  - Available PCs are clickable and trigger a confirmation modal.
  - Occupied PCs are disabled/non-clickable to prevent selection.
- **Workflow:**
  1. Student selects an Available PC -> Confirmation Modal (Yes/No).
  2. Request sent to Admin -> Admin Notification.
  3. Admin approves/denies in "Reservation Tab".
  4. Actions logged in "Reservation Logs".

### <i class="bi bi-bell"></i> Notifications
- **Admin:** Must be notified of new reservation requests.
- **Student:** Must be notified of approval/denial status.
- **Implementation:** Notifications should redirect to the relevant action page (e.g., clicking a reservation notification takes the admin to the Reservation List).

---

## <i class="bi bi-arrow-repeat"></i> 4. Development Workflow

1. **Research:** Map existing logic and validate assumptions (e.g., checking `models.rs` before adding fields).
2. **Strategy:** Propose a implementation plan before execution.
3. **Execution:** Surgical updates to files.
4. **Validation:** Run `cargo check` for backend and verify frontend behavior.

---

## <i class="bi bi-journal-text"></i> 5. Active TODO Tracking
Always refer to `TODO.md` for current project status and feature implementation priorities.
