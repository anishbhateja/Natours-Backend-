const mongoose = require('mongoose');
const Tour = require('./tourModels');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty,'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating must be entered'],
      min: 1,
      max: 5,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour '],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//Static methods(called on class) Instance method(callled o object)
//this (static Mehod)=Model,
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        numRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    console.log(stats);
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//QUERY MIDDLEWARE (this->document)
reviewSchema.post('save', function () {
  //this points to current review / this.costructor = object.constructor = class/model
  this.constructor.calcAverageRatings(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete (has access to only QUERY MIDDLEWARE)

//DOCUMENT MIDDLEWARE (this->query object)
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

reviewSchema.post(/save|^findOneAnd/, async (doc, next) => {
  //console.log(doc.constructor);
  await doc.constructor.calcAverageRatings(doc.tour);
  next();
});
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   //we need the current review document to call alcAverageRatings, this->query
//   this.r = await this.findOne(); // Retreiving document from query object  storing it document in the query object itself
//   console.log(this.r);
//   next();
// });

// reviewSchema.post(/^findOneAnd/, async function (doc, next) {
//   this.r = await this.findOne(); // Does Not work here because query has been executed
//   await this.r.constructor.calcAverageRating(this.r.tour); //this in post query middleware is the executed quey but we have store the review document in it
// }); //since calAverageRating is static method, it can only be called upon the Model, to get model we use this.r(review document).constructor(Review MODEL)

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
