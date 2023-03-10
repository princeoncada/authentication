require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// const md5 = require('md5'); - used for hashing passwords
// const encrypt = require('mongoose-encryption'); - used for database encryption
// const bcrypt = require('bcrypt'); - used for salting and hasing passwords using bcrypt
// const saltRounds = 10; - used for salting and hasing passwords using bcrypt

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


const port = 3000 || process.env.PORT

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// The key value in { secret: secret } is the default value. Always use secret key value. - used for database encryption
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] }); - used for database encryption

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser()); - Used for local authentication
// passport.deserializeUser(User.deserializeUser()); - Used for local authentication

passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    })
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/auth/facebook', 
    passport.authenticate('facebook')
)

app.get('/auth/facebook/secrets', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
});

app.get('/auth/google', 
    passport.authenticate('google', { scope: ["profile"] })
)

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
});

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res) => {

    // v used for salting and hasing passwords using bcrypt

    // const username = req.body.username
    // const password = req.body.password

    // User.findOne({ email: username }, function (err, foundUser) {
    //     if(err) {
    //         console.log(err);
    //     }else {
    //         if(foundUser) {
    //             bcrypt.compare(password, foundUser.password, function(err, result){
    //                 if(result) res.render('secrets')
    //             })
    //         }
    //     }
    // })

    // ^ used for salting and hasing passwords using bcrypt

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if(err) {
            console.log(err);
            res.redirect('/login')
        }else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets');
            });
        }
    })

})

app.get('/logout', (req, res) => {
    req.logout(err => {
        if(err) console.log(err);
        else res.redirect('/');
    });
})

app.get('/register', (req, res) => {
    res.render('register');
})

app.get('/secrets', (req, res) => {
    User.find({secret: {$ne: null}}, (err, result) => {
        if(!err) {
            if(result){
                res.render('secrets', {userSecrets: result});
            }
        }else console.log(err);
    })
})

app.get('/submit', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('submit');
    }else {
        res.redirect('/login');
    }
});

app.post('/submit', (req, res) => {
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, (err, foundUser) => {
        if(err) console.log(err);
        else {
            if(foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function() {
                    res.redirect('/secrets');
                });
            }
        }
    })
})

app.post('/register', (req, res) => {

    // v used for salting and hasing passwords using bcrypt

    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     })
    
    //     newUser.save(err => {
    //         if(!err) res.render('secrets')
    //         else console.log(err)
    //     })
    // });

    // ^ used for salting and hasing passwords using bcrypt

    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if(err) {
            console.log(err)
            res.redirect('/register')
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets')
            })
        }
    })

})


app.listen(port, function(){
    console.log('listening on port ' + port);
})