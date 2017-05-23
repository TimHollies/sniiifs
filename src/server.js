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

var Jimp = require("jimp");

module.exports = {};

module.exports.imageService = get(
  "/image-service/:id/:region/:size/:rotation/:quality",
  function*(id, region, size, rotation, quality) {
    if (fs.existsSync(path.join(__dirname, "..", "uploads", id))) {
      // open a file called "lenna.png"
      yield new Promise((res, rej) => {
        Jimp.read(path.join(__dirname, "..", "uploads", id), (err, image) => {
          if (err) {
            rej({
              code: 500,
              message: `Could not load image with ID ${id}`
            });
          }
          res(image);
        });
      })
        .then(image => {
          try {
            sizeHandler(image, size);
            rotateHandler(image, rotation);
          } catch (e) {
            return Promise.reject({
              code: 400,
              message: e.message
            });
          }

          return new Promise(res => {
            image.getBuffer("image/jpeg", (err, buffer) => {
              res(buffer);
            });
          });
        })
        .then(buffer => {
          this.type = "image/jpeg";
          this.body = buffer;
        })
        .catch(err => {
          this.state = err.code;
          this.body = err.message;
        });
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
