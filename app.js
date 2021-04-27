if (process.env.NODE_ENV !== 'production') {
	//do not send the env file if going to production
	require('dotenv').config();
}
const express = require('express'); // back end web application framework for Node.js
const path = require('path'); //provides utilities for working with file and directory paths
const mongoose = require('mongoose'); //enable easy use of mongoDB
const cors = require('cors'); //enable CORS with various options for api calls
const methodOverride = require('method-override'); //middleware function to override the req. method property with a new value
const ejsMate = require('ejs-mate'); //Hangle the ejs rendering of our pages
const AppError = require('./utils/appError'); //Error wrapper for dealing with errors thrown by the routes
const flash = require('connect-flash'); //flash update for screen updates
const session = require('express-session'); //browser cookie storage and enable flash
const MongoStore = require('connect-mongo'); //For connecting databases for deployment
const cookieParser = require('cookie-parser'); //browser cookie generage and reading
const passport = require('passport'); //progam to help with user auth
const LocalStrategy = require('passport-local'); //email and password login on local machine
const User = require('./models/user'); //user model
const mongoSanitize = require('express-mongo-sanitize'); //package to block mongo injection secuirty issues
const helmet = require('helmet'); //helps secure app from easy security leaks
const investmentRoutes = require('./routes/investments'); //seperate out the routes to a different file
const userRoutes = require('./routes/user'); //seperate out the User routes to a different file

//mongoose connection to server and setup
//local host: 'mongodb://localhost:27017/ticker' or mongo database url
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/ticker';
mongoose.connect(dbUrl, {
	useNewUrlParser    : true,
	useCreateIndex     : true,
	useUnifiedTopology : true,
	useFindAndModify   : false
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () => {
	console.log('Database connected');
});

//setup the express app
const app = express();

app.engine('ejs', ejsMate); //how to render the html pages
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); //shortens path routing names

app.use(express.urlencoded({ extended: true })); //parse body
app.use(methodOverride('_method')); //enables sending to put routes via POST
app.use(express.static(path.join(__dirname, 'public'))); //Public Directory - Error - validate forms says good when blocked

const secret = process.env.SECRET || 'makearealsecretlater';

app.use(
	session({
		name              : 'cryptotickers',
		secret,
		resave            : false,
		saveUninitialized : true,
		store             : MongoStore.create({
			mongoUrl   : dbUrl,
			touchAfter : 24 * 3600 // time period in seconds
		})
	})
); //connect and save users on mongo atlas via heroku

app.use(flash()); //Provide way to send alerts to users via middleware
app.use(cookieParser());
app.use(helmet());
app.use(mongoSanitize()); //make sure users can't easily send malicious code via scripts in input
app.use(
	cors({
		credentials : true
	})
); //enable calls to the APIs
app.options('*', cors()); //heading setting that allows Access-Control-Allow-Origin server access

//whitelist apis and links
const scriptSrcUrls = [
	'https://stackpath.bootstrapcdn.com/',
	'https://kit.fontawesome.com/',
	'https://cdnjs.cloudflare.com/',
	'https://cdn.jsdelivr.net',
	'https://cdn.jsdelivr.net/npm/ccxt@1.48.25/dist/ccxt.browser.js',
	'https://unpkg.com/axios/dist/axios.min.js',
	'https://code.jquery.com/jquery-3.3.1.slim.min.js'
];
const styleSrcUrls = [
	'https://kit-free.fontawesome.com/',
	'https://stackpath.bootstrapcdn.com/',
	'https://fonts.googleapis.com/',
	'https://use.fontawesome.com/',
	'https://cdn.jsdelivr.net'
];
const connectSrcUrls = [];
const fontSrcUrls = [];
app.use(
	helmet.contentSecurityPolicy({
		directives : {
			defaultSrc : [],
			connectSrc : [
				"'self'",
				...connectSrcUrls
			],
			scriptSrc  : [
				"'unsafe-inline'",
				"'self'",
				...scriptSrcUrls
			],
			styleSrc   : [
				"'self'",
				"'unsafe-inline'",
				...styleSrcUrls
			],
			workerSrc  : [
				"'self'",
				'blob:'
			],
			objectSrc  : [],
			imgSrc     : [
				"'self'",
				'blob:',
				'data:',
				// 'https://res.cloudinary.com/douqbebwk/', //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
				'https://images.unsplash.com/'
			],
			fontSrc    : [
				"'self'",
				...fontSrcUrls
			]
		}
	})
);

//Auth user for entire sessions
app.use(passport.initialize());
app.use(passport.session()); //store user info to keep them logged in
passport.use(new LocalStrategy(User.authenticate())); //is user password and email combo valid

passport.serializeUser(User.serializeUser()); //how to store and unstore user's sessions
passport.deserializeUser(User.deserializeUser());

//Flash create middleware to use the flash alert
app.use((req, res, next) => {
	res.locals.updateTics = false;
	res.locals.currentUser = req.user;
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
});

//Route Paths
app.use('/investments', investmentRoutes); //use the investments routes
app.use('/', userRoutes); //use the user routes
// app.use('/crypto', cryptoRoutes); //use the crypto routes

//home page route
app.get('/', (req, res) => {
	res.render('home');
});

//error handling wrapper for each of the routes
app.all('*', (req, res, next) => {
	next(new AppError('Page not found', 404));
});

//handle errors from app
app.use((err, req, res, next) => {
	console.log(err);
	const { status = 500 } = err;
	if (!err.message) err.message = `Something went wrong: Please go back and try again.`;
	res.status(status).render('error', { err });
});

//App connection route
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Serving on port ${port}`);
});
