const fs = require('fs');
const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

//router.param is middleware that will only run for the param 'id'
//router.param('id', tourController.checkId);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
