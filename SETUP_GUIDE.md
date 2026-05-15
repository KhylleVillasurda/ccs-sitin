# CCS Sit-in Monitoring System — First-Time Setup Guide

> **University of Cebu — College of Computer Studies**
> Full reference for getting the project running from scratch on a new machine.

---

## Prerequisites Checklist

Before you start, make sure you have all of these installed:

| Tool | Purpose | Download |
|------|---------|----------|
| **XAMPP** | Runs MySQL (and Apache) locally | https://www.apachefriends.org |
| **Rust (stable)** | Compiles and runs the backend | https://rustup.rs |
| **Node.js (LTS)** | Required for pnpm | https://nodejs.org |
| **pnpm** | Package manager for the frontend | `npm install -g pnpm` |
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

This creates the `ccs_sitin` database and the necessary tables (users, sit_in_records, etc.).

### Option B — MySQL Console

```bash
# Open the XAMPP Shell (from XAMPP Control Panel → Shell button)
# or use CMD/PowerShell with MySQL in PATH

mysql -u root < C:\path\to\ccs-sitin\xampp-setup.sql
```

> **Already have an old install?**
> The script uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ...` — it is safe to re-run. On standard MySQL (non-MariaDB), you may see "Duplicate column" warnings if you re-run it; these can be safely ignored.

---

## Step 3 — Configure the Backend Database Connection

Open `backend/Rocket.toml` in a text editor:

```toml
[default]
address = "0.0.0.0"
port = 8000

[default.databases.main]
url = "mysql://root:@localhost:3306/ccs_sitin"
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

The API is now live at `http://localhost:8000`.

---

## Step 5 — Run the Frontend

Open a **second terminal** (keep the backend running in the first one):

```bash
cd frontend
pnpm install       # Only needed the first time, or after pulling new changes
pnpm run dev
```

The frontend starts at:
- **Local:** `http://localhost:5173`

> The Vite dev server proxies all `/api` requests to `http://localhost:8000` automatically.

---

## Step 6 — Verify Everything Works

1. Open `http://localhost:5173` in your browser
2. Click **Login** and sign in with:
   - **ID:** `admin`
   - **Password:** `admin123`
3. You should be redirected to the **Admin Dashboard**.

If the dashboard loads — the full stack is working correctly.

---

## Project Structure Quick Reference

```
ccs-sitin/
├── xampp-setup.sql         ← Run this in phpMyAdmin FIRST
│
├── backend/
│   ├── Rocket.toml         ← Edit DB credentials here
│   ├── Cargo.toml          ← Rust dependencies (Rocket 0.5.1, SQLx 0.8.6)
│   └── src/
│       ├── main.rs         ← Route mounting, manual pool management
│       ├── db.rs           ← Migration logic, admin seeding
│       └── ...
│
└── frontend/
    ├── pnpm-lock.yaml      ← Lockfile
    ├── package.json        ← Vite 8.x configuration
    └── vite.config.js      ← Vite 8.x + Rolldown/Oxc configuration
```

---

## Common Problems & Fixes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `cargo run` fails with linker/MySQL error | Missing MySQL C Connector | `winget install Oracle.MySQL` |
| `cargo run` fails with `connection refused` | XAMPP MySQL not started | Start MySQL in XAMPP Control Panel |
| Backend starts but login returns 500 | Wrong DB URL in `Rocket.toml` | Check credentials in `Rocket.toml` |
| Frontend shows blank page | Backend not running | Start backend first (`cargo run`) |
| `pnpm run dev` fails | Missing node_modules | Run `pnpm install` first |

---

## Port Reference

| Service | Address |
|---------|---------|
| Backend API | `http://localhost:8000` |
| Frontend Dev | `http://localhost:5173` |
| phpMyAdmin | `http://localhost/phpmyadmin` |

---

*Last updated May 2026.*
