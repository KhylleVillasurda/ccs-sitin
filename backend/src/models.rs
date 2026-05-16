use serde::{Deserialize, Serialize};
use chrono::NaiveDateTime;

pub fn fmt_dt<S>(dt: &Option<NaiveDateTime>, s: S) -> Result<S::Ok, S::Error>
where S: serde::Serializer {
    match dt {
        Some(d) => s.serialize_some(&d.format("%Y-%m-%dT%H:%M:%S").to_string()),
        None    => s.serialize_none(),
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct User {
    pub id:                 i64,
    pub id_number:          String,
    pub last_name:          String,
    pub first_name:         String,
    pub middle_name:        Option<String>,
    pub course_level:       i32,
    pub password:           String,
    pub email:              Option<String>,
    pub course:             Option<String>,
    pub address:            Option<String>,
    pub role:               String,
    pub remaining_sessions: i32,
    pub profile_picture:    Option<String>,   // base64 data URL
    #[serde(serialize_with = "fmt_dt")]
    pub created_at:         Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicUser {
    pub id:                 i64,
    pub id_number:          String,
    pub last_name:          String,
    pub first_name:         String,
    pub middle_name:        Option<String>,
    pub course_level:       i32,
    pub email:              Option<String>,
    pub course:             Option<String>,
    pub address:            Option<String>,
    pub role:               String,
    pub remaining_sessions: i32,
    pub profile_picture:    Option<String>,
    pub created_at:         Option<String>,
}

impl From<User> for PublicUser {
    fn from(u: User) -> Self {
        PublicUser {
            id:                 u.id,
            id_number:          u.id_number,
            last_name:          u.last_name,
            first_name:         u.first_name,
            middle_name:        u.middle_name,
            course_level:       u.course_level,
            email:              u.email,
            course:             u.course,
            address:            u.address,
            role:               u.role,
            remaining_sessions: u.remaining_sessions,
            profile_picture:    u.profile_picture,
            created_at:         u.created_at.map(|d| d.format("%Y-%m-%dT%H:%M:%S").to_string()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SitInRecord {
    pub id:           i64,
    pub student_id:   String,
    pub student_name: String,
    pub purpose:      String,
    pub lab:          String,
    pub pc_number:    i32,
    pub session:      Option<i32>,
    pub status:       String,
    #[serde(serialize_with = "fmt_dt")]
    pub time_in:      Option<NaiveDateTime>,
    #[serde(serialize_with = "fmt_dt")]
    pub time_out:     Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Announcement {
    pub id:      i64,
    pub title:   Option<String>,
    pub content: String,
    pub author:  String,
    #[serde(serialize_with = "fmt_dt")]
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub id_number: String,
    pub password:  String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub id_number:    String,
    pub last_name:    String,
    pub first_name:   String,
    pub middle_name:  Option<String>,
    pub course_level: Option<i32>,
    pub password:     String,
    pub email:        Option<String>,
    pub course:       Option<String>,
    pub address:      Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub:  String,
    pub role: String,
    pub name: String,
    pub exp:  usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user:  PublicUser,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SitInRequest {
    pub student_id: String,
    pub purpose:    String,
    pub lab:        String,
    pub pc_number:  i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateStudentRequest {
    pub last_name:          Option<String>,
    pub first_name:         Option<String>,
    pub middle_name:        Option<String>,
    pub course_level:       Option<i32>,
    pub email:              Option<String>,
    pub course:             Option<String>,
    pub address:            Option<String>,
    pub remaining_sessions: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProfileRequest {
    pub last_name:        Option<String>,
    pub first_name:       Option<String>,
    pub middle_name:      Option<String>,
    pub course_level:     Option<i32>,
    pub email:            Option<String>,
    pub course:           Option<String>,
    pub address:          Option<String>,
    pub current_password: Option<String>,
    pub new_password:     Option<String>,
    pub profile_picture:  Option<String>,   // base64 data URL or "remove"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnnouncementRequest {
    pub title:   Option<String>,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError   { pub error:   String }
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiSuccess { pub message: String }

// ── Feedback ────────────────────────────────────────────────────────────────

/// What admin sees — no student identity
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct FeedbackView {
    pub id:             i64,
    pub sitin_id:       i64,
    pub purpose:        String,
    pub lab:            String,
    pub content:        String,
    pub rating:         Option<i32>,
    pub admin_reply:    Option<String>,
    pub is_testimonial: bool,
    #[serde(serialize_with = "fmt_dt")]
    pub created_at:     Option<NaiveDateTime>,
    #[serde(serialize_with = "fmt_dt")]
    pub replied_at:     Option<NaiveDateTime>,
}

/// What student sees — their own submissions + admin reply
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct MyFeedbackEntry {
    pub id:          i64,
    pub sitin_id:    i64,
    pub purpose:     String,
    pub lab:         String,
    pub pc_number:   i32,
    pub content:     String,
    pub rating:      Option<i32>,
    pub admin_reply: Option<String>,
    #[serde(serialize_with = "fmt_dt")]
    pub created_at:  Option<NaiveDateTime>,
    #[serde(serialize_with = "fmt_dt")]
    pub replied_at:  Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TestimonialView {
    pub id:           i64,
    pub content:      String,
    pub rating:       Option<i32>,
    pub student_name: String,
    #[serde(serialize_with = "fmt_dt")]
    pub created_at:   Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedbackRequest {
    pub sitin_id: i64,
    pub content:  String,
    pub rating:   Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminReplyRequest {
    pub reply: String,
}

// ── Notifications ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Notification {
    pub id:         i64,
    pub user_id:    String,
    pub message:    String,
    pub is_read:    bool,
    pub notif_type: String,
    pub link:       Option<String>,
    #[serde(serialize_with = "fmt_dt")]
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotifCount { pub unread: i64 }
