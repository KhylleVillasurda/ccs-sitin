# CCS Sit-in Monitoring System

**University of Cebu — College of Information & Computer Science**

A full-stack web application for managing student computer lab sit-ins.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + React Router v6   |
| Backend   | Rust + Rocket v0.5                  |
| Database  | SQLite (via sqlx)                   |
| Auth      | JWT (jsonwebtoken) + bcrypt         |
| Theme     | Everforest Dark Medium              |

---

## Project Structure

```
ccs-sitin/
├── backend/               # Rust/Rocket API
│   ├── Cargo.toml
│   ├── Rocket.toml
│   └── src/
│       ├── main.rs
│       ├── db.rs          # SQLite init & pool
│       ├── models.rs      # Shared data types
│       ├── cors.rs        # CORS fairing
│       ├── auth.rs        # Login / Register
│       ├── students.rs    # Student CRUD
│       ├── sitin.rs       # Sit-in management
│       ├── announcements.rs
│       └── reports.rs
└── frontend/              # React app
    ├── public/
    │   ├── ccs-logo.jpg
    │   └── uc-logo.png
    ├── src/
    │   ├── api.js         # Axios client
    │   ├── App.jsx        # Routes
    │   ├── index.css      # Global Everforest theme
    │   ├── hooks/
    │   │   └── useAuth.js
    │   └── pages/
    │       ├── Landing.jsx / .css
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Auth.css
    │       ├── admin/
    │       │   ├── AdminLayout.jsx / .css
    │       │   ├── AdminHome.jsx
    │       │   ├── AdminStudents.jsx
    │       │   ├── AdminSitin.jsx
    │       │   ├── AdminRecords.jsx
    │       │   └── AdminReports.jsx
    │       └── student/
    │           ├── StudentDashboard.jsx
    │           └── StudentDashboard.css
    ├── index.html
    └── package.json
```

---

## Setup & Running

### Prerequisites
- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) v18+
- SQLite (usually pre-installed on Linux/macOS)

### 1. Backend

```bash
cd backend

# Install SQLite dev library (Ubuntu/Debian)
sudo apt install libsqlite3-dev

# Run (creates ccs_sitin.db automatically)
cargo run
```

The API will start at **http://localhost:8000**

**Default Admin credentials:**
- ID Number: `admin`
- Password: `admin123`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will open at **http://localhost:5173**

---

## API Endpoints

### Auth
| Method | Path              | Description        | Auth Required |
|--------|-------------------|--------------------|---------------|
| POST   | /api/auth/login   | Login              | No            |
| POST   | /api/auth/register| Register student   | No            |

### Students (Admin only)
| Method | Path                      | Description           |
|--------|---------------------------|-----------------------|
| GET    | /api/students/            | List all students     |
| GET    | /api/students/:id         | Get student by ID     |
| POST   | /api/students/            | Add student           |
| PUT    | /api/students/:id         | Update student        |
| DELETE | /api/students/:id         | Delete student        |
| POST   | /api/students/reset-sessions | Reset all sessions |

### Sit-in (Admin only)
| Method | Path                  | Description            |
|--------|-----------------------|------------------------|
| POST   | /api/sitin/start      | Start a sit-in session |
| POST   | /api/sitin/end/:id    | End a sit-in session   |
| GET    | /api/sitin/current    | Active sit-ins         |
| GET    | /api/sitin/records    | All records            |
| GET    | /api/sitin/student/:id| Student's own records  |

### Reports & Announcements
| Method | Path                        | Description          |
|--------|-----------------------------|----------------------|
| GET    | /api/reports/stats          | Dashboard stats      |
| GET    | /api/reports/by-purpose     | Breakdown by purpose |
| GET    | /api/reports/by-lab         | Breakdown by lab     |
| GET    | /api/announcements/         | List announcements   |
| POST   | /api/announcements/         | Post announcement    |
| DELETE | /api/announcements/:id      | Delete announcement  |

---

## Features

### Admin Dashboard
- 📊 Live statistics (registered students, active sit-ins, total)
- 📈 Session breakdown by programming purpose (bar charts)
- 📣 Post/delete announcements
- 👥 Full student management (add, edit, delete, search, reset sessions)
- 💻 Start/end sit-in sessions by searching student ID
- 📋 Complete sit-in records with filtering by status
- 📊 Reports: sessions by purpose and by lab room

### Student Dashboard
- 🎫 Remaining session count
- ✅ Active sit-in status
- 📋 Personal sit-in history
- 📣 View admin announcements

---

## Default Lab Rooms
524, 526, 528, 530, 542

## Supported Purposes
C Programming, Java, PHP, ASP.Net, C#, Python, Database, Web Development, Other
