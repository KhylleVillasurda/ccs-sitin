use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct User {
    pub id: i64,
    pub id_number: String,
    pub last_name: String,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub course_level: i64,
    pub password: String,
    pub email: Option<String>,
    pub course: Option<String>,
    pub address: Option<String>,
    pub role: String,
    pub remaining_sessions: i64,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicUser {
    pub id: i64,
    pub id_number: String,
    pub last_name: String,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub course_level: i64,
    pub email: Option<String>,
    pub course: Option<String>,
    pub address: Option<String>,
    pub role: String,
    pub remaining_sessions: i64,
    pub created_at: Option<String>,
}

impl From<User> for PublicUser {
    fn from(u: User) -> Self {
        PublicUser {
            id: u.id,
            id_number: u.id_number,
            last_name: u.last_name,
            first_name: u.first_name,
            middle_name: u.middle_name,
            course_level: u.course_level,
            email: u.email,
            course: u.course,
            address: u.address,
            role: u.role,
            remaining_sessions: u.remaining_sessions,
            created_at: u.created_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SitInRecord {
    pub id: i64,
    pub student_id: String,
    pub student_name: String,
    pub purpose: String,
    pub lab: String,
    pub session: Option<i64>,
    pub status: String,
    pub time_in: Option<String>,
    pub time_out: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Announcement {
    pub id: i64,
    pub title: Option<String>,
    pub content: String,
    pub author: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub id_number: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub id_number: String,
    pub last_name: String,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub course_level: Option<i64>,
    pub password: String,
    pub email: Option<String>,
    pub course: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,        // id_number
    pub role: String,
    pub name: String,
    pub exp: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: PublicUser,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SitInRequest {
    pub student_id: String,
    pub purpose: String,
    pub lab: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateStudentRequest {
    pub last_name: Option<String>,
    pub first_name: Option<String>,
    pub middle_name: Option<String>,
    pub course_level: Option<i64>,
    pub email: Option<String>,
    pub course: Option<String>,
    pub address: Option<String>,
    pub remaining_sessions: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnnouncementRequest {
    pub title: Option<String>,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub error: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiSuccess {
    pub message: String,
}
