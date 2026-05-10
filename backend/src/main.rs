#[macro_use]
extern crate rocket;

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

use rocket_db_pools::Database;
use db::Db;

#[options("/<_..>")]
fn all_options() -> &'static str { "" }

#[launch]
async fn rocket() -> _ {
    rocket::build()
        .attach(Db::init())
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
}
