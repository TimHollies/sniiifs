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

const { uploadService, imageService } = require("./src/server");

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

app.use(imageService);

// handle uploads

app.use(uploadService);

// listen

app.listen(3000);
console.log("listening on port 3000");
