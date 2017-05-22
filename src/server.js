/**
 * Module dependencies.
 */

require("dotenv").config();

var parse = require("co-busboy");
var fs = require("fs");
var os = require("os");
var path = require("path");
var { get, post } = require("koa-route");

var sharp = require("sharp");

const rotateHandler = require("./rotate");
const sizeHandler = require("./size");

module.exports = {};

module.exports.imageService = get(
  "/image-service/:id/:region/:size/:rotation/:quality",
  function*(id, region, size, rotation, quality) {
    if (fs.existsSync(path.join(__dirname, "..", "uploads", id))) {
      const image = sharp(
        fs.readFileSync(path.join(__dirname, "..", "uploads", id))
      );

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
  }
);

// handle uploads

module.exports.uploadService = post("/image-service", function*(next) {
  // ignore non-POSTs
  if (this.isAuthenticated()) {
    // multipart upload
    var parts = parse(this);
    var part;

    while ((part = yield parts)) {
      var stream = fs.createWriteStream(
        path.join(
          __dirname,
          "..",
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
});
