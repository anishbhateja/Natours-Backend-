const fs = require('fs');
const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

//router.param is middleware that will only run for the param 'id'
//router.param('id', tourController.checkId);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), //Not all logged in users shouldbe able to perform same action on API, like no user should be able to
    tourController.deleteTour //delete the tour, it should only be the admin
  );

module.exports = router;
