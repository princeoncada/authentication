const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

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

const secret = 'prince_oncada_authentication'

// The key value in { secret: secret } is the default value. Always use secret key value.
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });

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
                if(foundUser.password === password) {
                    res.render('secrets')
                }
            }
        }
    })
})

app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save(err => {
        if(!err) res.render('secrets')
        else console.log(err)
    })
})


app.listen(port, function(){
    console.log('listening on port ' + port);
})