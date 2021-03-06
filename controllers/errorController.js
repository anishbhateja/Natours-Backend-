const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  // Makes InvalidId errors as operational
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((ele) => ele.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token, Please log in again!', 401);
};

const handleExpiredToken = () => {
  return new AppError('Your token has expired! Please log in again!', 401);
};

//In development mode we want to send as musch information as possible to the client
const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }
  // RENDERED WEBSITE
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};
//In production mode we want to send as little information as possible to the client
const sendErrorProd = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      //Trusted Error:  Errors created by our own appError class, we send a little discriptive message

      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //1)Log Error
    console.log('Error💥', err);
    return res.status(500).json({
      //2) Send generic error message
      status: 'error',
      message: 'Something went very wrong',
    });
  }
  //RENDERED WEBSITE
  //A) Operational Error
  if (err.isOperational) {
    //Trusted Error:  Errors created by our own appError class, we send a little discriptive message
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  //B)Unknown Error
  //1)Log Error
  console.log('Error💥', err);
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

//whenever there are 4 inputs, it is the
//GLOBAL ERROR HANDLING MIDDLEWARE
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    //In development mode we want to send as musch information as possible to the client
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //there are certain errors by mongoose like invalid id's, validation for which we want to send particular message identying the problem
    //hence we identify those errors  and convert them into operational errors
    let error = { ...err };
    error.message = err.message;
    if (error.kind === 'ObjectId') error = handleCastErrorDB(error); //Invalid Id's(converting into operational error)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); //Duplicate fields(converting into operational error)
    if (error._message === 'Validation failed') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleExpiredToken();
    }
    sendErrorProd(error, req, res);
  }
};
