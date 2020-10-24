const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [
        40,
        'A tour must have length less than or equal to 40 character',
      ],
      minlength: [
        1,
        'A tour must have length more than or equal to 10 character',
      ],
      //  validate: [validator.isAlpha, 'Tour names must only contain characters'], // validator library for checking
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
      enum: {
        //Should only be used with strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult ',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      //   validate: {
      //     message: 'Discount price ({VALUE}) should be below regular price',
      //     validator: function (val) {
      //       //this only point to current document on NEW DOCUMENT creation, doesn't work on updateDocument
      //       return val < this.price; //100<200=true, 250-200=false this will refer to the current document
      //     },
      //   },
      validate: [
        function (val) {
          return val < this.price;
        },
        'Discount price should be below regular price',
      ],
    },
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
    startLocation: {
      //GeoJSON Object
      //GeoJSON (this object is not for options like above but is itself an embedded object)
      //In order to define geospatial data, we need to define an object with atleast 2 properties which are type and coordinates
      //Each of these subfields will have their own options
      type: {
        type: String,
        default: 'Point', //we can specify multiple geometries in mongoDB, default is Point
        enum: ['Point'],
      },
      coordinate: [Number], //long,lat
      address: String,
      description: String,
    },
    locations: [
      //this is an array of GeoJSON objects
      {
        type: {
          type: String,
          default: 'Point', //we can specify multiple geometries in mongoDB, default is Point
          enum: ['Point'],
        },
        coordinate: [Number], //long,lat
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        //for referencing
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
//virtual properties, fields defined in schema but will not be saved in DB

// use regular function to use 'this' keyword, this refers to the current document
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; //Add toJSON: { virtuals: true }, toObject: { virtuals: true } in options
});

//VIRTUAL POPULATE
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //matching foreign field 'tour' in Review collection
  localField: '_id', //Comparing it with _id of this document, it will fetch all those review documents with matching foreign-local fields
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()  but NOT inserMany()
tourSchema.pre('save', function (next) {
  //console.log(this); // this refers to currently saved document
  this.slug = slugify(this.name, { lower: true }); //add slug to schema to modify it
  next();
});

// tourSchema.pre('save', async function (next) { //Embeds documents in DB
//   const guidesPromises = this.guides.map(async (id) => {
//     return await User.findById(id);
//   });
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

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

tourSchema.pre(/^find/, function (next) {
  this.populate({
    //this points to the current query, populating guides before executing queries
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

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
