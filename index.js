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
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const sharedsession = require("express-socket.io-session");
require('dotenv').config()
const mongoStore = require('connect-mongo')
const sanitizeHtml = require('sanitize-html')
const mongoSanitize = require('express-mongo-sanitize');

const ExpressError = require('./utils/ExpressError')
const CatchAsync = require('./utils/CatchAsync')
const Message = require('./models/messages')


const User = require('./models/user')

const dbUrl = process.env.DB_URL
// 'mongodb://127.0.0.1:27017/Chatter'
mongoose.connect(dbUrl)
    .then(() => {
        console.log('Mongoose Running')
    })
    .catch((e) => {
        console.log(e);
    })

const store = mongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
})

const sessionConfig = session({
    store,
    name: 'localsession',
    secret: 'this is secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
})
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(sessionConfig)
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
app.use(
    mongoSanitize({
      allowDots: true,
      replaceWith: '_',
    }),
  );

const isLoggedin = (req,res,next)=>{
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next()
}

app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    res.locals.currentUser = req.user
    next()
})

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/register', (req, res) => {
    res.render('user/register')
})

app.post('/register', express.json(), CatchAsync(async (req, res) => {
    try {
        const { username, password } = req.body
        const user = new User({ username });
        const registeredUser = await User.register(user, password);
        // res.redirect('/login')
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err)
            }else{
                req.session.UserData = req.user
                return res.redirect('/chatter')
            }
        })
    }
    catch(err){
        if (e.message.includes('E11000')) {
            e.message = "A user already exist with this username."
        }
        res.redirect('/register')
    }
}))

app.get('/login', (req, res) => {
    res.render('user/login')
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), CatchAsync(async (req, res) => {
    req.session.UserData = req.user
    // req.flash('success' , 'Logged In')
    res.redirect('/chatter')
}))

app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err)
        }
    });
    req.flash('success','Logged Out')
    res.redirect('/')
})

app.use('*', (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
    }else{
        req.flash('error', 'Login Required')
        res.redirect('/login')
    }
})

app.get('/deleteAllMessages',isLoggedin,async(req,res)=>{
    if(req.user.admin){
        await Message.deleteMany({})
    }else{
        req.flash('error' , 'Only Admin can clear messages')
    }
    res.redirect('/chatter')
})

app.get('/chatter', isLoggedin,async (req, res) => {
    const allMessages = await Message.find({}).populate('author').exec();
    res.render('chatter', { allMessages })
})

io.use(sharedsession(sessionConfig))

io.use((socket, next) => {
    const { handshake } = socket;
    if (handshake.session && handshake.session.passport && handshake.session.passport.user) {
        // User is authenticated, allow the connection
        return next();
    }
    // User is not authenticated, reject the connection
    return next(new Error('Authentication failed'));
});

io.on('connection',(socket) => {
    const currentUser = socket.handshake.session.UserData;
    try{
        io.emit('user connected', currentUser.username)
        console.log('user connected')
        socket.on('chat message', async (msg) => {
            if((await Message.find()).length >50){
                await Message.deleteMany({})
            }
            const message = new Message({ message: msg })
            message.author = currentUser
            await message.save()
            await message.populate('author')
            io.emit('chat message', message, currentUser._id)
        });
        socket.on('disconnect', () => {
            console.log('user disconnected')
            io.emit('user disconnected' , currentUser.username)
        });
    }catch(e){
        socket.emit('error', { message: 'An error occurred.' });
    }
});

app.use('*', (req, res, next) => {
    next(new ExpressError("Page Not Found", 401))
})

app.use((err, req, res, next) => {
    const { status = 500 } = err
    if (!err.message) err.message = "Oh No, Something Went Wrong!"
    res.status(status).render('error', { err })
})

server.listen(3000, () => {
    console.log('Listening')
})
