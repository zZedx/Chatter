const express = require('express')
const app = express()
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const LocalStrategy = require('passport-local')
const passport = require('passport')
const session = require('express-session')
const flash = require('express-flash')
const path = require('path')


const ExpressError = require('./utils/ExpressError')
const CatchAsync = require('./utils/CatchAsync')


const User = require('./models/user')

mongoose.connect('mongodb://127.0.0.1:27017/Chatter')
    .then(() => {
        console.log('Mongoose Running')
    })
    .catch((e) => {
        console.log(e);
    })

const sessionConfig = {
    name: 'localsession',
    secret: 'this is secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

app.set('views', path.join(__dirname, 'views'))
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    res.locals.currentUser = req.user
    next()
})

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/register', (req, res) => {
    res.render('user/register')
})

app.post('/register', CatchAsync(async (req, res, next) => {
    try {
        const { username, password } = req.body
        const user = new User({ username });
        await user.setPassword(password);
        await user.save();
        req.login(user, (err) => {
            if (err) return next(err)
            req.flash('success', 'Welcome')
            return res.redirect('/chatter')
        })
    }
    catch (e) {
        if (e.message.includes('E11000')) {
            e.message = "A user already exist with this username."
        }
        req.flash('error', e.message)
        res.redirect('/register')
    }
}))

app.get('/login', (req, res) => {
    res.render('user/login')
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), CatchAsync(async (req, res) => {
    req.flash('success', 'Welcome !')
    res.redirect('/chatter')
}))

app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err)
        }
    });
    // const redirectUrl = res.locals.returnTo || '/campgrounds';
    req.flash('success', 'Logged Out')
    res.redirect('/')
})

app.use('/', (req, res, next) => {
    if (req.user) {
        next()
    } else {
        res.redirect('/login')
    }
})

app.get('/chatter', (req, res) => {
    res.render('chatter')
})

app.use('*', (req, res, next) => {
    next(new ExpressError("Page Not Found", 401))
})

app.use((err, req, res, next) => {
    const { status = 500 } = err
    if (!err.message) err.message = "Oh No, Something Went Wrong!"
    res.status(status).render('error', { err })
})

app.listen(3000, () => {
    console.log('Listening')
})
