use rocket::fairing::{self, Fairing, Info, Kind};
use rocket::{Rocket, Build};
use rocket_db_pools::Database;
use sqlx::MySqlPool;

#[derive(Database)]
#[database("main")]
pub struct Db(MySqlPool);

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

        // Users table
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS users (
                id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                id_number       VARCHAR(50) UNIQUE NOT NULL,
                last_name       VARCHAR(100) NOT NULL,
                first_name      VARCHAR(100) NOT NULL,
                middle_name     VARCHAR(100) DEFAULT '',
                course_level    INT DEFAULT 1,
                password        VARCHAR(255) NOT NULL,
                email           VARCHAR(150) DEFAULT '',
                course          VARCHAR(50) DEFAULT 'BSIT',
                address         VARCHAR(255) DEFAULT '',
                role            VARCHAR(20) DEFAULT 'student',
                remaining_sessions INT DEFAULT 30,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        "#).execute(pool).await.ok();

        // Sit-in records table
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS sit_in_records (
                id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                student_id      VARCHAR(50) NOT NULL,
                student_name    VARCHAR(255) NOT NULL,
                purpose         VARCHAR(100) NOT NULL,
                lab             VARCHAR(50) NOT NULL,
                session         INT DEFAULT 0,
                status          VARCHAR(20) DEFAULT 'active',
                time_in         DATETIME DEFAULT CURRENT_TIMESTAMP,
                time_out        DATETIME NULL,
                FOREIGN KEY (student_id) REFERENCES users(id_number)
            )
        "#).execute(pool).await.ok();

        // Announcements table
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS announcements (
                id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                title       VARCHAR(255) DEFAULT '',
                content     TEXT NOT NULL,
                author      VARCHAR(100) DEFAULT 'CCS Admin',
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        "#).execute(pool).await.ok();

        // Feedbacks table (anonymised — no student_id column exposed to admin)
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS feedbacks (
                id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                sitin_id    BIGINT NOT NULL,
                student_id  VARCHAR(50) NOT NULL,
                content     TEXT NOT NULL,
                admin_reply TEXT DEFAULT NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                replied_at  DATETIME DEFAULT NULL,
                FOREIGN KEY (sitin_id) REFERENCES sit_in_records(id)
            )
        "#).execute(pool).await.ok();

        // Add rating column to feedbacks if it doesn't exist (migration)
        sqlx::query(r#"
            ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS rating TINYINT DEFAULT NULL
        "#).execute(pool).await.ok();

        // Notifications table
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS notifications (
                id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id     VARCHAR(50) NOT NULL,
                message     TEXT NOT NULL,
                is_read     TINYINT(1) DEFAULT 0,
                notif_type  VARCHAR(50) DEFAULT 'info',
                link        VARCHAR(255) DEFAULT NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id_number)
            )
        "#).execute(pool).await.ok();

        // Migration: Add link column if not exists
        sqlx::query(r#"
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(255) DEFAULT NULL
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
