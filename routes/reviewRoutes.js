const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); //will merge params that were their rerouting URL

// POST /tour/56789e/reviews
// GET /tour/56789e/reviews
// POST /reviews (both of them will land in the post function down)

//Protect all routes after this middleware
router.use(authController.protect);

router.route('/').get(reviewController.getAllReviews).post(
  authController.restrictTo('user'), //only users allowed to post review
  reviewController.setTourUserIds,
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('admin', 'user'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('admin', 'user'),
    reviewController.deleteReview
  );

module.exports = router;
