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
const twit = require("./twit");

// Create app object using express
const app = express();

/*********** 
 * app.use *
 ***********/
// Use static files in public folder
app.use(express.static("public"));

// Use body-parser to get info from requests 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use session and configure object
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

// Initialize passport and use passport to manage session
app.use(passport.initialize());
app.use(passport.session());

// Set view engine to ejs to allow for creation of template files
app.set("view engine", "ejs");

// Connect mongoose to remote database
mongoose.connect("mongodb+srv://jesus-admin:" + process.env.MONGODB_PASSWORD+ "@like-deleter.moznz.mongodb.net/userDB", { useNewUrlParser : true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

// User schema for creating new users
const userSchema = new mongoose.Schema({
    twitterId: String,
    username: String,
    profileImgUrl: String,
    token: String,
    tokenSecret: String
});

// mongoose Schema plugins
userSchema.plugin(passportLocalMongoose); // Used for logining in with password
userSchema.plugin(findOrCreate); // Finds or creates user

// Creates User model
const User = new mongoose.model("User", userSchema);

/***********************
 * PASSPORT STRATEGIES *
 ***********************/
// Create local login strategy
passport.use(User.createStrategy()); 

// Create Twitter strategy
passport.use(new TwitterStrategy({ 
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    // callbackURL: "https://thawing-forest-99001.herokuapp.com/auth/twitter/deleter"
    callbackURL: "http://127.0.0.1:3000/auth/twitter/deleter"
  },
  function(token, tokenSecret, profile, cb) {
    // Get full-sized profile photo
    const imgUrl = (profile.photos[0].value).replace("_normal", "");

    // Find user based on criteria from profile JSON object
    User.findOrCreate({ twitterId: profile.id, username: profile.username, profileImgUrl: imgUrl, token: token, tokenSecret: tokenSecret}, function (err, user) {
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

// passport-twitter authentication route
app.get('/auth/twitter', passport.authenticate('twitter'));

// Redirects user to deleter page once successfully logged in
app.get('/auth/twitter/deleter', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/deleter');
});

app.get("/deleter", (req, res) => {
    // Renders the deleter page if the user is successfully authenticated
    if(req.isAuthenticated()) {
        const { username, profileImgUrl } = req.user ;

        res.render("deleter", { username: username, profileImgUrl: profileImgUrl });
    // Redirects the user to the home page if they try to access the deleter page without logging in
    } else {
        res.redirect("/");
    }
});

// Logs the user out, destroys cookies, and redirects to home
app.get("/logout", (req, res) => {
    req.logout();
    
    res.redirect("/");
});

/*****************
 * POST Requests *
 *****************/
app.post("/tweet", (req, res) => {
    // Configure twit object
    const T = twit.twitConfig(req);
      
    // Sends tweet with information provided from tweet form and redirects to deleter page
    T.post("statuses/update", { status: req.body.tweet }, function(err, data, response) {
        if(!err) {
            res.redirect("/deleter");   
        }
    });
});

app.post("/delete-likes", (req, res) => {
    // Configure twit object
    const T = twit.twitConfig(req);

    // Get specified number of likes
    T.get("favorites/list", { user_id: req.user.twitterId, count: req.body.likeDelNum }, (err, data, response) => {
        // Delete each like
        data.forEach(like => {
            T.post("favorites/destroy", { id: like.id_str }, (err, data, response) => {
                // Redirect user to deleter if there is an error deleting a tweet
                if(err) {
                    res.redirect("/deleter");
                }
            });
        });

        res.redirect("/deleter");
    });
});

// Get port from process (running on web server)
let port = process.env.PORT;

// Uses port 3000 if running on local server
if(port == null || port == "") {
    port = 3000;
}

// Starts the server
app.listen(port, () => {
    console.log("Server started successfully.");
});