use rocket::{
    fairing::{Fairing, Info, Kind},
    http::{Header, Method, Status},
    Request, Response,
};

pub struct Cors;

#[rocket::async_trait]
impl Fairing for Cors {
    fn info(&self) -> Info {
        Info {
            name: "CORS Headers",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new(
            "Access-Control-Allow-Origin",
            "http://localhost:5173",
        ));
        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        ));
        response.set_header(Header::new(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, Accept",
        ));
        response.set_header(Header::new(
            "Access-Control-Allow-Credentials",
            "true",
        ));

        if request.method() == Method::Options {
            response.set_status(Status::NoContent);
        }
    }
}
