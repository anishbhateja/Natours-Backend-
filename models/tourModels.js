const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
    },
    slug: String,
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
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
//virtual properties, fields defined in schema but will not be saved in DB
// use regular function to use 'this' keyword, this refers to the current document
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; //Add toJSON: { virtuals: true }, toObject: { virtuals: true } in options
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()  but NOT inserMany()
tourSchema.pre('save', function (next) {
  //console.log(this); // this refers to currently saved document
  this.slug = slugify(this.name, { lower: true }); //add slug to schema to modify it
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document......');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   //doc contains the finshed document
//   console.log('Document:', doc);
// });

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  //regular expression will work for all find cases
  //'this' is the query object
  this.start = Date.now();
  this.find({ secretTour: { $ne: true } });
  next();
});
// tourSchema.pre('findOne', function (next) {  //regular expression will work for all find cases [findById=findOne in mongoDb]
//   //'this' is the query object
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

tourSchema.post(/^find/, function (docs, next) {
  //will run after quey is executed
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  //console.log(docs);
  next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: false } });
  console.log(this.pipeline()); //this=aggregation  object
  next();
});

const Tour = mongoose.model('Tour', tourSchema); //MODELS ARE LIKE CLASSES, WE CREATE DOCS(OBJECTS) OUT OF THEM

module.exports = Tour;
