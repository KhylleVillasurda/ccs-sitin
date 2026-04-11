# CCS Sit-in Monitoring System
**University of Cebu — College of Information & Computer Science**

Full-stack web app: React frontend · Rust/Rocket backend · MySQL (XAMPP)

---

## Tech Stack
| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite + React Router v6 |
| Backend  | Rust + Rocket v0.5                |
| Database | MySQL / MariaDB (via XAMPP)       |
| Auth     | JWT + bcrypt                      |
| Theme    | Everforest Dark Medium            |

---

## XAMPP Setup (Database)

### Step 1 — Start XAMPP
1. Open **XAMPP Control Panel**
2. Start **Apache** and **MySQL**

### Step 2 — Create the database
**Option A — phpMyAdmin (easiest)**
1. Open `http://localhost/phpmyadmin`
2. Click **Import** → choose the file `xampp-setup.sql` from this folder
3. Click **Go**

**Option B — MySQL console**
```bash
# Open XAMPP shell or Windows CMD in C:\xampp\mysql\bin\
mysql -u root < C:\path\to\ccs-sitin\xampp-setup.sql
```

### Step 3 — Configure the connection
Open `backend/Rocket.toml` and set your MySQL credentials:
```toml
[default.databases.main]
url = "mysql://root:@localhost:3306/ccs_sitin"
#              ^^^^  ^ change these if you have a password
#              user  password
```
> Default XAMPP MySQL: user = `root`, password = (empty)

---

## Running the Backend

### Prerequisites
- [Rust](https://rustup.rs/) stable
- XAMPP MySQL running (see above)

```bash
cd backend

# Windows — install MySQL C connector if needed
# Download from: https://dev.mysql.com/downloads/connector/c/
# Or use: winget install Oracle.MySQL

cargo run
```

The API starts at **http://localhost:8000**

**Default admin login:** ID `admin` / Password `admin123`

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at **http://localhost:5173**

---

## API Endpoints

### Auth
| Method | Path                  | Auth |
|--------|-----------------------|------|
| POST   | /api/auth/login       | No   |
| POST   | /api/auth/register    | No   |

### Students
| Method | Path                            | Who          |
|--------|---------------------------------|--------------|
| GET    | /api/students/                  | Admin        |
| GET    | /api/students/:id               | Admin / Self |
| POST   | /api/students/                  | Admin        |
| PUT    | /api/students/:id               | Admin        |
| PUT    | /api/students/profile/:id       | Student self |
| DELETE | /api/students/:id               | Admin        |
| POST   | /api/students/reset-sessions    | Admin        |

### Sit-in
| Method | Path                      | Who   |
|--------|---------------------------|-------|
| POST   | /api/sitin/start          | Admin |
| POST   | /api/sitin/end/:id        | Admin |
| GET    | /api/sitin/current        | Admin |
| GET    | /api/sitin/records        | Admin |
| GET    | /api/sitin/student/:id    | Both  |

### Reports & Announcements
| Method | Path                        | Who   |
|--------|-----------------------------|-------|
| GET    | /api/reports/stats          | Admin |
| GET    | /api/reports/by-purpose     | Admin |
| GET    | /api/reports/by-lab         | Admin |
| GET    | /api/announcements/         | All   |
| POST   | /api/announcements/         | Admin |
| DELETE | /api/announcements/:id      | Admin |

---

## Features

### Admin Dashboard
- [bi-bar-chart-fill] Live stats (students, active sit-ins, totals)
- [bi-graph-up] Sessions by purpose + lab (bar charts)
- [bi-megaphone-fill] Post / delete announcements
- [bi-people-fill] Student management — add, edit, delete, search, reset sessions
- [bi-display-fill] Start / end sit-in sessions by student ID
- [bi-journal-text] Full records with status filter
- [bi-bar-chart-steps] Reports breakdown

**Student Features:**
- [bi-ticket-perforated-fill] Remaining sessions counter
- [bi-check2-circle] Active sit-in status
- [bi-megaphone] Announcements feed
- [bi-clock-history] Personal sit-in history
- [bi-pencil-square] Edit profile (name, course, email, address, password)
  - Student ID is always read-only

---

## Project Structure
```
ccs-sitin/
├── xampp-setup.sql          ← run this in phpMyAdmin FIRST
├── backend/
│   ├── Cargo.toml
│   ├── Rocket.toml          ← edit DB credentials here
│   └── src/
│       ├── main.rs
│       ├── db.rs
│       ├── models.rs
│       ├── auth.rs
│       ├── students.rs      ← includes /profile/:id endpoint
│       ├── sitin.rs
│       ├── announcements.rs
│       ├── reports.rs
│       └── cors.rs
└── frontend/
    ├── public/
    │   ├── ccs-logo.jpg
    │   └── uc-logo.png
    └── src/
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── admin/        (Home, Students, Sitin, Records, Reports, Layout)
        │   └── student/
        │       ├── StudentDashboard.jsx
        │       └── EditProfile.jsx    ← new
        └── hooks/useAuth.jsx
```
