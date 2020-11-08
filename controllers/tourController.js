const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModels');
const APIFeatures = require('../utils/apiFeaturs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
// );

const multerStorage = multer.memoryStorage(); //img will be stored as buffer in memory

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 404), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

//upload.array('images',5)  //if we only had multiple images with same name ---> REQ.FILES
//upload.single('image') ->REQ.FILE (returns req.file while the above to return req.files)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.images || !req.files.imageCover) {
    return next();
  }

  //1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //if we use foreach, the inner function being asyn will be skipped and we directly hit the next(), and req.body.images will be empty and  it will not be
  //persisted in the database in next middleware because the code in running asynchronously
  //hence we use a map method, map returns an array, and since all of the functions are asynchronous inside map
  //it will return an array of promises which we can wait for, that will all the req.body.images to filled up and only then call for the next()

  //2) Images
  req.body.images = [];
  await Promise.all(
    //check above explanation
    req.files.images.map(async (file, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

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
  // console.log(distance, latlng, unit);

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
