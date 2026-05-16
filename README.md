# CCS Sit-in Monitoring System
**University of Cebu — College of Computer Studies**

Full-stack web application for monitoring student sit-in sessions.

---

## Getting Started

Please refer to `SETUP_GUIDE.md` for a comprehensive, step-by-step guide on setting up the project, including prerequisites (Rust, Node.js, XAMPP), database configuration, and running the application locally.

---

## Project Structure Quick Reference

```
ccs-sitin/
├── xampp-setup.sql         ← Run this in phpMyAdmin FIRST
│
├── backend/
│   ├── Rocket.toml         ← Edit DB credentials here
│   ├── Cargo.toml          ← Rust dependencies
│   └── src/
│       ├── main.rs         ← Route mounting, manual pool management
│       ├── db.rs           ← Migration logic, admin seeding
│       └── ...
│
└── frontend/
    ├── pnpm-lock.yaml      ← Lockfile
    ├── package.json        ← Frontend configuration
    └── vite.config.js      ← Vite configuration
```

---

## Features

### Admin Dashboard
- **Live Stats:** Students, active sit-ins, and totals.
- **Reports:** Session statistics by purpose and laboratory.
- **Announcements:** Post and delete announcements.
- **Student Management:** Add, edit, delete, search, and reset student sessions.
- **Sit-in Management:** Start and end sit-in sessions by student ID.
- **Records:** View full logs with status filtering.

### Student Features
- **Dashboard:** Session counters and active status.
- **Announcements:** View system announcements.
- **History:** Personal sit-in history.
- **Profile:** Manage profile settings (name, course, email, address, password).

---

## License

This project is intended for educational purposes under the College of Computer Studies, University of Cebu.
