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

        // ── users ─────────────────────────────────────────────────────────
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS users (
                id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
                id_number          VARCHAR(50)  UNIQUE NOT NULL,
                last_name          VARCHAR(100) NOT NULL,
                first_name         VARCHAR(100) NOT NULL,
                middle_name        VARCHAR(100) DEFAULT '',
                course_level       INT          DEFAULT 1,
                password           VARCHAR(255) NOT NULL,
                email              VARCHAR(150) DEFAULT '',
                course             VARCHAR(50)  DEFAULT 'BSIT',
                address            VARCHAR(255) DEFAULT '',
                role               VARCHAR(20)  DEFAULT 'student',
                remaining_sessions INT          DEFAULT 30,
                profile_picture    LONGTEXT     DEFAULT NULL,
                created_at         DATETIME     DEFAULT CURRENT_TIMESTAMP
            )
        "#).execute(pool).await.ok();

        if let Err(e) = sqlx::query(
            "ALTER TABLE users ADD COLUMN profile_picture LONGTEXT DEFAULT NULL"
        ).execute(pool).await {
            // Log but don't crash (expected if column already exists)
            // eprintln!("Migration notice (users.profile_picture): {}", e);
        }

        // ── sit_in_records ────────────────────────────────────────────────
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS sit_in_records (
                id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                student_id   VARCHAR(50)  NOT NULL,
                student_name VARCHAR(255) NOT NULL,
                purpose      VARCHAR(100) NOT NULL,
                lab          VARCHAR(50)  NOT NULL,
                session      INT          DEFAULT 0,
                status       VARCHAR(20)  DEFAULT 'active',
                time_in      DATETIME     DEFAULT CURRENT_TIMESTAMP,
                time_out     DATETIME     NULL,
                FOREIGN KEY (student_id) REFERENCES users(id_number)
            )
        "#).execute(pool).await.ok();

        // ── announcements ─────────────────────────────────────────────────
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS announcements (
                id         BIGINT AUTO_INCREMENT PRIMARY KEY,
                title      VARCHAR(255) DEFAULT '',
                content    TEXT         NOT NULL,
                author     VARCHAR(100) DEFAULT 'CCS Admin',
                created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
            )
        "#).execute(pool).await.ok();

        // ── feedbacks ─────────────────────────────────────────────────────
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS feedbacks (
                id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                sitin_id    BIGINT       NOT NULL,
                student_id  VARCHAR(50)  NOT NULL,
                content     TEXT         NOT NULL,
                rating      TINYINT      DEFAULT NULL,
                admin_reply TEXT         DEFAULT NULL,
                created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
                replied_at  DATETIME     DEFAULT NULL,
                FOREIGN KEY (sitin_id) REFERENCES sit_in_records(id)
            )
        "#).execute(pool).await.ok();

        if let Err(e) = sqlx::query(
            "ALTER TABLE feedbacks ADD COLUMN rating TINYINT DEFAULT NULL"
        ).execute(pool).await {
            // eprintln!("Migration notice (feedbacks.rating): {}", e);
        }

        // ── notifications ─────────────────────────────────────────────────
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS notifications (
                id         BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id    VARCHAR(50)  NOT NULL,
                message    TEXT         NOT NULL,
                is_read    TINYINT(1)   DEFAULT 0,
                notif_type VARCHAR(50)  DEFAULT 'info',
                link       VARCHAR(255) DEFAULT NULL,
                created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id_number)
            )
        "#).execute(pool).await.ok();

        if let Err(e) = sqlx::query(
            "ALTER TABLE notifications ADD COLUMN link VARCHAR(255) DEFAULT NULL"
        ).execute(pool).await {
            // eprintln!("Migration notice (notifications.link): {}", e);
        }

        // ── reservations ──────────────────────────────────────────────────
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS reservations (
                id               BIGINT AUTO_INCREMENT PRIMARY KEY,
                student_id       VARCHAR(50)  NOT NULL,
                student_name     VARCHAR(255) NOT NULL,
                lab              VARCHAR(50)  NOT NULL,
                pc_number        INT          NOT NULL,
                purpose          VARCHAR(100) NOT NULL,
                reservation_date DATE         DEFAULT (CURDATE()),
                time_slot        VARCHAR(50)  DEFAULT NULL,
                status           VARCHAR(20)  DEFAULT 'pending',
                notes            TEXT         DEFAULT NULL,
                requested_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
                resolved_at      DATETIME     NULL,
                resolved_by      VARCHAR(100) DEFAULT NULL,
                FOREIGN KEY (student_id) REFERENCES users(id_number)
            )
        "#).execute(pool).await.ok();

        if let Err(e) = sqlx::query(
            "ALTER TABLE reservations ADD COLUMN reservation_date DATE DEFAULT (CURDATE())"
        ).execute(pool).await {
            // eprintln!("Migration notice (reservation_date): {}", e);
        }

        if let Err(e) = sqlx::query(
            "ALTER TABLE reservations ADD COLUMN time_slot VARCHAR(50) DEFAULT NULL"
        ).execute(pool).await {
            // eprintln!("Migration notice (time_slot): {}", e);
        }

        // ── pc_status ─────────────────────────────────────────────────────
        sqlx::query(r#"
            CREATE TABLE IF NOT EXISTS pc_status (
                id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                lab         VARCHAR(50) NOT NULL,
                pc_number   INT         NOT NULL,
                is_disabled TINYINT(1)  DEFAULT 0,
                UNIQUE KEY uq_lab_pc (lab, pc_number)
            )
        "#).execute(pool).await.ok();

        // ── Indexes ───────────────────────────────────────────────────────
        // Note: MySQL 8.0 does not support CREATE INDEX IF NOT EXISTS.
        // These will fail gracefully if they already exist because of .ok().
        sqlx::query("CREATE INDEX idx_sitin_student ON sit_in_records(student_id, status)").execute(pool).await.ok();
        sqlx::query("CREATE INDEX idx_sitin_status ON sit_in_records(status)").execute(pool).await.ok();
        sqlx::query("CREATE INDEX idx_res_conflict ON reservations(lab, pc_number, reservation_date, time_slot, status)").execute(pool).await.ok();
        sqlx::query("CREATE INDEX idx_res_student ON reservations(student_id, reservation_date)").execute(pool).await.ok();
        sqlx::query("CREATE INDEX idx_notif_user ON notifications(user_id, is_read, created_at)").execute(pool).await.ok();
        sqlx::query("CREATE INDEX idx_feedback_sitin ON feedbacks(sitin_id)").execute(pool).await.ok();
        sqlx::query("CREATE INDEX idx_feedback_student ON feedbacks(student_id)").execute(pool).await.ok();

        // ── Seed admin ────────────────────────────────────────────────────
        let admin_exists: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM users WHERE role = 'admin'"
        ).fetch_one(pool).await.unwrap_or((0,));

        if admin_exists.0 == 0 {
            let hashed = bcrypt::hash("admin123", bcrypt::DEFAULT_COST).unwrap();
            sqlx::query(
                "INSERT INTO users
                     (id_number, last_name, first_name, password, role, remaining_sessions)
                 VALUES ('admin', 'Admin', 'CCS', ?, 'admin', 9999)"
            ).bind(&hashed).execute(pool).await.ok();
        }

        Ok(rocket)
    }
}
