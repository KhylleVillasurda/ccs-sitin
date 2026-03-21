use rocket::{http::Status, serde::json::Json};
use rocket_db_pools::Connection;
use crate::{auth::{BearerToken, require_admin}, db::Db, models::*};

#[get("/")]
pub async fn list(
    mut db: Connection<Db>,
    token: BearerToken,
) -> Result<Json<Vec<PublicUser>>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let users: Vec<User> = sqlx::query_as(
        "SELECT * FROM users WHERE role = 'student' ORDER BY last_name ASC",
    )
    .fetch_all(&mut **db)
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    Ok(Json(users.into_iter().map(|u| u.into()).collect()))
}

#[get("/<id_number>")]
pub async fn get_by_id(
    mut db: Connection<Db>,
    id_number: &str,
    token: BearerToken,
) -> Result<Json<PublicUser>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let user: Option<User> =
        sqlx::query_as("SELECT * FROM users WHERE id_number = ?")
            .bind(id_number)
            .fetch_optional(&mut **db)
            .await
            .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    user.map(|u| Json(u.into()))
        .ok_or((Status::NotFound, Json(ApiError { error: "Student not found".into() })))
}

#[put("/<id_number>", data = "<req>")]
pub async fn update(
    mut db: Connection<Db>,
    id_number: &str,
    req: Json<UpdateStudentRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    sqlx::query(
        "UPDATE users SET
            last_name            = COALESCE(?, last_name),
            first_name           = COALESCE(?, first_name),
            middle_name          = COALESCE(?, middle_name),
            course_level         = COALESCE(?, course_level),
            email                = COALESCE(?, email),
            course               = COALESCE(?, course),
            address              = COALESCE(?, address),
            remaining_sessions   = COALESCE(?, remaining_sessions)
         WHERE id_number = ?",
    )
    .bind(&req.last_name)
    .bind(&req.first_name)
    .bind(&req.middle_name)
    .bind(req.course_level)
    .bind(&req.email)
    .bind(&req.course)
    .bind(&req.address)
    .bind(req.remaining_sessions)
    .bind(id_number)
    .execute(&mut **db)
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;

    Ok(Json(ApiSuccess { message: "Student updated".into() }))
}

#[delete("/<id_number>")]
pub async fn delete(
    mut db: Connection<Db>,
    id_number: &str,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    sqlx::query("DELETE FROM users WHERE id_number = ? AND role = 'student'")
        .bind(id_number)
        .execute(&mut **db)
        .await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Delete failed".into() })))?;

    Ok(Json(ApiSuccess { message: "Student deleted".into() }))
}

#[post("/", data = "<req>")]
pub async fn add(
    mut db: Connection<Db>,
    req: Json<RegisterRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let hashed = bcrypt::hash(&req.password, bcrypt::DEFAULT_COST)
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Hash error".into() })))?;

    sqlx::query(
        "INSERT INTO users (id_number, last_name, first_name, middle_name, course_level, \
         password, email, course, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&req.id_number)
    .bind(&req.last_name)
    .bind(&req.first_name)
    .bind(req.middle_name.as_deref().unwrap_or(""))
    .bind(req.course_level.unwrap_or(1))
    .bind(&hashed)
    .bind(req.email.as_deref().unwrap_or(""))
    .bind(req.course.as_deref().unwrap_or("BSIT"))
    .bind(req.address.as_deref().unwrap_or(""))
    .execute(&mut **db)
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Insert failed".into() })))?;

    Ok(Json(ApiSuccess { message: "Student added".into() }))
}

#[post("/reset-sessions")]
pub async fn reset_all_sessions(
    mut db: Connection<Db>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    sqlx::query("UPDATE users SET remaining_sessions = 30 WHERE role = 'student'")
        .execute(&mut **db)
        .await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Reset failed".into() })))?;

    Ok(Json(ApiSuccess { message: "All sessions reset to 30".into() }))
}
