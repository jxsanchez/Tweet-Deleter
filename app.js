require("dotenv").config(); // Enable use of environment variables.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public")); // Use static files in public folder for styling.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser : true, useUnifiedTopology: true });

// User scheme
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

// User model
const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

// Handles POST request from /register form
app.post("/register", (req, res) => {
    // New user created using email and password from form
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    // Attempt to save new user
    newUser.save((err) => {
        if(err) {
            // Log error if save was unsuccessful
            console.log("Registration error.");
        } else {
            // Render the /deleter if save was successful
            res.render("deleter");
        }
    });
});

// Handles POST request from /login form
app.post("/login", (req, res) => {
    // Get username and password from login form
    const username = req.body.username;
    const password = req.body.password;

    // Check if user with form username is in database
    User.findOne({ email: username }, (err, foundUser) => {
        if(err) {
            // Log error if username was not found
            console.log("User not found");
        } else {
            if(foundUser) {
                if(foundUser.password === password) {
                    // Render /deleter if password match
                    res.render("deleter");
                }
            }
        }
    });
});

app.listen(3000, () => {
    console.log("Server started.");
});