const dotenv = require('dotenv');
dotenv.config({ path: `${__dirname}/config.env` }); //used to read .env files and store them into nodejs environment variables

const app = require('./app');

console.log(app.get('env')); //set by express
//console.log(process.env); //environment variables set by nodes

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('App running on port:', port);
});
