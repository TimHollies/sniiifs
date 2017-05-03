const passport = require("koa-passport");
const yaml = require("js-yaml");
const fs = require("fs");

let users = yaml.safeLoad(fs.readFileSync("./user.yaml", "utf8")).users;

const fetchUser = (id => {
  // This is an example! Use password hashing in your
  const user = users.find(user => user.id === id);
  return async function() {
    return user;
  };
})();

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await fetchUser();
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const LocalStrategy = require("passport-local").Strategy;
passport.use(
  new LocalStrategy(function(username, password, done) {
    fetchUser()
      .then(user => {
        if (username === user.username && password === user.password) {
          done(null, user);
        } else {
          done(null, false);
        }
      })
      .catch(err => done(err));
  })
);
