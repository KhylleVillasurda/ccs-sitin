use rocket::{http::Status, serde::json::Json, State};
use serde::{Deserialize, Serialize};
use crate::{
    auth::{BearerToken, require_admin, verify_token},
    db::Db,
    models::{ApiError, ApiSuccess},
};

// ── Models ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct LabSoftware {
    pub id:          i64,
    pub lab:         String,
    pub name:        String,
    pub icon:        Option<String>,   // Bootstrap-icon class, e.g. "bi-code-slash"
    pub description: Option<String>,
    pub version:     Option<String>,
    pub category:    Option<String>,   // e.g. "IDE", "Networking", "Utilities"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LabSoftwareRequest {
    pub lab:         String,
    pub name:        String,
    pub icon:        Option<String>,
    pub description: Option<String>,
    pub version:     Option<String>,
    pub category:    Option<String>,
}

// ── GET /api/lab-software?lab=524 ─────────────────────────────────────────
// Accessible to any authenticated user (students need to see this).
#[get("/?<lab>")]
pub async fn list_software(
    db: &State<Db>,
    lab: Option<String>,
    token: BearerToken,
) -> Result<Json<Vec<LabSoftware>>, (Status, Json<ApiError>)> {
    verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    let rows: Vec<LabSoftware> = if let Some(l) = lab {
        sqlx::query_as(
            "SELECT id, lab, name, icon, description, version, category
             FROM lab_software WHERE lab = ? ORDER BY category, name"
        ).bind(l).fetch_all(db.inner()).await
    } else {
        sqlx::query_as(
            "SELECT id, lab, name, icon, description, version, category
             FROM lab_software ORDER BY lab, category, name"
        ).fetch_all(db.inner()).await
    }.map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    Ok(Json(rows))
}

// ── POST /api/lab-software  (admin only) ──────────────────────────────────
#[post("/", data = "<req>")]
pub async fn add_software(
    db: &State<Db>,
    req: Json<LabSoftwareRequest>,
    token: BearerToken,
) -> Result<Json<LabSoftware>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    if req.name.trim().is_empty() {
        return Err((Status::BadRequest, Json(ApiError { error: "Software name is required".into() })));
    }
    if req.lab.trim().is_empty() {
        return Err((Status::BadRequest, Json(ApiError { error: "Lab is required".into() })));
    }

    let id: (i64,) = sqlx::query_as(
        "INSERT INTO lab_software (lab, name, icon, description, version, category)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING id"
    )
    .bind(&req.lab)
    .bind(req.name.trim())
    .bind(&req.icon)
    .bind(&req.description)
    .bind(&req.version)
    .bind(&req.category)
    .fetch_one(db.inner()).await
    .map_err(|e| {
        eprintln!("ADD SOFTWARE ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Failed to add software".into() }))
    })?;

    let row: LabSoftware = sqlx::query_as(
        "SELECT id, lab, name, icon, description, version, category FROM lab_software WHERE id = ?"
    ).bind(id.0).fetch_one(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    Ok(Json(row))
}

// ── DELETE /api/lab-software/<id>  (admin only) ──────────────────────────
#[delete("/<id>")]
pub async fn remove_software(
    db: &State<Db>,
    id: i64,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let result = sqlx::query("DELETE FROM lab_software WHERE id = ?")
        .bind(id)
        .execute(db.inner()).await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    if result.rows_affected() == 0 {
        return Err((Status::NotFound, Json(ApiError { error: "Software entry not found".into() })));
    }

    Ok(Json(ApiSuccess { message: "Software removed.".into() }))
}

// ── PUT /api/lab-software/<id>  (admin only) ──────────────────────────────
#[put("/<id>", data = "<req>")]
pub async fn update_software(
    db: &State<Db>,
    id: i64,
    req: Json<LabSoftwareRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    if req.name.trim().is_empty() {
        return Err((Status::BadRequest, Json(ApiError { error: "Software name is required".into() })));
    }

    sqlx::query(
        "UPDATE lab_software SET name=?, icon=?, description=?, version=?, category=?, lab=?
         WHERE id = ?"
    )
    .bind(req.name.trim())
    .bind(&req.icon)
    .bind(&req.description)
    .bind(&req.version)
    .bind(&req.category)
    .bind(&req.lab)
    .bind(id)
    .execute(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;

    Ok(Json(ApiSuccess { message: "Software updated.".into() }))
}
