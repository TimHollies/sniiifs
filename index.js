/**
 * Module dependencies.
 */

var logger = require("koa-logger");
var serve = require("koa-static");
var parse = require("co-busboy");
var Koa = require("koa");
var fs = require("fs");
var app = new Koa();
var os = require("os");
var path = require("path");
var { get, post } = require("koa-route");
var { isNaN } = require("lodash");
var mount = require("koa-mount");

var sharp = require("sharp");

// log requests

app.use(logger());

// custom 404

app.use(function*(next) {
  yield next;
  if (this.body || !this.idempotent) return;
  this.redirect("/404.html");
});

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

      const rotationParts = rotation.match(/(!)?([0-9]*)/);
      if (rotationParts === null) {
        this.status = 400;
        this.body = "Invalid rotation code";
        return;
      }

      const rotationDegrees = parseInt(rotationParts[2]);
      if (isNaN(rotationDegrees)) {
        this.status = 400;
        this.body = "Invalid rotation code";
        return;
      }

      if (rotationDegrees < 0 || rotationDegrees > 360) {
        this.status = 400;
        this.body = "Rotation must be between 0 and 360 degrees";
        return;
      }

      if (rotationDegrees % 90 !== 0) {
        this.status = 400;
        this.body = "Currently SNIIIF only supports rotations in 90 degrees";
        return;
      }

      if (rotationParts[1] !== undefined) {
        image.flip(true);
      }

      image.rotate(rotationDegrees);

      this.type = "image/jpeg";
      this.body = yield image.toBuffer();
    } else {
      this.status = 404;
      this.body = `No image found with ID ${id}`;
    }
  })
);

// handle uploads

app.use(function*(next) {
  // ignore non-POSTs
  if ("POST" != this.method) return yield next;

  // multipart upload
  var parts = parse(this);
  var part;

  while ((part = yield parts)) {
    var stream = fs.createWriteStream(
      path.join(
        __dirname,
        "uploads",
        Math.floor(Math.random().toString() * 10000000),
        ".jpg"
      )
    );
    part.pipe(stream);
    console.log("uploading %s -> %s", part.filename, stream.path);
  }

  this.redirect("/");
});

// listen

app.listen(3000);
console.log("listening on port 3000");
