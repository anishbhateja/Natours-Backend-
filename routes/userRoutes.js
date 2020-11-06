const express = require('express');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authController.js');
const reviewController = require('../controllers/reviewController.js');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto, //this stores image from file in the buffer not in the disk.
  userController.resizeUserPhoto, //extracts the image from buffer(memory), resizes it and stores it on the disk
  userController.updateMe // updates photo along with any other data(name and email)
); //upload.single grabs the file and stores it to the destination
router.delete('/deleteMe', userController.deleteMe);
router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
