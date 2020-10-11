const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
    },
    ratingsAverage: { type: Number, default: 4.5 },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: { type: Number },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover'],
    },
    images: [String], //an array of String
    //   createdAt: {
    //     type: Date,
    //     default: Date.now(),
    //     select:false
    //   },
    startDates: [Date], //an array of Dates
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
//virtual properties, fields defined in schema but will not be saved in DB
// use regular function to use 'this' keyword, this refers to the current document
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

const Tour = mongoose.model('Tour', tourSchema); //MODELS ARE LIKE CLASSES, WE CREATE DOCS(OBJECTS) OUT OF THEM

module.exports = Tour;
