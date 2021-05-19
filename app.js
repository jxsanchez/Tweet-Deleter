require("dotenv").config(); // Enable use of environment variables.
const bodyParser = require("body-parser");
const ejs = require("ejs");
const express = require("express");
const findOrCreate = require("mongoose-findorcreate");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const TwitterStrategy = require("passport-twitter").Strategy;
const Twit = require("twit");

const app = express();

app.use(express.static("public")); // Use static files in public folder for styling
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use session and configure object
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize()); // Initialize passport
app.use(passport.session()); // Use passport to manage session

app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser : true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const saltRounds = 5;

// User schema
const userSchema = new mongoose.Schema({
    twitterId: String,
    username: String,
    password: String,
    token: String,
    tokenSecret: String
});

// Use to hash and salt passwords
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// User model
const User = new mongoose.model("User", userSchema);

/***********************
 * PASSPORT STRATEGIES *
 ***********************/
passport.use(User.createStrategy()); // Create local login strategy

passport.use(new TwitterStrategy({ // Create Twitter strategy
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/twitter/deleter"
  },
  function(token, tokenSecret, profile, cb) {
    User.findOrCreate({ username: profile.username, twitterId: profile.id, token: token, tokenSecret: tokenSecret}, function (err, user) {
      return cb(err, user);
    });
  }
));

// Hash and unhash password
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
passport.deserializeUser(function(user, done) {
    done(null, user);
  });

/****************
 * GET Requests *
 ****************/
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/deleter', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/deleter');
});

app.get("/deleter", (req, res) => {
    if(req.isAuthenticated()) {
        res.render("deleter", {username: req.user.username});
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout();
    
    res.redirect("/");
});

/*****************
 * POST Requests *
 *****************/
app.post("/tweet", (req, res) => {
    const T = new Twit({
        consumer_key:         process.env.TWITTER_CONSUMER_KEY,
        consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
        access_token:         req.user.token,
        access_token_secret:  req.user.tokenSecret,
      });

      console.log(req.body.tweet);
      
      T.post('statuses/update', { status: req.body.tweet }, function(err, data, response) {
        console.log(data);
      });
});

// Handles POST request from /register form
app.post("/register", (req, res) => {
    // Passport register function
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if(err) {
            res.redirect("/register");
        } else {
            // Authenticate user and redirect to deleter
            passport.authenticate("local")(req, res, () => {
                res.redirect("/deleter");
            });
        }
    });
});

// Handles POST request from /login form
app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, err => {
        if(err) {
            res.redirect("/login");
        } else {
            // Authenticate user and redirect to deleter
            passport.authenticate("local")(req, res, () => {
                res.redirect("/deleter");
            });
        }
    });
});

app.listen(3000, () => {
    console.log("Server started.");
});