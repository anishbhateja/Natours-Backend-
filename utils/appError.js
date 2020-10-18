class AppError extends Error {
  constructor(message, statusCode) {
    super();
    this.message = message;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //opertaionlerror=validation errors/db connection error

    Error.captureStackTrace(this, this.constructor);
    //whenever new object is created this constructor is called, this will not let that pollute the stackTrace
  }
}

module.exports = AppError;
