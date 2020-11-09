const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: `${__dirname}/config.env` }); //used to read .env files and store them into nodejs environment variables

//Error handling for uncaughtException Bugs in synchronous code, this will shut down the server gracefully
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION!💥Shutting down....');
  process.exit(1); //0->success 1->unhandled rejection
});

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
const server = app.listen(port, () => {
  console.log('App running on port:', port);
});

//Error handling for unhandledRejection eg failed promises asynchronous, this will shut down the server gracefully
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥Shutting down....');
  server.close(() => {
    process.exit(1); //0->success 1->unhandled rejection
  });
});

//Heroku sends a sigtem signal every 24hrs to shut down, hence we need to make sure the system shuts down gracefully.
process.on('SIGTERM', () => {
  console.log('SIGTERM received! 💥Shutting down.........');
  server.close(() => {
    //will make ongoing requests are completed before Shutting down
    console.log('💥 Process terminated!');
    //SIGTERM will automatically make the process shut
  });
});
