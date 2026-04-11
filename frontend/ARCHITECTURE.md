# <i class="bi bi-window-sidebar"></i> Frontend Architecture: CCS Sit-in System

This document outlines the frontend architecture, state management, and UI standards.

---

## 🛠️ Core Technology Stack
- **Framework:** [React](https://reactjs.org/) (v18+) via [Vite](https://vitejs.dev/).
- **Routing:** [react-router-dom](https://reactrouter.com/) (v6).
- **HTTP Client:** [axios](https://axios-http.com/) with interceptors for JWT injection.
- **State Management:** React Context API (`useAuth` hook) for global session state.
- **Icons:** [Bootstrap Icons](https://icons.getbootstrap.com/).

---

## 📂 Directory Structure (`/frontend/src`)

- `App.jsx`: Main routing configuration and provider wrapping.
- `api.js`: Centralized Axios instance with request/response interceptors.
- `hooks/`: Custom React hooks (e.g., `useAuth.jsx`).
- `context/`: Context providers (if applicable, currently in `hooks`).
- `components/`: Reusable UI components (Modals, NotificationBell, etc.).
- `pages/`: 
  - `Landing.jsx`: Entry page.
  - `Login.jsx` / `Register.jsx`: Auth pages.
  - `admin/`: Admin-specific dashboards and layouts.
  - `student/`: Student-specific dashboard and profile editing.

---

## 🔐 Authentication & Guarding
- **Context:** `AuthProvider` maintains the `user` object and `token` in `localStorage`.
- **Protected Routes:** The `ProtectedRoute` component wraps routes to enforce role-based access control (RBAC).
- **Interceptors:** `api.js` automatically attaches the JWT to every outgoing request and handles `401 Unauthorized` by logging the user out.

---

## 🎨 UI/UX Standards
- **Icons:** Use `<i class="bi bi-icon-name"></i>` for all iconography.
- **Layouts:** 
  - Admin uses a persistent sidebar/layout (`AdminLayout.jsx`).
  - Student uses a unified dashboard.
- **Visual Cues:** 
  - Success: Green text/icons.
  - Error/Danger: Red text/icons.
  - Primary: Blue (Bootstrap primary).

---

## ⚙️ Development Workflow
1. **API Integration:** Use the exported `api` from `src/api.js` for all backend communication.
2. **Routing:** Add new views to `AppRoutes` in `App.jsx`.
3. **Components:** Modularize new UI elements into `src/components`.
4. **Build:** Use `npm run dev` for local development and `npm run build` for production.
