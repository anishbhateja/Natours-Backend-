const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError(`Please provide email and password`, 400));
  }
  //2) check if user exists && password matches
  const user = await User.findOne({ email }).select('+password'); // we have added select:false by default in schema

  if (!user || !(await user.correctPassword(password, user.password))) {
    //password=>req.body.password
    return next(new AppError(`Incorrect email or password`, 401));
  }
  //3)if everthing is okay, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  //console.log(token);
  if (!token) {
    next(
      new AppError(`You are not logged in! Please log in to get access.`, 401)
    );
  }
  //2) Verification token (decoded:JWT patload)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //traditionally, 3rd argument of .verify is a callback
  //const decoded = await jwt.verify(token, process.env.JWT_SECRET); //traditionally, 3rd argument of .verify is a callback

  // to avoid callbacks, and use promises, we can use promisify

  //3) Check if user still exists
  const freshUser = await User.findById({ _id: decoded.id });
  if (!freshUser) {
    return next(
      new AppError(`The user belonging to this token does no longer exist`, 401)
    );
  }
  // if password is changed post token is sent then that token should be revoked
  //4)Check if user changed password after token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    //iat=issued at
    return next(
      new AppError(`User recently changed password!. Please log in again!`, 400)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  next();
});
