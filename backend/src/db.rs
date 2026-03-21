use rocket::{fairing::{self, Fairing, Info, Kind}, Rocket, Build};
use rocket_db_pools::Database;
use sqlx::SqlitePool;

#[derive(Database)]
#[database("main")]
pub struct Db(SqlitePool);

pub struct DbInitFairing;

#[rocket::async_trait]
impl Fairing for DbInitFairing {
    fn info(&self) -> Info {
        Info { name: "DB Init", kind: Kind::Ignite }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> fairing::Result {
        let db = match Db::fetch(&rocket) {
            Some(db) => db,
            None => return Err(rocket),
        };

        let pool = &db.0;

        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_number TEXT UNIQUE NOT NULL,
                last_name TEXT NOT NULL,
                first_name TEXT NOT NULL,
                middle_name TEXT DEFAULT '',
                course_level INTEGER DEFAULT 1,
                password TEXT NOT NULL,
                email TEXT DEFAULT '',
                course TEXT DEFAULT 'BSIT',
                address TEXT DEFAULT '',
                role TEXT DEFAULT 'student',
                remaining_sessions INTEGER DEFAULT 30,
                created_at TEXT DEFAULT (datetime('now'))
            )
        "#).execute(pool).await.ok();

        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS sit_in_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                student_name TEXT NOT NULL,
                purpose TEXT NOT NULL,
                lab TEXT NOT NULL,
                session INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                time_in TEXT DEFAULT (datetime('now')),
                time_out TEXT,
                FOREIGN KEY (student_id) REFERENCES users(id_number)
            )
        "#).execute(pool).await.ok();

        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT DEFAULT '',
                content TEXT NOT NULL,
                author TEXT DEFAULT 'CCS Admin',
                created_at TEXT DEFAULT (datetime('now'))
            )
        "#).execute(pool).await.ok();

        // Seed default admin if not exists
        let admin_exists: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM users WHERE role = 'admin'"
        ).fetch_one(pool).await.unwrap_or((0,));

        if admin_exists.0 == 0 {
            let hashed = bcrypt::hash("admin123", bcrypt::DEFAULT_COST).unwrap();
            sqlx::query(
                "INSERT INTO users (id_number, last_name, first_name, password, role, remaining_sessions)
                 VALUES ('admin', 'Admin', 'CCS', ?, 'admin', 9999)"
            ).bind(&hashed).execute(pool).await.ok();
        }

        Ok(rocket)
    }
}
