const Tour = require('../models/tourModels');
const APIFeatures = require('../utils/apiFeaturs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
// );

//2) ROUTE HANDLERS (TOUR)

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//catchAsync function takes a function as argument,  catchAsync function returns another function, this other function that it returns
//takes arguments which required to execute the function which it itself takes as the argument
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

//Aggregation: We define a pipeline, in which documents of a collection are passed, they're processed at various stages and are
//finally used to compute averages,min, max etc................................

exports.getTourStats = catchAsync(async (req, res, next) => {
  // each stage is object
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } }, //match is like filterObject,
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        //_id: '$ratingsAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        averageRating: { $avg: '$ratingsAverage' }, //the field we want to pass inside ' '(quotes) + $
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        //we can  only by by the parameters we defined in the group stage
        averagePrice: 1, //1 is for ascending
      },
    },
    // { $match: { _id: { $ne: 'EASY' } } },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

//function to calculate busiest month(max no. of tours in month)

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    // { $limit: 5 },
  ]); //unwind: deconstructs array field from i/p document and o/p one document for 1 element of array

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit,
///tours-within/300/center/34.125639, -118.126945/unit/km

//returns all tours that lies within a given distance of a given latlng
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  console.log(distance, latlng, unit);

  const [lat, lng] = latlng.split(',');

  //radius is measured in radians-> distance/radius of earth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        `Please provide latitude and longitude in the format lat,lng.`,
        400
      )
    );
  }
  //querying for startLocation: because it holds geoSpatial points where each tour starts
  //For this to work we also have need an attribute an index to the field where geoSpatial data is stored, startLocation in this field
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }, //queying for tours that are ecnclosed within the distance of latlng point
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: tours,
  });
});

//Returns distances of all tours from a given latlng
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        `Please provide latitude and longitude in the format lat,lng.`,
        400
      )
    );
  } //for geospatial aggregation, we only have one single stage $geoNear
  // it should always be the first one in the pipeline and
  //One of the fields must be geoSpatial index, startLocation in our case
  //$geoNear will automatically use the geoSpatial index to perform calculation
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          //near has to be define as geoJSON
          type: 'Point',
          coordinates: [lng * 1, lat * 1], //will calculate distances between this near point and startLoaction of sll tours
        },
        distanceField: 'distance', //this field will be added to all the tours with the above calculated distances in METRE
        distanceMultiplier: multiplier, //here we can specify a number that will multipied with all the numbers, Coverting metre to km or miles
      },
    },
    {
      $project: {
        //only these fields will be projected
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: distances,
  });
});
