const express = require('express');
const app = express();
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

//1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //LOGGER
}

app.use(express.json()); //middleware, PUTS DATA of incomming request(JSON) in it's body (req.body)
app.use(express.static(`${__dirname}/public`)); //middleware that allows us to access static files,when nothing matches the route

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//4) START SERVER

module.exports = app;
