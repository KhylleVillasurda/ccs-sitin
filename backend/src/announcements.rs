use rocket::{http::Status, serde::json::Json};
use rocket_db_pools::Connection;
use crate::{auth::{BearerToken, require_admin}, db::Db, models::*};

#[get("/")]
pub async fn list(
    mut db: Connection<Db>,
) -> Result<Json<Vec<Announcement>>, (Status, Json<ApiError>)> {
    let items: Vec<Announcement> = sqlx::query_as(
        "SELECT * FROM announcements ORDER BY created_at DESC"
    ).fetch_all(&mut **db).await
    .map_err(|e| {
        eprintln!("ANNOUNCEMENTS LIST ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;
    Ok(Json(items))
}

#[post("/", data = "<req>")]
pub async fn create(
    mut db: Connection<Db>,
    req: Json<AnnouncementRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    sqlx::query("INSERT INTO announcements (title, content) VALUES (?, ?)")
        .bind(req.title.as_deref().unwrap_or(""))
        .bind(&req.content)
        .execute(&mut **db).await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Insert failed".into() })))?;
    Ok(Json(ApiSuccess { message: "Announcement posted".into() }))
}

#[delete("/<id>")]
pub async fn delete_announcement(
    mut db: Connection<Db>,
    id: i64,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    sqlx::query("DELETE FROM announcements WHERE id = ?")
        .bind(id)
        .execute(&mut **db).await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Delete failed".into() })))?;
    Ok(Json(ApiSuccess { message: "Announcement deleted".into() }))
}
