const express = require('express');

const app = express();
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

//1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //LOGGER
}
app.use(express.json()); //middleware, PUTS DATA of incomming request(JSON) in it's body (req.body)
app.use(express.static(`${__dirname}/public`)); //middleware that allows us to access static files,when nothing matches the route

app.use((req, res, next) => {
  console.log('Hello from the middleware 🙄');
  //console.log(req.headers);
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

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
