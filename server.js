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

//console.log(app.get('env')); //set by express
//console.log(process.env); //environment variables set by nodes

const port = process.env.PORT;
app.listen(port, () => {
  console.log('App running on port:', port);
});
