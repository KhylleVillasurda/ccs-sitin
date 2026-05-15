use rocket::{http::Status, serde::json::Json, State};
use crate::{
    auth::{BearerToken, require_admin, verify_token},
    db::Db, models::*,
};

#[post("/start", data = "<req>")]
pub async fn start_sitin(
    db: &State<Db>,
    req: Json<SitInRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let student: Option<User> = sqlx::query_as(
        "SELECT * FROM users WHERE id_number = ? AND role = 'student'"
    ).bind(&req.student_id).fetch_optional(db.inner()).await
    .map_err(|e| {
        eprintln!("SITIN START DB ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;

    let student = student.ok_or((
        Status::NotFound,
        Json(ApiError { error: "Student not found".into() })
    ))?;

    if student.remaining_sessions <= 0 {
        return Err((Status::BadRequest, Json(ApiError { error: "No remaining sessions".into() })));
    }

    let active: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM sit_in_records WHERE student_id = ? AND status = 'active'"
    ).bind(&req.student_id).fetch_one(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Database error".into() })))?;

    if active.0 > 0 {
        return Err((Status::Conflict, Json(ApiError { error: "Student is already sitting in".into() })));
    }

    let student_name = format!("{} {}", student.first_name, student.last_name);

    sqlx::query(
        "INSERT INTO sit_in_records (student_id, student_name, purpose, lab, session)
         VALUES (?, ?, ?, ?, ?)"
    ).bind(&req.student_id).bind(&student_name).bind(&req.purpose)
     .bind(&req.lab).bind(student.remaining_sessions)
     .execute(db.inner()).await
    .map_err(|e| {
        eprintln!("SITIN INSERT ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Failed to start sit-in".into() }))
    })?;

    sqlx::query(
        "UPDATE users SET remaining_sessions = remaining_sessions - 1 WHERE id_number = ?"
    ).bind(&req.student_id).execute(db.inner()).await.ok();

    Ok(Json(ApiSuccess { message: "Sit-in started".into() }))
}

#[post("/end/<sit_id>")]
pub async fn end_sitin(
    db: &State<Db>,
    sit_id: i64,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    sqlx::query(
        "UPDATE sit_in_records SET status = 'done', time_out = NOW()
         WHERE id = ? AND status = 'active'"
    ).bind(sit_id).execute(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;

    Ok(Json(ApiSuccess { message: "Sit-in ended".into() }))
}

#[get("/current")]
pub async fn current(
    db: &State<Db>,
    token: BearerToken,
) -> Result<Json<Vec<SitInRecord>>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let records: Vec<SitInRecord> = sqlx::query_as(
        "SELECT * FROM sit_in_records WHERE status = 'active' ORDER BY time_in DESC"
    ).fetch_all(db.inner()).await
    .map_err(|e| {
        eprintln!("CURRENT SITIN ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;

    Ok(Json(records))
}

#[get("/records")]
pub async fn records(
    db: &State<Db>,
    token: BearerToken,
) -> Result<Json<Vec<SitInRecord>>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let records: Vec<SitInRecord> = sqlx::query_as(
        "SELECT * FROM sit_in_records ORDER BY time_in DESC"
    ).fetch_all(db.inner()).await
    .map_err(|e| {
        eprintln!("RECORDS ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;

    Ok(Json(records))
}

#[get("/student/<id_number>")]
pub async fn student_records(
    db: &State<Db>,
    id_number: &str,
    token: BearerToken,
) -> Result<Json<Vec<SitInRecord>>, (Status, Json<ApiError>)> {
    verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    let records: Vec<SitInRecord> = sqlx::query_as(
        "SELECT * FROM sit_in_records WHERE student_id = ? ORDER BY time_in DESC"
    ).bind(id_number).fetch_all(db.inner()).await
    .map_err(|e| {
        eprintln!("STUDENT RECORDS ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Database error".into() }))
    })?;

    Ok(Json(records))
}
