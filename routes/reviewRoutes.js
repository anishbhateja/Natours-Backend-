const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.route('/').get(reviewController.getAllReviews).post(
  authController.protect,
  authController.restrictTo('user'), //only users allowed to post review
  reviewController.createReview
);

module.exports = router;
