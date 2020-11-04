const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

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

  //2)Build template for

  //Render template using data from 1
  res.status(200).render('tour', { title: `${tour.name} Tour`, tour });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});
