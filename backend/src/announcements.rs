use rocket::{http::Status, serde::json::Json, State};
use crate::{auth::{BearerToken, require_admin}, db::Db, models::*};

#[get("/")]
pub async fn list(
    db: &State<Db>,
) -> Result<Json<Vec<Announcement>>, (Status, Json<ApiError>)> {
    let items: Vec<Announcement> = sqlx::query_as(
        "SELECT * FROM announcements ORDER BY created_at DESC"
    ).fetch_all(db.inner()).await
    .map_err(|e| {
        eprintln!("ANNOUNCEMENTS LIST ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;
    Ok(Json(items))
}

#[post("/", data = "<req>")]
pub async fn create(
    db: &State<Db>,
    req: Json<AnnouncementRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    sqlx::query("INSERT INTO announcements (title, content) VALUES (?, ?)")
        .bind(req.title.as_deref().unwrap_or(""))
        .bind(&req.content)
        .execute(db.inner()).await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Insert failed".into() })))?;
    Ok(Json(ApiSuccess { message: "Announcement posted".into() }))
}

#[delete("/<id>")]
pub async fn delete_announcement(
    db: &State<Db>,
    id: i64,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    sqlx::query("DELETE FROM announcements WHERE id = ?")
        .bind(id)
        .execute(db.inner()).await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Delete failed".into() })))?;
    Ok(Json(ApiSuccess { message: "Announcement deleted".into() }))
}
