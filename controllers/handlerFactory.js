const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeaturs');

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No tour found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};
exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    //Tours.findOne({_id:req.params.id})
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError('No tour found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    //EXECUTING QUERY
    //we're creating object of APIFeatures class, object contains the query object and queryString, we want to chain these
    //function one by to the query object
    //The class will return a features object, features will contain the query chained with all the features
    //Only await needs to be put ahead of that query object in order to execute it

    //To allow nested GET reviews on tours
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain(); //.explain() gives stats
    const doc = await features.query; //before this is executed query middleware is executed to further filter out the query
    //after chaining requests, we can write await, it will execute the query and get the corresponding documents

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
};
