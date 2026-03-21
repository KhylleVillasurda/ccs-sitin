use rocket::{http::Status, serde::json::Json};
use rocket_db_pools::Connection;
use crate::{auth::{BearerToken, require_admin, verify_token}, db::Db, models::*};

#[get("/")]
pub async fn list(
    mut db: Connection<Db>,
    token: BearerToken,
) -> Result<Json<Vec<PublicUser>>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    let users: Vec<User> = sqlx::query_as(
        "SELECT * FROM users WHERE role = 'student' ORDER BY last_name ASC"
    ).fetch_all(&mut **db).await
    .map_err(|e| { eprintln!("LIST ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "DB error".into() })) })?;
    Ok(Json(users.into_iter().map(|u| u.into()).collect()))
}

#[get("/<id_number>")]
pub async fn get_by_id(
    mut db: Connection<Db>,
    id_number: &str,
    token: BearerToken,
) -> Result<Json<PublicUser>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;
    if claims.role != "admin" && claims.sub != id_number {
        return Err((Status::Forbidden, Json(ApiError { error: "Access denied".into() })));
    }
    let user: Option<User> = sqlx::query_as("SELECT * FROM users WHERE id_number = ?")
        .bind(id_number).fetch_optional(&mut **db).await
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
            last_name          = COALESCE(?, last_name),
            first_name         = COALESCE(?, first_name),
            middle_name        = COALESCE(?, middle_name),
            course_level       = COALESCE(?, course_level),
            email              = COALESCE(?, email),
            course             = COALESCE(?, course),
            address            = COALESCE(?, address),
            remaining_sessions = COALESCE(?, remaining_sessions)
         WHERE id_number = ?",
    )
    .bind(&req.last_name).bind(&req.first_name).bind(&req.middle_name)
    .bind(req.course_level).bind(&req.email).bind(&req.course)
    .bind(&req.address).bind(req.remaining_sessions).bind(id_number)
    .execute(&mut **db).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;
    Ok(Json(ApiSuccess { message: "Student updated".into() }))
}

#[put("/profile/<id_number>", data = "<req>")]
pub async fn update_profile(
    mut db: Connection<Db>,
    id_number: &str,
    req: Json<UpdateProfileRequest>,
    token: BearerToken,
) -> Result<Json<PublicUser>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;
    if claims.sub != id_number {
        return Err((Status::Forbidden, Json(ApiError { error: "You can only edit your own profile".into() })));
    }

    // Handle password change
    if let Some(ref new_pw) = req.new_password {
        let user: Option<User> = sqlx::query_as("SELECT * FROM users WHERE id_number = ?")
            .bind(id_number).fetch_optional(&mut **db).await
            .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;
        let user = user.ok_or((Status::NotFound, Json(ApiError { error: "User not found".into() })))?;
        let current_pw = req.current_password.as_deref().unwrap_or("");
        if !bcrypt::verify(current_pw, &user.password).unwrap_or(false) {
            return Err((Status::Unauthorized, Json(ApiError { error: "Current password is incorrect".into() })));
        }
        let hashed = bcrypt::hash(new_pw, bcrypt::DEFAULT_COST)
            .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Hash error".into() })))?;
        sqlx::query(
            "UPDATE users SET
                last_name       = COALESCE(?, last_name),
                first_name      = COALESCE(?, first_name),
                middle_name     = COALESCE(?, middle_name),
                course_level    = COALESCE(?, course_level),
                email           = COALESCE(?, email),
                course          = COALESCE(?, course),
                address         = COALESCE(?, address),
                profile_picture = COALESCE(?, profile_picture),
                password        = ?
             WHERE id_number = ?",
        )
        .bind(&req.last_name).bind(&req.first_name).bind(&req.middle_name)
        .bind(req.course_level).bind(&req.email).bind(&req.course)
        .bind(&req.address).bind(&req.profile_picture).bind(&hashed).bind(id_number)
        .execute(&mut **db).await
        .map_err(|e| { eprintln!("PROFILE UPDATE ERROR: {}", e);
            (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })) })?;
    } else {
        // Handle picture removal
        if req.profile_picture.as_deref() == Some("remove") {
            sqlx::query(
                "UPDATE users SET
                    last_name       = COALESCE(?, last_name),
                    first_name      = COALESCE(?, first_name),
                    middle_name     = COALESCE(?, middle_name),
                    course_level    = COALESCE(?, course_level),
                    email           = COALESCE(?, email),
                    course          = COALESCE(?, course),
                    address         = COALESCE(?, address),
                    profile_picture = NULL
                 WHERE id_number = ?",
            )
            .bind(&req.last_name).bind(&req.first_name).bind(&req.middle_name)
            .bind(req.course_level).bind(&req.email).bind(&req.course)
            .bind(&req.address).bind(id_number)
            .execute(&mut **db).await
            .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;
        } else {
            sqlx::query(
                "UPDATE users SET
                    last_name       = COALESCE(?, last_name),
                    first_name      = COALESCE(?, first_name),
                    middle_name     = COALESCE(?, middle_name),
                    course_level    = COALESCE(?, course_level),
                    email           = COALESCE(?, email),
                    course          = COALESCE(?, course),
                    address         = COALESCE(?, address),
                    profile_picture = COALESCE(?, profile_picture)
                 WHERE id_number = ?",
            )
            .bind(&req.last_name).bind(&req.first_name).bind(&req.middle_name)
            .bind(req.course_level).bind(&req.email).bind(&req.course)
            .bind(&req.address).bind(&req.profile_picture).bind(id_number)
            .execute(&mut **db).await
            .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;
        }
    }

    // Return the updated user so the frontend can refresh context immediately
    let updated: User = sqlx::query_as("SELECT * FROM users WHERE id_number = ?")
        .bind(id_number).fetch_one(&mut **db).await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Fetch failed".into() })))?;
    Ok(Json(updated.into()))
}

#[delete("/<id_number>")]
pub async fn delete(
    mut db: Connection<Db>,
    id_number: &str,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    sqlx::query("DELETE FROM users WHERE id_number = ? AND role = 'student'")
        .bind(id_number).execute(&mut **db).await
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
        "INSERT INTO users (id_number, last_name, first_name, middle_name, course_level,
         password, email, course, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&req.id_number).bind(&req.last_name).bind(&req.first_name)
    .bind(req.middle_name.as_deref().unwrap_or(""))
    .bind(req.course_level.unwrap_or(1))
    .bind(&hashed)
    .bind(req.email.as_deref().unwrap_or(""))
    .bind(req.course.as_deref().unwrap_or("BSIT"))
    .bind(req.address.as_deref().unwrap_or(""))
    .execute(&mut **db).await
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
        .execute(&mut **db).await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Reset failed".into() })))?;
    Ok(Json(ApiSuccess { message: "All sessions reset to 30".into() }))
}
