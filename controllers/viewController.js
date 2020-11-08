const Tour = require('../models/tourModels');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const User = require('../models/userModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1 Get tour data from collection
  const tours = await Tour.find();

  //2) Build template for
  //3) Render that template using tour data from 1
  res.status(200).render('overview', { title: 'All Tours', tours }); //this will directory go to the views folder and search for the file over there
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) Get the data, for requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user ',
  });
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  //Render template using data from 1
  res.status(200).render('tour', { title: `${tour.name} Tour`, tour });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getAccount = async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) Find All Bookings
  const bookings = await Booking.find({ user: req.user.id }); //this will return all the bookings relating to the user

  //2) Find tours with returned ID's
  const tourIDs = bookings.map((el) => el.tour); //this will return an array of tour Id's
  const tours = await Tour.find({ _id: { $in: tourIDs } }); //this will fetch all the docs which have an _id IN the tourId's array

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
