use rocket::{http::Status, serde::json::Json};
use rocket_db_pools::Connection;
use serde::{Deserialize, Serialize};
use crate::{auth::{BearerToken, require_admin}, db::Db, models::ApiError};

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Stats {
    pub students_registered: i64,
    pub currently_sitin:     i64,
    pub total_sitin:         i64,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct PurposeStat {
    pub purpose: String,
    pub count:   i64,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct LabStat {
    pub lab:   String,
    pub count: i64,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct LeaderboardEntry {
    pub id_number:       String,
    pub first_name:      String,
    pub last_name:       String,
    pub course:          Option<String>,
    pub profile_picture: Option<String>,  // base64 data URL, may be large
    pub sitin_count:     i64,
}

#[get("/stats")]
pub async fn stats(
    mut db: Connection<Db>,
    token: BearerToken,
) -> Result<Json<Stats>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let registered: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users WHERE role = 'student'")
        .fetch_one(&mut **db).await.unwrap_or((0,));
    let current: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM sit_in_records WHERE status = 'active'")
        .fetch_one(&mut **db).await.unwrap_or((0,));
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM sit_in_records")
        .fetch_one(&mut **db).await.unwrap_or((0,));

    Ok(Json(Stats {
        students_registered: registered.0,
        currently_sitin:     current.0,
        total_sitin:         total.0,
    }))
}

#[get("/by-purpose")]
pub async fn by_purpose(
    mut db: Connection<Db>,
    token: BearerToken,
) -> Result<Json<Vec<PurposeStat>>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    let rows: Vec<PurposeStat> = sqlx::query_as(
        "SELECT purpose, COUNT(*) as count FROM sit_in_records GROUP BY purpose ORDER BY count DESC",
    ).fetch_all(&mut **db).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;
    Ok(Json(rows))
}

#[get("/by-lab")]
pub async fn by_lab(
    mut db: Connection<Db>,
    token: BearerToken,
) -> Result<Json<Vec<LabStat>>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    let rows: Vec<LabStat> = sqlx::query_as(
        "SELECT lab, COUNT(*) as count FROM sit_in_records GROUP BY lab ORDER BY count DESC",
    ).fetch_all(&mut **db).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;
    Ok(Json(rows))
}

/// Public leaderboard — top 5 students by completed sit-in count.
/// No auth required so the landing page can fetch it freely.
#[get("/leaderboard")]
pub async fn leaderboard(
    mut db: Connection<Db>,
) -> Result<Json<Vec<LeaderboardEntry>>, (Status, Json<ApiError>)> {
    let rows: Vec<LeaderboardEntry> = sqlx::query_as(
        "SELECT u.id_number, u.first_name, u.last_name, u.course,
                u.profile_picture,
                COUNT(s.id) AS sitin_count
         FROM sit_in_records s
         JOIN users u ON u.id_number = s.student_id
         WHERE s.status = 'done'
         GROUP BY s.student_id, u.id_number, u.first_name, u.last_name, u.course, u.profile_picture
         ORDER BY sitin_count DESC
         LIMIT 5",
    ).fetch_all(&mut **db).await
    .map_err(|e| {
        eprintln!("LEADERBOARD ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "DB error".into() }))
    })?;

    Ok(Json(rows))
}
