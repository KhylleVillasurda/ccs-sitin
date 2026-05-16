use rocket::{http::Status, serde::json::Json, State};
use crate::{
    auth::{require_admin, verify_token},
    db::Db,
    models::*,
};

/// Student submits anonymous feedback (with optional mood rating) for a completed sit-in.
#[post("/", data = "<req>")]
pub async fn submit(
    db: &State<Db>,
    req: Json<FeedbackRequest>,
    token: crate::auth::BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    if claims.role != "student" {
        return Err((Status::Forbidden, Json(ApiError { error: "Students only".into() })));
    }

    // Validate rating range if provided
    if let Some(r) = req.rating {
        if !(1..=5).contains(&r) {
            return Err((Status::BadRequest, Json(ApiError { error: "Rating must be between 1 and 5".into() })));
        }
    }

    // Verify the sitin belongs to this student and is done
    let sitin: Option<(i64, String, String)> = sqlx::query_as(
        "SELECT id, student_id, status FROM sit_in_records WHERE id = ? AND student_id = ?"
    )
    .bind(req.sitin_id)
    .bind(&claims.sub)
    .fetch_optional(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Database error".into() })))?;

    let (_, _, status) = sitin.ok_or((
        Status::NotFound,
        Json(ApiError { error: "Sit-in record not found".into() }),
    ))?;

    if status != "done" {
        return Err((Status::BadRequest, Json(ApiError { error: "Can only submit feedback for completed sit-ins".into() })));
    }

    // Prevent duplicate feedback
    let exists: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM feedbacks WHERE sitin_id = ? AND student_id = ?"
    )
    .bind(req.sitin_id)
    .bind(&claims.sub)
    .fetch_one(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Database error".into() })))?;

    if exists.0 > 0 {
        return Err((Status::Conflict, Json(ApiError { error: "Feedback already submitted for this session".into() })));
    }

    // Insert feedback
    sqlx::query(
        "INSERT INTO feedbacks (sitin_id, student_id, content, rating) VALUES (?, ?, ?, ?)"
    )
    .bind(req.sitin_id)
    .bind(&claims.sub)
    .bind(&req.content)
    .bind(req.rating)
    .execute(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Failed to save feedback".into() })))?;

    // Notify all admins
    sqlx::query(
        "INSERT INTO notifications (user_id, message, notif_type, link)
         SELECT id_number, 'A new anonymous feedback has been submitted.', 'feedback', ?
         FROM users WHERE role = 'admin'"
    )
    .bind(format!("/admin/feedbacks?id={}", req.sitin_id))
    .execute(db.inner())
    .await
    .ok();

    Ok(Json(ApiSuccess { message: "Feedback submitted. Thank you!".into() }))
}

/// Admin: list all feedbacks (anonymised — no student identity)
#[get("/")]
pub async fn list(
    db: &State<Db>,
    token: crate::auth::BearerToken,
) -> Result<Json<Vec<FeedbackView>>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let feedbacks: Vec<FeedbackView> = sqlx::query_as(
        "SELECT f.id, f.sitin_id, s.purpose, s.lab,
                f.content, f.rating, f.admin_reply, f.is_testimonial, f.created_at, f.replied_at
         FROM feedbacks f
         JOIN sit_in_records s ON s.id = f.sitin_id
         ORDER BY f.created_at DESC"
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| {
        eprintln!("FEEDBACK LIST ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;

    Ok(Json(feedbacks))
}

/// Admin: toggle testimonial status of a feedback
#[post("/<id>/testimonial")]
pub async fn toggle_testimonial(
    db: &State<Db>,
    id: i64,
    token: crate::auth::BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    sqlx::query(
        "UPDATE feedbacks SET is_testimonial = NOT is_testimonial WHERE id = ?"
    )
    .bind(id)
    .execute(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Failed to update testimonial status".into() })))?;

    Ok(Json(ApiSuccess { message: "Testimonial status updated.".into() }))
}

/// Public: list all feedbacks marked as testimonials
#[get("/testimonials")]
pub async fn list_testimonials(
    db: &State<Db>,
) -> Result<Json<Vec<TestimonialView>>, (Status, Json<ApiError>)> {
    let testimonials: Vec<TestimonialView> = sqlx::query_as(
        "SELECT f.id, f.content, f.rating, s.student_name, f.created_at
         FROM feedbacks f
         JOIN sit_in_records s ON s.id = f.sitin_id
         WHERE f.is_testimonial = 1
         ORDER BY f.created_at DESC"
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| {
        eprintln!("TESTIMONIAL LIST ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;

    Ok(Json(testimonials))
}

/// Admin: reply to a feedback (optional remark — not anonymous)
#[post("/<id>/reply", data = "<req>")]
pub async fn reply(
    db: &State<Db>,
    id: i64,
    req: Json<AdminReplyRequest>,
    token: crate::auth::BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    let claims = require_admin(&token.0)?;

    let row: Option<(i64, String)> = sqlx::query_as(
        "SELECT id, student_id FROM feedbacks WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Database error".into() })))?;

    let (_, student_id) = row.ok_or((
        Status::NotFound,
        Json(ApiError { error: "Feedback not found".into() }),
    ))?;

    sqlx::query(
        "UPDATE feedbacks SET admin_reply = ?, replied_at = NOW() WHERE id = ?"
    )
    .bind(&req.reply)
    .bind(id)
    .execute(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Failed to save reply".into() })))?;

    // Notify the student (admin is identified by name)
    let msg = format!("The administrator ({}) left a remark on your feedback.", claims.name);
    sqlx::query(
        "INSERT INTO notifications (user_id, message, notif_type, link) VALUES (?, ?, 'remark', ?)"
    )
    .bind(&student_id)
    .bind(&msg)
    .bind(format!("/student?feedback={}", id)) // id is the feedback id
    .execute(db.inner())
    .await
    .ok();

    Ok(Json(ApiSuccess { message: "Reply sent to student.".into() }))
}

/// Student: get list of sitin_ids they've already submitted feedback for
#[get("/my")]
pub async fn my_feedbacks(
    db: &State<Db>,
    token: crate::auth::BearerToken,
) -> Result<Json<Vec<i64>>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    let rows: Vec<(i64,)> = sqlx::query_as(
        "SELECT sitin_id FROM feedbacks WHERE student_id = ?"
    )
    .bind(&claims.sub)
    .fetch_all(db.inner())
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Database error".into() })))?;

    Ok(Json(rows.into_iter().map(|(id,)| id).collect()))
}

/// Student: get their full feedback history including admin replies
#[get("/my/full")]
pub async fn my_feedbacks_full(
    db: &State<Db>,
    token: crate::auth::BearerToken,
) -> Result<Json<Vec<MyFeedbackEntry>>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    let entries: Vec<MyFeedbackEntry> = sqlx::query_as(
        "SELECT f.id, f.sitin_id, s.purpose, s.lab, s.pc_number,
                f.content, f.rating, f.admin_reply, f.created_at, f.replied_at
         FROM feedbacks f
         JOIN sit_in_records s ON s.id = f.sitin_id
         WHERE f.student_id = ?
         ORDER BY f.created_at DESC"
    )
    .bind(&claims.sub)
    .fetch_all(db.inner())
    .await
    .map_err(|e| {
        eprintln!("MY FEEDBACK FULL ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;

    Ok(Json(entries))
}
