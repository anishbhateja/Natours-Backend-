const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

//allowedFields=['name','email'] // will remove an additional objects
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((ele) => {
    if (allowedFields.includes(ele)) {
      newObj[ele] = obj[ele];
    }
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

//USER DELETING ITSELF

//Query middleware will segregate all inactive users using document middleware
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

//USER UPDATING ITSELF
exports.updateMe = catchAsync(async (req, res, next) => {
  //1)Create error if user posts password data, we have a seperate route for that
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        `This route is not for password update. Please use /updateMyPassword`,
        400
      )
    );
  }
  //2)Filtered out unwanted fields that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3)Update the document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
