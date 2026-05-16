use rocket::{http::Status, serde::json::Json, State};
use serde::{Deserialize, Serialize};
use crate::{
    auth::{BearerToken, require_admin, verify_token},
    db::Db,
    models::{ApiError, ApiSuccess},
};

// ── Time slots ──────────────────────────────────────────────────────────────
// Predefined 2-hour blocks covering a typical lab day.
pub const TIME_SLOTS: &[&str] = &[
    "7:30 AM – 9:30 AM",
    "9:30 AM – 11:30 AM",
    "11:30 AM – 1:30 PM",
    "1:30 PM – 3:30 PM",
    "3:30 PM – 5:30 PM",
    "5:30 PM – 7:30 PM",
];

// ── Models ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Reservation {
    pub id:               i64,
    pub student_id:       String,
    pub student_name:     String,
    pub lab:              String,
    pub pc_number:        i32,
    pub purpose:          String,
    pub reservation_date: Option<String>,  // YYYY-MM-DD
    pub time_slot:        Option<String>,
    pub status:           String,
    pub notes:            Option<String>,
    pub requested_at:     Option<String>,
    pub resolved_at:      Option<String>,
    pub resolved_by:      Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReservationRequest {
    pub lab:              String,
    pub pc_number:        i32,
    pub purpose:          String,
    pub reservation_date: String,  // YYYY-MM-DD, must be today or future
    pub time_slot:        String,  // must be one of TIME_SLOTS
    pub notes:            Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResolveRequest {
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct PcStatus {
    pub lab:         String,
    pub pc_number:   i32,
    pub is_disabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PcToggleRequest {
    pub lab:       String,
    pub pc_number: i32,
    pub disabled:  bool,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

fn valid_time_slot(slot: &str) -> bool {
    TIME_SLOTS.contains(&slot)
}

// ── Student: submit a reservation request ────────────────────────────────────

#[post("/request", data = "<req>")]
pub async fn submit_reservation(
    db: &State<Db>,
    req: Json<ReservationRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    // Validate time slot
    if !valid_time_slot(&req.time_slot) {
        return Err((Status::BadRequest, Json(ApiError {
            error: format!("Invalid time slot '{}'", req.time_slot)
        })));
    }

    // Validate date — must not be in the past
    // We compare as strings (YYYY-MM-DD format sorts lexicographically)
    let today: (String,) = sqlx::query_as("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d')")
        .fetch_one(db.inner()).await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    if req.reservation_date.as_str() < today.0.as_str() {
        return Err((Status::BadRequest, Json(ApiError {
            error: "Reservation date cannot be in the past.".into()
        })));
    }

    // Fetch student name
    let student: Option<(String, String)> = sqlx::query_as(
        "SELECT first_name, last_name FROM users WHERE id_number = ?"
    ).bind(&claims.sub).fetch_optional(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    let (first, last) = student.ok_or((
        Status::NotFound, Json(ApiError { error: "Student not found".into() })
    ))?;
    let student_name = format!("{} {}", first, last);

    // Check: student already has a pending reservation for this date+slot
    let already_pending: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM reservations
         WHERE student_id = ? AND status = 'pending'
         AND reservation_date = ? AND time_slot = ?"
    ).bind(&claims.sub).bind(&req.reservation_date).bind(&req.time_slot)
     .fetch_one(db.inner()).await.unwrap_or((0,));

    if already_pending.0 > 0 {
        return Err((Status::Conflict, Json(ApiError {
            error: format!(
                "You already have a pending reservation for {} at {}.",
                req.reservation_date, req.time_slot
            )
        })));
    }

    // Check: student already has an APPROVED reservation during this slot (can't double-book themselves)
    let self_conflict: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM reservations
         WHERE student_id = ? AND status = 'approved'
         AND reservation_date = ? AND time_slot = ?"
    ).bind(&claims.sub).bind(&req.reservation_date).bind(&req.time_slot)
     .fetch_one(db.inner()).await.unwrap_or((0,));

    if self_conflict.0 > 0 {
        return Err((Status::Conflict, Json(ApiError {
            error: format!(
                "You already have an approved reservation on {} at {}.",
                req.reservation_date, req.time_slot
            )
        })));
    }

    // ── Core conflict check: is this PC already approved for this exact slot? ──
    let pc_conflict: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM reservations
         WHERE lab = ? AND pc_number = ? AND status = 'approved'
         AND reservation_date = ? AND time_slot = ?"
    ).bind(&req.lab).bind(req.pc_number)
     .bind(&req.reservation_date).bind(&req.time_slot)
     .fetch_one(db.inner()).await.unwrap_or((0,));

    if pc_conflict.0 > 0 {
        return Err((Status::Conflict, Json(ApiError {
            error: format!(
                "PC {} in Lab {} is already reserved on {} at {}. Please choose a different PC or time slot.",
                req.pc_number, req.lab, req.reservation_date, req.time_slot
            )
        })));
    }

    // Insert the reservation
    sqlx::query(
        "INSERT INTO reservations
             (student_id, student_name, lab, pc_number, purpose, reservation_date, time_slot, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(&claims.sub)
     .bind(&student_name)
     .bind(&req.lab)
     .bind(req.pc_number)
     .bind(&req.purpose)
     .bind(&req.reservation_date)
     .bind(&req.time_slot)
     .bind(&req.notes)
     .execute(db.inner()).await
    .map_err(|e| {
        eprintln!("RESERVATION INSERT ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Failed to submit reservation".into() }))
    })?;

    // Notify admins
    let msg = format!(
        "New reservation: {} wants Lab {} PC {} on {} at {}",
        student_name, req.lab, req.pc_number, req.reservation_date, req.time_slot
    );
    sqlx::query(
        "INSERT INTO notifications (user_id, message, notif_type, link)
         SELECT id_number, ?, 'reservation', '/admin/reservations' FROM users WHERE role = 'admin'"
    ).bind(msg).execute(db.inner()).await.ok();

    Ok(Json(ApiSuccess { message: "Reservation request submitted successfully.".into() }))
}

// ── Student: cancel reservation ──────────────────────────────────────────

#[post("/cancel/<id>")]
pub async fn cancel_reservation(
    db: &State<Db>,
    id: i64,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    // Only allow canceling 'pending' reservations
    let res = sqlx::query(
        "UPDATE reservations SET status = 'cancelled', resolved_at = NOW()
         WHERE id = ? AND student_id = ? AND status = 'pending'"
    ).bind(id).bind(&claims.sub)
     .execute(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    if res.rows_affected() == 0 {
        return Err((Status::NotFound, Json(ApiError { error: "Reservation not found or not pending".into() })));
    }

    Ok(Json(ApiSuccess { message: "Reservation cancelled successfully.".into() }))
}

// ── Student: view own reservations ──────────────────────────────────────────

#[get("/my")]
pub async fn my_reservations(
    db: &State<Db>,
    token: BearerToken,
) -> Result<Json<Vec<Reservation>>, (Status, Json<ApiError>)> {
    let claims = verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    let rows: Vec<Reservation> = sqlx::query_as(
        "SELECT id, student_id, student_name, lab, pc_number, purpose,
                DATE_FORMAT(reservation_date, '%Y-%m-%d') AS reservation_date,
                time_slot, status, notes,
                DATE_FORMAT(requested_at, '%Y-%m-%dT%H:%i:%S') AS requested_at,
                DATE_FORMAT(resolved_at,  '%Y-%m-%dT%H:%i:%S') AS resolved_at,
                resolved_by
         FROM reservations WHERE student_id = ? ORDER BY reservation_date DESC, time_slot ASC"
    ).bind(&claims.sub).fetch_all(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    Ok(Json(rows))
}

// ── Admin: list all reservations ─────────────────────────────────────────────

#[get("/all?<status>")]
pub async fn all_reservations(
    db: &State<Db>,
    token: BearerToken,
    status: Option<String>,
) -> Result<Json<Vec<Reservation>>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;

    let rows: Vec<Reservation> = if let Some(s) = status {
        sqlx::query_as(
            "SELECT id, student_id, student_name, lab, pc_number, purpose,
                    DATE_FORMAT(reservation_date, '%Y-%m-%d') AS reservation_date,
                    time_slot, status, notes,
                    DATE_FORMAT(requested_at, '%Y-%m-%dT%H:%i:%S') AS requested_at,
                    DATE_FORMAT(resolved_at,  '%Y-%m-%dT%H:%i:%S') AS resolved_at,
                    resolved_by
             FROM reservations WHERE status = ? ORDER BY reservation_date ASC, time_slot ASC"
        ).bind(s).fetch_all(db.inner()).await
    } else {
        sqlx::query_as(
            "SELECT id, student_id, student_name, lab, pc_number, purpose,
                    DATE_FORMAT(reservation_date, '%Y-%m-%d') AS reservation_date,
                    time_slot, status, notes,
                    DATE_FORMAT(requested_at, '%Y-%m-%dT%H:%i:%S') AS requested_at,
                    DATE_FORMAT(resolved_at,  '%Y-%m-%dT%H:%i:%S') AS resolved_at,
                    resolved_by
             FROM reservations ORDER BY reservation_date ASC, time_slot ASC, requested_at DESC"
        ).fetch_all(db.inner()).await
    }.map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    Ok(Json(rows))
}

// ── Admin: approve ────────────────────────────────────────────────────────────

#[post("/approve/<id>", data = "<req>")]
pub async fn approve_reservation(
    db: &State<Db>,
    id: i64,
    req: Json<ResolveRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    let claims = require_admin(&token.0)?;

    // Before approving, re-run the conflict check in case another admin approved in parallel
    let conflict: Option<(i64, String, i32, String, String)> = sqlx::query_as(
        "SELECT r2.id, r2.lab, r2.pc_number, r2.reservation_date, r2.time_slot
         FROM reservations r1
         JOIN reservations r2
           ON r2.lab = r1.lab AND r2.pc_number = r1.pc_number
          AND r2.reservation_date = r1.reservation_date AND r2.time_slot = r1.time_slot
          AND r2.status = 'approved' AND r2.id != r1.id
         WHERE r1.id = ?"
    ).bind(id).fetch_optional(db.inner()).await.unwrap_or(None);

    if let Some((cid, lab, pc, date, slot)) = conflict {
        return Err((Status::Conflict, Json(ApiError {
            error: format!(
                "Cannot approve — reservation #{} already occupies Lab {} PC {} on {} at {}.",
                cid, lab, pc, date, slot
            )
        })));
    }

    sqlx::query(
        "UPDATE reservations
         SET status = 'approved', resolved_at = NOW(), resolved_by = ?,
             notes = COALESCE(?, notes)
         WHERE id = ? AND status = 'pending'"
    ).bind(&claims.name).bind(&req.notes).bind(id)
     .execute(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;

    // Notify student
    let res: Option<(String, String, i32, String, String)> = sqlx::query_as(
        "SELECT student_id, lab, pc_number, reservation_date, time_slot FROM reservations WHERE id = ?"
    ).bind(id).fetch_optional(db.inner()).await.unwrap_or(None);

    if let Some((sid, lab, pc, date, slot)) = res {
        sqlx::query(
            "INSERT INTO notifications (user_id, message, notif_type, link) VALUES (?, ?, 'reservation', '/student')"
        ).bind(&sid)
         .bind(format!("✅ Your reservation for Lab {} PC {} on {} at {} has been approved!", lab, pc, date, slot))
         .execute(db.inner()).await.ok();
    }

    Ok(Json(ApiSuccess { message: "Reservation approved.".into() }))
}

// ── Admin: deny ───────────────────────────────────────────────────────────────

#[post("/deny/<id>", data = "<req>")]
pub async fn deny_reservation(
    db: &State<Db>,
    id: i64,
    req: Json<ResolveRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    let claims = require_admin(&token.0)?;

    sqlx::query(
        "UPDATE reservations
         SET status = 'denied', resolved_at = NOW(), resolved_by = ?,
             notes = COALESCE(?, notes)
         WHERE id = ? AND status = 'pending'"
    ).bind(&claims.name).bind(&req.notes).bind(id)
     .execute(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;

    let res: Option<(String, String, i32, String, String)> = sqlx::query_as(
        "SELECT student_id, lab, pc_number, reservation_date, time_slot FROM reservations WHERE id = ?"
    ).bind(id).fetch_optional(db.inner()).await.unwrap_or(None);

    if let Some((sid, lab, pc, date, slot)) = res {
        sqlx::query(
            "INSERT INTO notifications (user_id, message, notif_type, link) VALUES (?, ?, 'reservation', '/student')"
        ).bind(&sid)
         .bind(format!("❌ Your reservation for Lab {} PC {} on {} at {} was denied.", lab, pc, date, slot))
         .execute(db.inner()).await.ok();
    }

    Ok(Json(ApiSuccess { message: "Reservation denied.".into() }))
}

// ── Admin: PC status for a lab ────────────────────────────────────────────────

#[get("/pc-status/<lab>")]
pub async fn pc_status(
    db: &State<Db>,
    lab: &str,
    token: BearerToken,
) -> Result<Json<Vec<PcStatus>>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    let rows: Vec<PcStatus> = sqlx::query_as(
        "SELECT lab, pc_number, is_disabled FROM pc_status WHERE lab = ? ORDER BY pc_number ASC"
    ).bind(lab).fetch_all(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;
    Ok(Json(rows))
}

/// Toggle a PC's disabled state (admin marks a PC as broken/offline).
#[post("/pc-control", data = "<req>")]
pub async fn pc_control(
    db: &State<Db>,
    req: Json<PcToggleRequest>,
    token: BearerToken,
) -> Result<Json<ApiSuccess>, (Status, Json<ApiError>)> {
    require_admin(&token.0)?;
    sqlx::query(
        "INSERT INTO pc_status (lab, pc_number, is_disabled) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE is_disabled = VALUES(is_disabled)"
    ).bind(&req.lab).bind(req.pc_number).bind(req.disabled)
     .execute(db.inner()).await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Update failed".into() })))?;
    Ok(Json(ApiSuccess { message: "PC status updated.".into() }))
}

// ── Student: lab occupancy for a specific date + time slot ───────────────────

#[get("/lab-occupancy/<lab>?<date>&<slot>")]
pub async fn lab_occupancy(
    db: &State<Db>,
    lab: &str,
    date: Option<String>,
    slot: Option<String>,
    token: BearerToken,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    verify_token(&token.0)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;

    // PCs approved for this lab on the given date + time slot
    let reserved: Vec<(i32,)> = if let (Some(d), Some(s)) = (&date, &slot) {
        sqlx::query_as(
            "SELECT pc_number FROM reservations
             WHERE lab = ? AND status = 'approved'
             AND reservation_date = ? AND time_slot = ?"
        ).bind(lab).bind(d).bind(s).fetch_all(db.inner()).await.unwrap_or_default()
    } else {
        // Fallback: today, any slot
        sqlx::query_as(
            "SELECT pc_number FROM reservations
             WHERE lab = ? AND status = 'approved'
             AND reservation_date = CURDATE()"
        ).bind(lab).fetch_all(db.inner()).await.unwrap_or_default()
    };

    // Disabled PCs (offline)
    let disabled: Vec<(i32,)> = sqlx::query_as(
        "SELECT pc_number FROM pc_status WHERE lab = ? AND is_disabled = 1"
    ).bind(lab).fetch_all(db.inner()).await.unwrap_or_default();

    Ok(Json(serde_json::json!({
        "reserved": reserved.iter().map(|r| r.0).collect::<Vec<_>>(),
        "disabled": disabled.iter().map(|r| r.0).collect::<Vec<_>>(),
    })))
}

/// Return all time slots (for the frontend dropdowns)
#[get("/time-slots")]
pub async fn time_slots() -> Json<Vec<&'static str>> {
    Json(TIME_SLOTS.to_vec())
}
