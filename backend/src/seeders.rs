use rocket::fairing::{self, Fairing, Info, Kind};
use rocket::{Rocket, Build};
use sqlx::MySqlPool;

pub struct SeederFairing;

#[rocket::async_trait]
impl Fairing for SeederFairing {
    fn info(&self) -> Info {
        Info { name: "Character Seeder", kind: Kind::Ignite }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> fairing::Result {
        // Check for environment variable to enable seeding
        let should_seed = std::env::var("SEED_DATABASE").unwrap_or_else(|_| "false".to_string()) == "true";
        if !should_seed {
            return Ok(rocket);
        }

        let pool = match rocket.state::<MySqlPool>() {
            Some(p) => p,
            None => return Err(rocket),
        };

        let seed_data = vec![
            ("23760451", "Emilia", "BSIT", "https://i.imgur.com/example1.jpg", 25),
            ("23760452", "Patton", "BSCS", "https://i.imgur.com/example2.jpg", 15),
            ("23760453", "Goku", "BSIT", "https://i.imgur.com/example3.jpg", 30),
            ("23760454", "Laios", "BSCpE", "https://i.imgur.com/example4.jpg", 10),
            ("23760455", "Clare", "BSCS", "https://i.imgur.com/example5.jpg", 20),
        ];

        let hashed = bcrypt::hash("password123", bcrypt::DEFAULT_COST).unwrap();

        for (id, name, course, pfp, sessions) in seed_data {
            sqlx::query(
                "INSERT IGNORE INTO users
                    (id_number, last_name, first_name, password, course, profile_picture, role, remaining_sessions)
                 VALUES (?, ?, 'Test', ?, ?, ?, 'student', ?)"
            )
            .bind(id)
            .bind(name)
            .bind(&hashed)
            .bind(course)
            .bind(pfp)
            .bind(sessions)
            .execute(pool).await.ok();
        }

        Ok(rocket)
    }
}
