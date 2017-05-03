/**
 * Module dependencies.
 */

require("dotenv").config();

var logger = require("koa-logger");
var serve = require("koa-static");
var parse = require("co-busboy");
var Koa = require("koa");
var fs = require("fs");
var app = new Koa();
var os = require("os");
var path = require("path");
var { get, post } = require("koa-route");
var mount = require("koa-mount");

var sharp = require("sharp");

const rotateHandler = require("./src/rotate");
const sizeHandler = require("./src/size");

// log requests

app.use(logger());

// sessions
const session = require("koa-session");
app.keys = [process.env.APP_KEY];
app.use(session({}, app));

// body parser
const bodyParser = require("koa-bodyparser");
app.use(bodyParser());

// authentication
require("./auth");
const passport = require("koa-passport");
app.use(passport.initialize());
app.use(passport.session());

// custom 404

app.use(function*(next) {
  yield next;
  if (this.body || !this.idempotent) return;
  this.redirect("/404.html");
});

// POST /login
app.use(
  post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/"
    })
  )
);

app.use(
  get("/logout", function() {
    this.logout();
    this.redirect("/index.html");
  })
);

// serve files from ./public

app.use(serve(path.join(__dirname, "/public")));
app.use(mount("/uploads", serve(path.join(__dirname, "/uploads"))));

app.use(
  get("/image-service/:id/:region/:size/:rotation/:quality", function*(
    id,
    region,
    size,
    rotation,
    quality
  ) {
    if (fs.existsSync(path.join(__dirname, "uploads", id))) {
      const image = sharp(fs.readFileSync(path.join(__dirname, "uploads", id)));

      try {
        sizeHandler(image, size);
        rotateHandler(image, rotation);
      } catch (e) {
        this.status = 400;
        this.body = e.message;
        return;
      }

      this.type = "image/jpeg";
      this.body = yield image.toBuffer();
    } else {
      this.status = 404;
      this.body = `No image found with ID ${id}`;
    }
  })
);

// handle uploads

app.use(
  post("/image-service", function*(next) {
    // ignore non-POSTs
    if (this.isAuthenticated()) {
      // multipart upload
      var parts = parse(this);
      var part;

      while ((part = yield parts)) {
        var stream = fs.createWriteStream(
          path.join(
            __dirname,
            "uploads",
            Math.floor(Math.random().toString() * 10000000).toString() + ".jpg"
          )
        );
        part.pipe(stream);
        console.log("uploading %s -> %s", part.filename, stream.path);
      }

      this.redirect("/");
    } else {
      this.redirect("/login.html");
    }
  })
);

// listen

app.listen(3000);
console.log("listening on port 3000");
