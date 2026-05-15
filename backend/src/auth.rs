use rocket::{
    http::Status,
    request::{FromRequest, Outcome, Request},
    serde::json::Json,
};
use rocket::State;
use jsonwebtoken::{encode, Header as JwtHeader, EncodingKey};
use crate::{db::Db, models::*};

pub const JWT_SECRET: &[u8] = b"ccs_sitin_secret_key_2024";

// ── Custom request guard ───────────────────────────────────────────────────

pub struct BearerToken(pub String);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for BearerToken {
    type Error = &'static str;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        match req.headers().get_one("Authorization") {
            Some(h) if h.starts_with("Bearer ") => {
                Outcome::Success(BearerToken(h[7..].to_string()))
            }
            _ => Outcome::Error((Status::Unauthorized, "Missing Authorization header")),
        }
    }
}

// ── JWT helpers ────────────────────────────────────────────────────────────

pub fn generate_token(user: &User) -> String {
    let expiry = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .unwrap()
        .timestamp() as usize;

    let claims = Claims {
        sub: user.id_number.clone(),
        role: user.role.clone(),
        name: format!("{} {}", user.first_name, user.last_name),
        exp: expiry,
    };

    encode(&JwtHeader::default(), &claims, &EncodingKey::from_secret(JWT_SECRET))
        .unwrap_or_default()
}

pub fn verify_token(token: &str) -> Option<Claims> {
    use jsonwebtoken::{decode, DecodingKey, Validation};
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET),
        &Validation::default(),
    )
    .ok()
    .map(|d| d.claims)
}

pub fn require_admin(token: &str) -> Result<Claims, (Status, Json<ApiError>)> {
    let claims = verify_token(token)
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid or expired token".into() })))?;
    if claims.role != "admin" {
        return Err((Status::Forbidden, Json(ApiError { error: "Admin access required".into() })));
    }
    Ok(claims)
}

// ── Routes ─────────────────────────────────────────────────────────────────

#[post("/login", data = "<req>")]
pub async fn login(
    db: &State<Db>,
    req: Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (Status, Json<ApiError>)> {

    let user: Option<User> = sqlx::query_as(
        "SELECT * FROM users WHERE id_number = ?",
    )
    .bind(&req.id_number)
    .fetch_optional(db.inner())
    .await
    .map_err(|e| {
        // Detailed error so user/dev can diagnose MySQL issues
        let msg = e.to_string();
        let friendly = if msg.contains("doesn't exist") || msg.contains("Unknown database") {
            "Database 'ccs_sitin' not found — run xampp-setup.sql in phpMyAdmin first"
        } else if msg.contains("Access denied") {
            "MySQL access denied — check credentials in Rocket.toml"
        } else if msg.contains("connection refused") || msg.contains("timed out") {
            "Cannot reach MySQL — make sure MySQL is running in XAMPP Control Panel"
        } else {
            "Database query failed — check MySQL is running and ccs_sitin database exists"
        };
        eprintln!("LOGIN DB ERROR: {}", msg);
        (Status::InternalServerError, Json(ApiError { error: friendly.into() }))
    })?;

    let user = user.ok_or((
        Status::Unauthorized,
        Json(ApiError { error: "Invalid ID number or password".into() }),
    ))?;

    let valid = bcrypt::verify(&req.password, &user.password).unwrap_or(false);
    if !valid {
        return Err((
            Status::Unauthorized,
            Json(ApiError { error: "Invalid ID number or password".into() }),
        ));
    }

    let token = generate_token(&user);
    Ok(Json(AuthResponse { token, user: user.into() }))
}

#[post("/register", data = "<req>")]
pub async fn register(
    db: &State<Db>,
    req: Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, (Status, Json<ApiError>)> {

    let exists: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE id_number = ?",
    )
    .bind(&req.id_number)
    .fetch_one(db.inner())
    .await
    .map_err(|e| {
        eprintln!("REGISTER DB ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError {
            error: "Database error — ensure MySQL is running and ccs_sitin database exists".into()
        }))
    })?;

    if exists.0 > 0 {
        return Err((Status::Conflict, Json(ApiError { error: "ID Number already registered".into() })));
    }

    let hashed = bcrypt::hash(&req.password, bcrypt::DEFAULT_COST)
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Password hashing failed".into() })))?;

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
    .execute(db.inner())
    .await
    .map_err(|e| {
        eprintln!("REGISTER INSERT ERROR: {}", e);
        (Status::InternalServerError, Json(ApiError { error: "Failed to create account".into() }))
    })?;

    let user: User = sqlx::query_as("SELECT * FROM users WHERE id_number = ?")
        .bind(&req.id_number)
        .fetch_one(db.inner())
        .await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Failed to fetch new user".into() })))?;

    let token = generate_token(&user);
    Ok(Json(AuthResponse { token, user: user.into() }))
}
