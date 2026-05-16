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
            ("1001", "Emilia", "Phantasy Star", "https://i.imgur.com/example1.jpg"),
            ("1002", "Patton", "WW2 General", "https://i.imgur.com/example2.jpg"),
            ("1003", "Son Goku", "Dragon Ball", "https://i.imgur.com/example3.jpg"),
            ("1004", "Laios", "Dungeon Meshi", "https://i.imgur.com/example4.jpg"),
            ("1005", "Clare", "Claymore", "https://i.imgur.com/example5.jpg"),
        ];

        let hashed = bcrypt::hash("password123", bcrypt::DEFAULT_COST).unwrap();

        for (id, name, course, pfp) in seed_data {
            sqlx::query(
                "INSERT IGNORE INTO users
                    (id_number, last_name, first_name, password, course, profile_picture, role)
                 VALUES (?, ?, 'User', ?, ?, ?, 'student')"
            )
            .bind(id)
            .bind(name)
            .bind(&hashed)
            .bind(course)
            .bind(pfp)
            .execute(pool).await.ok();
        }

        Ok(rocket)
    }
}
