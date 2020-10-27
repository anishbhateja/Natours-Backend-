const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

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

//USER DELETING ITSELF

//Query middleware will segregate all inactive users using document middleware
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

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

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signUp instead',
  });
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//DO NOT update password with this, uses findByIdAndUpdate(No validators are run)
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
