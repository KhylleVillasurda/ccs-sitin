# CCS Sit-in Monitoring System — First-Time Setup Guide

> **University of Cebu — College of Information & Computer Science**
> Full reference for getting the project running from scratch on a new machine.

---

## Prerequisites Checklist

Before you start, make sure you have all of these installed:

| Tool | Purpose | Download |
|------|---------|----------|
| **XAMPP** | Runs MySQL (and Apache) locally | https://www.apachefriends.org |
| **Rust (stable)** | Compiles and runs the backend | https://rustup.rs |
| **Node.js (LTS)** | Runs the frontend dev server | https://nodejs.org |
| **Git** | Source control | https://git-scm.com |

> **Windows extra:** The Rust backend uses `sqlx` with the MySQL native connector. If `cargo run` fails with a linker error related to MySQL, install the MySQL C Connector:
> ```
> winget install Oracle.MySQL
> ```
> Or download it from: https://dev.mysql.com/downloads/connector/c/

---

## Step 1 — Start XAMPP

1. Open the **XAMPP Control Panel**
2. Click **Start** next to **Apache**
3. Click **Start** next to **MySQL**

Both should show green status. MySQL must be running before you start the backend.

---

## Step 2 — Set Up the Database

### Option A — phpMyAdmin (Recommended)

1. Open your browser and go to: `http://localhost/phpmyadmin`
   *(If XAMPP uses port 8080, try `http://localhost:8080/phpmyadmin`)*
2. Click the **Import** tab at the top
3. Click **Choose File** and select `xampp-setup.sql` from the project root
4. Scroll down and click **Go**
5. You should see: `Setup complete!`

This creates the `ccs_sitin` database and three tables:
- `users` — students and the admin account
- `sit_in_records` — all sit-in sessions
- `announcements` — admin-posted announcements

### Option B — MySQL Console

```bash
# Open the XAMPP Shell (from XAMPP Control Panel → Shell button)
# or use CMD/PowerShell with MySQL in PATH

mysql -u root < C:\path\to\ccs-sitin\xampp-setup.sql
```

> **Already have an old install?**
> The script uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — it is safe to re-run. It will not wipe existing data.

---

## Step 3 — Configure the Backend Database Connection

Open `backend/Rocket.toml` in a text editor:

```toml
[default]
address = "0.0.0.0"
port = 8000
log_level = "normal"

[default.databases.main]
url = "mysql://root:@localhost:3306/ccs_sitin"
#           ^^^^  ^
#           user  password (empty by default in XAMPP)

[default.limits]
json = "10MiB"
```

**Default XAMPP MySQL credentials:** user = `root`, password = *(leave blank)*

If you've set a MySQL root password in XAMPP, update the URL:
```
url = "mysql://root:YOUR_PASSWORD@localhost:3306/ccs_sitin"
```

---

## Step 4 — Run the Backend

Open a terminal in the project root:

```bash
cd backend
cargo run
```

**First run takes several minutes** — Rust needs to compile all dependencies. Subsequent runs are much faster.

When it's ready you'll see something like:

```
🚀 Rocket has launched from http://0.0.0.0:8000
```

