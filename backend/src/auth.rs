use rocket::{
    http::Status,
    request::{FromRequest, Outcome, Request},
    serde::json::Json,
};
use rocket_db_pools::Connection;
use jsonwebtoken::{encode, Header as JwtHeader, EncodingKey};
use crate::{db::Db, models::*};

pub const JWT_SECRET: &[u8] = b"ccs_sitin_secret_key_2024";

// ── Custom request guard for Bearer token ──────────────────────────────────

pub struct BearerToken(pub String);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for BearerToken {
    type Error = &'static str;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        match req.headers().get_one("Authorization") {
            Some(h) if h.starts_with("Bearer ") => {
                Outcome::Success(BearerToken(h[7..].to_string()))
            }
            _ => Outcome::Error((Status::Unauthorized, "Missing or invalid Authorization header")),
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

    encode(
        &JwtHeader::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET),
    )
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
        .ok_or((Status::Unauthorized, Json(ApiError { error: "Invalid token".into() })))?;
    if claims.role != "admin" {
        return Err((Status::Forbidden, Json(ApiError { error: "Admin only".into() })));
    }
    Ok(claims)
}

// ── Routes ─────────────────────────────────────────────────────────────────

#[post("/login", data = "<req>")]
pub async fn login(
    mut db: Connection<Db>,
    req: Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (Status, Json<ApiError>)> {
    let user: Option<User> = sqlx::query_as(
        "SELECT * FROM users WHERE id_number = ?",
    )
    .bind(&req.id_number)
    .fetch_optional(&mut **db)
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    let user = user.ok_or((
        Status::Unauthorized,
        Json(ApiError { error: "Invalid credentials".into() }),
    ))?;

    let valid = bcrypt::verify(&req.password, &user.password).unwrap_or(false);
    if !valid {
        return Err((Status::Unauthorized, Json(ApiError { error: "Invalid credentials".into() })));
    }

    let token = generate_token(&user);
    Ok(Json(AuthResponse { token, user: user.into() }))
}

#[post("/register", data = "<req>")]
pub async fn register(
    mut db: Connection<Db>,
    req: Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, (Status, Json<ApiError>)> {
    let exists: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE id_number = ?",
    )
    .bind(&req.id_number)
    .fetch_one(&mut **db)
    .await
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    if exists.0 > 0 {
        return Err((Status::Conflict, Json(ApiError { error: "ID Number already registered".into() })));
    }

    let hashed = bcrypt::hash(&req.password, bcrypt::DEFAULT_COST)
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Hashing error".into() })))?;

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
    .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "Failed to register".into() })))?;

    let user: User = sqlx::query_as("SELECT * FROM users WHERE id_number = ?")
        .bind(&req.id_number)
        .fetch_one(&mut **db)
        .await
        .map_err(|_| (Status::InternalServerError, Json(ApiError { error: "DB error".into() })))?;

    let token = generate_token(&user);
    Ok(Json(AuthResponse { token, user: user.into() }))
}
