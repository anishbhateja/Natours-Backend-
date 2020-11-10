const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSantize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy'); //heroku modiefies are incoming request, it's headers, this prevents it from doing so

//setting up view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); //whenever we search for .render('file'), it will come look in the views for file

//Serving static files,when nothing matches the route
app.use(express.static(path.join(__dirname, 'public')));

//1) GLOBAL MIDDLEWARES
//app.use always requires a function not a function call

app.use(cors()); //sets headers on res to all cross sharing
//will Access-Control-Allow-Origin set to all requets coming through,(allowing everyone to consume our api )
//this will only work on simple request(post and get )

//when we want to all cross sharing only with one particula domain 'https://www.natours.com'
// api.natours.com front-end natours.com
// app.use(
//   cors({
//     origin: 'https://www.natours.com',
//   })
// );

//for non simple(patch,update,delete) requests, browser sends an options request(preflight phase) to which we send an Access-Control-Allow-Origin header
//to confirm with browser that it is safe to send over non simple request from cross sharing resources
app.options('*', cors());
//app.options('/api/v1/tours/:id', cors()); //can allow non simple request for only cerain routes

// SET SECURITY HTTP headers
app.use(helmet()); //helmet() return a function which in turn is a midlleware function
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", 'https:', 'http:', 'unsafe-inline'],
    },
  })
);

//Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //LOGGER
}

//Limit request from API
const limiter = rateLimit({
  //rate limit returns us a middleware
  max: 500,
  windowMs: 60 * 60 * 1000, //all 100 request in 1 hour window per IP address
  message: 'Too many requests from this IP, Please try again in an hour',
});

app.use('/api', limiter); //rate limit returns us a middleware that we're using

//we write this here because the stripe function that will read the sessions objects needs it in RAW FORM and not json
//express.raw() will parse data in raw form
app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);
//app.use(express.json()); as soon as the req passes this middleware, it will parse data in json

//PARSER

//Body Parser, PUTS DATA of incomming request(JSON) in it's body (req.body)
app.use(express.json({ limit: '10kb' })); // will not body larger than 10 KB
//Cookie Parser PUTS DATA of incomming cookies  request in (req.cookies)
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//Data sanitization against NoSQL query injection
app.use(mongoSantize()); //will look into all req.body,req.params and remove all $signs operators etc

//Data sanitization against XSS (cross site scripting)
app.use(xss()); //clean any input with malicious html javascript in it

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression()); //will compress all the files being sent over to the client.(not for images)

//Test Middleware

app.use((req, res, next) => {
  // console.log('Hello from the middleware 🙄');
  req.requestTime = new Date().toISOString();
  //if (req.cookies) console.log('COOKIE 🍪', req.cookies);
  next();
});

//Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

//UNMATCHED REQUESTS HANDLER

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server! `, 404));
});

//GLOBAL ERROR HANDLING MIDDLEWARE

app.use(globalErrorHandler);
//if next is given an argument no matter what! Express will assume that it was an error, it will skip all the middlewares in
//middleware stack directly to the GLOBAL ERROR HANDLING MIDDLEWARE

//4) START SERVER

module.exports = app;
