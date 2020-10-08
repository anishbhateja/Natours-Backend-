const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: `${__dirname}/config.env` }); //used to read .env files and store them into nodejs environment variables

const app = require('./app');

const DB = process.env.DATABASE.replace(
  //Replac
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//.connect(process.env.DATABASE_LOCAL, { //LOCAL DB CONNECTION
mongoose
  .connect(DB, {
    //HOSTED DB CONNECTION
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful'));

// const tourSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'A tour must have a name'],
//     unique: true,
//   },
//   rating: { type: Number, default: 4.5 },
//   price: { type: Number, required: [true, 'A tour must have a price'] },
// });

// const Tour = mongoose.model('Tour', tourSchema); //MODELS ARE LIKE CLASSES, WE CREATE DOCS(OBJECTS) OUT OF THEM

// const testTour = new Tour({
//   //created new object out of class
//   name: 'The Park camper',
//   price: 997,
// });
// //save document in db
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('Error 💥💥💥💥', err);
//   });

//console.log(app.get('env')); //set by express
//console.log(process.env); //environment variables set by nodes

const port = process.env.PORT;
app.listen(port, () => {
  console.log('App running on port:', port);
});
