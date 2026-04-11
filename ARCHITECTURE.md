# <i class="bi bi-diagram-3"></i> System Architecture: CCS Sit-in System

This document provides a high-level overview of the system's flow, data integration, and cross-cutting concerns.

---

## <i class="bi bi-arrow-left-right"></i> System Flow
The system follows a classic Client-Server architecture:

1.  **Frontend (React):** A Single Page Application (SPA) built with Vite. It handles user interactions, state management (via Context API), and routing.
2.  **API Layer (REST):** The frontend communicates with the backend via JSON over HTTP.
3.  **Backend (Rust/Rocket):** A high-performance web server that manages business logic, authentication (JWT), and database orchestration.
4.  **Database (MySQL):** Persistent storage managed via XAMPP.

---

## <i class="bi bi-shield-check"></i> Security & Authentication Flow
- **Mechanism:** JSON Web Tokens (JWT).
- **Login:**
    - User submits credentials -> Backend validates via `bcrypt`.
    - Backend generates a JWT containing `id`, `role`, and `name`.
    - Frontend stores the token (usually in `localStorage` via `useAuth.jsx`).
- **Authorization:**
    - **Frontend:** `ProtectedRoute` component wraps admin/student routes to prevent unauthorized access.
    - **Backend:** JWTs are decoded to verify user identity and role before executing protected route handlers.

---

## <i class="bi bi-database"></i> Core Data Entities
- **User:** Represents both Students and Admins. Identified by `id_number`.
- **SitInRecord:** Tracks a student's session (Lab, Purpose, Time In/Out).
- **Notification:** System-wide alerts for actions like reservations or announcements.
- **Feedback:** Student-submitted reviews for their sit-in sessions.

---

## <i class="bi bi-connectivity-fixed"></i> Integration Points
- **CORS:** Managed in `backend/src/cors.rs` to allow the React frontend (port 5173) to talk to the Rocket backend (port 8000).
- **Database Pool:** Managed by `rocket_db_pools` for efficient connection handling.

---

## <i class="bi bi-folder2-open"></i> Sub-Architecture Guides
For deep-dive technical details, refer to:
- [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md)
- [`frontend/ARCHITECTURE.md`](frontend/ARCHITECTURE.md)