> **What happens automatically on first `cargo run`:**
> - All three database tables are created (if they don't exist yet)
> - An admin account is seeded if no admin exists yet:
>   - **ID:** `admin`
>   - **Password:** `admin123`

The API is now live at `http://localhost:8000`.

---

## Step 5 — Run the Frontend

Open a **second terminal** (keep the backend running in the first one):

```bash
cd frontend
npm install       # Only needed the first time, or after pulling new changes
npm run dev
```

The frontend starts at:
- **Local:** `http://localhost:5173`
- **Network (other devices):** `http://YOUR_MACHINE_IP:5173`

> The Vite dev server proxies all `/api` requests to `http://localhost:8000` automatically — you don't need to configure anything for the frontend and backend to talk to each other.

---

## Step 6 — Verify Everything Works

1. Open `http://localhost:5173` in your browser
2. You should see the **Landing page** with the UC and CICS logos
3. Click **Login** and sign in with:
   - **ID:** `admin`
   - **Password:** `admin123`
4. You should be redirected to the **Admin Dashboard** with stats, announcements, and the sidebar

If the dashboard loads with data (even zeroes) — the full stack is working correctly.

---

## Project Structure Quick Reference

```
ccs-sitin/
├── xampp-setup.sql         ← Run this in phpMyAdmin FIRST
├── database-dump.sql       ← For syncing data between machines
├── export-db.bat           ← Windows: one-click DB export
├── import-db.bat           ← Windows: one-click DB import
│
├── backend/
│   ├── Rocket.toml         ← Edit DB credentials here
│   ├── Cargo.toml          ← Rust dependencies
│   └── src/
│       ├── main.rs         ← Route mounting
│       ├── db.rs           ← DB pool, table creation, admin seed
│       ├── models.rs       ← Shared data structs
│       ├── auth.rs         ← JWT, login, register
│       ├── students.rs     ← Student CRUD + profile picture
│       ├── sitin.rs        ← Start/end sit-in sessions
│       ├── announcements.rs
│       ├── reports.rs      ← Stats, by-purpose, by-lab
│       └── cors.rs         ← CORS fairing (allows all origins)
│
└── frontend/
    ├── index.html          ← Bootstrap Icons CDN loaded here
    ├── vite.config.js      ← Proxy /api → :8000
    └── src/
        ├── App.jsx         ← Routes + ProtectedRoute
        ├── api.js          ← Axios, auto-attaches JWT, 401 redirect
        ├── index.css       ← Global Everforest Dark theme + utility classes
        ├── hooks/
        │   └── useAuth.jsx ← AuthContext, AuthProvider, useAuth()
        ├── components/
        │   └── UserAvatar.jsx
        └── pages/
            ├── Landing.jsx / Login.jsx / Register.jsx
            ├── admin/
            │   ├── AdminLayout.jsx   ← Sidebar + Outlet
            │   ├── AdminHome.jsx     ← Stats + donut chart + announcements
            │   ├── AdminStudents.jsx ← Student management table
            │   ├── AdminSitin.jsx    ← Start/end sit-in sessions
            │   ├── AdminRecords.jsx  ← Full sit-in history
            │   └── AdminReports.jsx  ← Reports by purpose + lab
            └── student/
                ├── StudentDashboard.jsx
                └── EditProfile.jsx
```

---

## Syncing Data Between Machines (Windows)

If you're working on multiple computers and need to carry over database records:

**Export (on the source machine):**
```bash
# Double-click export-db.bat, or run in CMD:
export-db.bat
# Creates: database-dump.sql
```

**Import (on the target machine):**
```bash
# Make sure XAMPP MySQL is running, then:
import-db.bat
# Restores from: database-dump.sql
```

> The dump file is listed in `.gitignore` by default — commit it manually if you want it in version control.

---

## Common Problems & Fixes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `cargo run` fails with linker/MySQL error | Missing MySQL C Connector | `winget install Oracle.MySQL` |
| `cargo run` fails with `connection refused` | XAMPP MySQL not started | Start MySQL in XAMPP Control Panel |
| Backend starts but login returns 500 | Wrong DB URL in `Rocket.toml` | Check credentials in `Rocket.toml` |
| Frontend shows blank page | Backend not running | Start backend first (`cargo run`) |
| `npm run dev` fails | Missing node_modules | Run `npm install` first |
| Admin account missing | DB seeded before Rust ran | Just run `cargo run` — it seeds automatically if no admin exists |
| `profile_picture` column missing | Old DB schema | Re-run `xampp-setup.sql` — the `ALTER TABLE` line is safe to re-run |

---

## Default Credentials

| Account | ID | Password |
|---------|----|----------|
| Admin | `admin` | `admin123` |

> Change the admin password after your first login via the profile settings.

---

## Port Reference

| Service | Address |
|---------|---------|
| Backend API | `http://localhost:8000` |
| Frontend Dev | `http://localhost:5173` |
| phpMyAdmin | `http://localhost/phpmyadmin` |
| MySQL | `localhost:3306` |

---

*Last updated to match codebase as of March 2026.*
