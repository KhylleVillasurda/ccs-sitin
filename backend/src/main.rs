#[macro_use]
extern crate rocket;

use rocket::{launch, routes};
use sqlx::mysql::MySqlPoolOptions;
use std::time::Duration;

mod db;
mod models;
mod auth;
mod students;
mod sitin;
mod announcements;
mod reports;
mod cors;
mod feedback;
mod notifications;
mod reservation;
mod lab_software;

#[options("/<_..>")]
fn all_options() -> &'static str { "" }

#[launch]
async fn rocket() -> _ {
    // Retrieve database URL from Rocket's configuration
    let database_url: String = rocket::Config::figment()
        .extract_inner("databases.main.url")
        .expect("Database URL not found in Rocket.toml configuration.");

    // Create the MySQL pool
    let pool = match MySqlPoolOptions::new()
        .max_connections(5)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(10 * 60))
        .max_lifetime(Duration::from_secs(30 * 60))
        .connect(&database_url)
        .await
    {
        Ok(pool) => pool,
        Err(e) => {
            eprintln!("Failed to connect to database: {}", e);
            panic!("Failed to connect to database: {}", e);
        }
    };

    rocket::build()
        .manage(pool) // Manage the MySqlPool instance
        .attach(cors::Cors)
        .attach(db::DbInitFairing)
        .mount("/", routes![all_options])
        .mount("/api/auth", routes![
            auth::login,
            auth::register,
        ])
        .mount("/api/students", routes![
            students::list,
            students::get_by_id,
            students::get_avatar,
            students::update,
            students::update_profile,
            students::delete,
            students::add,
            students::reset_all_sessions,
        ])
        .mount("/api/sitin", routes![
            sitin::start_sitin,
            sitin::end_sitin,
            sitin::current,
            sitin::records,
            sitin::student_records,
        ])
        .mount("/api/announcements", routes![
            announcements::list,
            announcements::create,
            announcements::delete_announcement,
        ])
        .mount("/api/reports", routes![
            reports::stats,
            reports::by_purpose,
            reports::by_lab,
            reports::leaderboard,
        ])
        .mount("/api/feedback", routes![
            feedback::submit,
            feedback::list,
            feedback::reply,
            feedback::my_feedbacks,
            feedback::my_feedbacks_full,
        ])
        .mount("/api/notifications", routes![
            notifications::list,
            notifications::count,
            notifications::mark_read,
            notifications::mark_all_read,
        ])
        .mount("/api/reservations", routes![
            reservation::submit_reservation,
            reservation::my_reservations,
            reservation::all_reservations,
            reservation::approve_reservation,
            reservation::deny_reservation,
            reservation::pc_status,
            reservation::pc_control,
            reservation::lab_occupancy,
            reservation::time_slots,
        ])
        .mount("/api/lab-software", routes![
            lab_software::list_software,
            lab_software::add_software,
            lab_software::remove_software,
            lab_software::update_software,
        ])
}
