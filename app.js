const express = require('express');

const app = express();
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSantize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

//1) GLOBAL MIDDLEWARES
//app.use always requires a function not a function call

// SET SECURITY HTTP headers
app.use(helmet()); //helmet() return a function which in turn is a midlleware function

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

//Body Parser, PUTS DATA of incomming request(JSON) in it's body (req.body)
app.use(express.json({ limit: '10kb' })); // will not body larger than 10 KB

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

//Serving static files,when nothing matches the route
app.use(express.static(`${__dirname}/public`));

//Test Middleware

app.use((req, res, next) => {
  console.log('Hello from the middleware 🙄');
  req.requestTime = new Date().toISOString();
  next();
});

//Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//UNMATCHED REQUESTS HANDLER

app.all('*', (req, res, next) => {
  // let err = new Error(`Can't find ${req.originalUrl} on this server! `);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);
  //if next is given an argument no matter what! Express will assume that it was an error, it will skip all the middlewares in
  //middleware stack directly to the GLOBAL ERROR HANDLING MIDDLEWARE
  next(new AppError(`Can't find ${req.originalUrl} on this server! `, 404));
});

//GLOBAL ERROR HANDLING MIDDLEWARE

app.use(globalErrorHandler);
//if next is given an argument no matter what! Express will assume that it was an error, it will skip all the middlewares in
//middleware stack directly to the GLOBAL ERROR HANDLING MIDDLEWARE

//4) START SERVER

module.exports = app;
