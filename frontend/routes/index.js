var express = require('express');
var router = express.Router();
var User = require('../models/user');

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/dashboard');
    } else {
        next();
    }    
};

// route for user signup
router.get('/signup', sessionChecker, (req, res) => {
        res.sendFile('/view/signup.html', {root: './'});
    })
router.post('/signup', (req, res) => {
        User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        })
        .then(user => {
            req.session.user = user.dataValues;
            res.redirect('/dashboard');
        })
        .catch(error => {
            res.redirect('/signup');
        });
    });


// route for user Login
router.get('/login', sessionChecker, (req, res) => {
        res.sendFile('/view/login.html', {root: './'});
    })
router.post('/login', (req, res) => {
        var username = req.body.username,
            password = req.body.password;

        User.findOne({ where: { username: username } }).then(function (user) {
            if (!user) {
                res.redirect('/login');
            } else if (!user.validPassword(password)) {
                res.redirect('/login');
            } else {
                req.session.user = user.dataValues;
                res.redirect('/dashboard');
            }
        });
    });


// route for user's dashboard
router.get('/dashboard', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.sendFile('/view/dashboard.html', {root: './' });
    } else {
        res.redirect('/login');
    }
});


// route for user logout
router.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

// route for Home-Page
router.get('/', sessionChecker, (req, res) => {
    res.redirect('/login');
});

module.exports = router;
