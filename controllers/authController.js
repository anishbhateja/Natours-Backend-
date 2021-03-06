const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  //In development we send cookies over http but in production
  //we first check if we're actually on https by checking the below conditions and then send over cookies over https in production
  //being in production doesn't gurantee https, hence we check with the conditions req.secure || req.headers['x-forwarded-proto'] === 'https'

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, //secure: false, //cookie will only be sent over http
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https', //if true, cookies will only be sent over https
  });

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
  //   const token = signToken(newUser._id);

  //   res.status(201).json({
  //     status: 'success',
  //     token,
  //     data: {
  //       user: newUser,
  //     },
  //   });
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
  createSendToken(user, 200, req, res);

  //   const token = signToken(user._id);
  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});

//for logging out since we have a httpOnly:true i.e we cannot delete/update cookie on the browser in any way, hence we create a route that
//sends return a cookie with the same that exists on browser such that it overrides the previous with new empty cookie
exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
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
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //console.log(token);
  if (!token) {
    next(
      new AppError(`You are not logged in! Please log in to get access.`, 401)
    );
  }
  //2) Verification token (decoded:JWT patload)
  // const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //traditionally, 3rd argument of .verify is a callback
  const decoded = await jwt.verify(token, process.env.JWT_SECRET); //traditionally, 3rd argument of .verify is a callback

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
  if (await freshUser.changedPasswordAfter(decoded.iat)) {
    //iat=issued at
    return next(
      new AppError(`User recently changed password!. Please log in again!`, 400)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser; //USER IS PUT INTO REQ/USER
  res.locals.user = freshUser; //USER IS PUT INTO res.locals for access in templates
  next();
});

//only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  //1) Getting token and check if it's there
  try {
    if (req.cookies.jwt) {
      //1) Verify token
      const decoded = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET); //traditionally, 3rd argument of .verify is a callback

      //2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // if password is changed post token is sent then that token should be revoked
      //4)Check if user changed password after token was issued
      if (await currentUser.changedPasswordAfter(decoded.iat)) {
        //iat=issued at
        return next();
      }
      //THERE IS A LOGGED IN USER
      res.locals.user = currentUser; //This will make the user available in the
      return next();
    }
  } catch (error) {
    return next();
  }

  return next();
};

exports.restrictTo = (...roles) => {
  //es6 syntax for array
  return (req, res, next) => {
    //roles is an array ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      //Curr user is stored in the req.user by the authCOntroller.protect() ABOVE
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }
  //2) Generate the random reset token
  const resetToken = user.correctPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //until before we only update the user before but never saved it

  //3) Send it users email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset(); //Sending Email for resetting password

    res.status(200).json({
      status: 'success',
      message: 'Token send to the mail',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); //until before we only update the user before but not saved it
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); //token stored in dB is hashed
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) If token has not expired, and there is user, set new passwordResetToken
  if (!user) {
    return next(new AppError(`Token is invalid or expired`, 400));
  }

  //3 Update changePasswordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //passwordChangedAt will be altered by middleware
  await user.save();

  //4 Log user in in,send jwt to user
  createSendToken(user, 200, req, res);

  //   const token = signToken(user._id);
  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});

//For logged in users, still user needs to pass his curr password in order to verify
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  //2) Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  //   console.log(await !user.correctPassword(req.body.password, user.password));
  //3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //User.findByIdAndUpdate CANNOT be used, doesn't allow validators to run
  //and prevents the mongoose middleware to runtime
  //always use .save and .create

  //4 Log user in, send jwt
  createSendToken(user, 201, req, res);

  //   const token = signToken(user._id);
  //   return res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});
