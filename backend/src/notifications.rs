use rocket::{http::Status, serde::json::Json, State};
use crate::{
    auth::verify_token,
    db::Db,
    models::*,
};

/// Get notifications for the currently logged-in user (student or admin)
#[get("/")]
pub async fn list(
    db: &State<Db>,
    token: crate::auth::BearerToken,
) -> Result<Json<Vec<Notification>>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    let notifs: Vec<Notification> = sqlx::query_as(
        "SELECT id, user_id, message, is_read, notif_type, link, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY created_at DESC LIMIT 50"
    )
    .bind(&claims.sub)
    .fetch_all(db.inner())
    .await
    .map_err(|e| {
        eprintln!("NOTIF LIST ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;

    Ok(Json(notifs))
}

/// Get unread notification count for polling
#[get("/count")]
pub async fn count(
    db: &State<Db>,
    token: crate::auth::BearerToken,
) -> Result<Json<NotifCount>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    let (unread,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0"
    )
    .bind(&claims.sub)
    .fetch_one(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Database error".into() })))?;

    Ok(Json(NotifCount { unread }))
}

/// Mark a single notification as read
#[post("/<id>/read")]
pub async fn mark_read(
    db: &State<Db>,
    id: i64,
    token: crate::auth::BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    sqlx::query(
        "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?"
    )
    .bind(id)
    .bind(&claims.sub)
    .execute(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;

    Ok(Json(ApiSuccess { message: "Marked as read".into() }))
}

/// Mark all notifications as read
#[post("/read-all")]
pub async fn mark_all_read(
    db: &State<Db>,
    token: crate::auth::BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    sqlx::query(
        "UPDATE notifications SET is_read = 1 WHERE user_id = ?"
    )
    .bind(&claims.sub)
    .execute(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;

    Ok(Json(ApiSuccess { message: "All notifications marked as read".into() }))
}
