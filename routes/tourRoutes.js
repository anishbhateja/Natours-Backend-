const fs = require('fs');
const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

//router.param is middleware that will only run for the param 'id'
//router.param('id', tourController.checkId);

//Redirect all routes for '/:tourId/reviews' to reviewRouter
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

//Search tours within given distance at a given lat long
///tours-within/300/center/233.-135/unit/km
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

//Get distances of ALL tours from a given point
router.route('/distance/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours) //Everyone should be able to view all tours, no auth. req.
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), //Only admin and lead guides should be allowed to create tours
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), //Not all logged in users shouldbe able to perform same action on API, like no user should be able to
    tourController.deleteTour //delete the tour, it should only be the admin
  );

module.exports = router;
