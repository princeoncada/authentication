require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const md5 = require('md5'); - used for hashing passwords
// const encrypt = require('mongoose-encryption'); - used for database encryption
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const port = 3000 || process.env.PORT

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// The key value in { secret: secret } is the default value. Always use secret key value. - used for database encryption
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] }); - used for database encryption

const User = new mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', (req, res) => {
    const username = req.body.username
    const password = req.body.password

    User.findOne({ email: username }, function (err, foundUser) {
        if(err) {
            console.log(err);
        }else {
            if(foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result){
                    if(result) res.render('secrets')
                })
            }
        }
    })
})

app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        })
    
        newUser.save(err => {
            if(!err) res.render('secrets')
            else console.log(err)
        })
    });

})


app.listen(port, function(){
    console.log('listening on port ' + port);
})