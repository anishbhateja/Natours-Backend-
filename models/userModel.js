const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name!'],
    },
    email: {
      type: String,
      required: [true, 'Please tell us your email!'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email!'],
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'A user must have an password'],
      minlength: 1,
      select: false, //it won't show up in results
    },
    passwordConfirm: {
      type: String,
      required: [true, 'A user must have an password'],
      validate: [
        //validators only work on SAVE() and CREATE(), NOT UPDATE
        function (value) {
          return this.password === value;
        },
        'Passwords are not the same!',
      ],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//document middleware, after document is created and before it saved in the database
userSchema.pre('save', async function (next) {
  //Only run this function if password is modified
  if (!this.isModified('password')) {
    //if password isn't modified, return from function
    return next();
  }

  //Hash the password with cost 12
  this.password = await bcrypt.hash(this.password, 12); //12 = cost internsive cpu opertaion will be, more cost=more secure,more time

  //Delete confirm password field
  this.passwordConfirm = undefined;
  next();
});

//instance methods are accessible to all documents of the collection
userSchema.methods.correctPassword = async function (
  //function will return true/false depending upon match results
  candidatePassword, //password received from req.body
  userPassword //this.password cannot be accessed because select: false by default
) {
  return await bcrypt.compare(candidatePassword, userPassword); //cannot be compared directly because user password is hashed
}; //hence bcypt is used to compare hash passwords to string passwords

const User = mongoose.model('User', userSchema);
module.exports = User;
