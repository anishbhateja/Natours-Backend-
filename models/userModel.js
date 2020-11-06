/* eslint-disable radix */
const crypto = require('crypto');
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
      default: 'default.png',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'guide', 'lead-guide'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'A user must have an password'],
      minlength: 1,
      select: false, //it won't show up in results
    },
    passwordConfirm: {
      type: String,
      required: [true, 'A user must have a confirm password'],
      validate: [
        //validators only work on SAVE() and CREATE(), NOT UPDATE
        function (value) {
          return this.password === value;
        },
        'Passwords are not the same!',
      ],
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
//Before saving document, if password is modiefied, middleware will update time at which password was changed
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  //Sometimes saving to database takes more time, so while performing forget password action,
  //where password is changed and then jwt is issued, it might happen that passwordChanged takes
  //longer to finish and has a time more than jwt issued at, which will cause it to fail
  //in authController.protect, hence we reduce 1 sec just to be safe from here
  next();
});

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

//filter users [active:false]
userSchema.pre(/^find/, async function (next) {
  //Query Middleware, this->query
  this.find({ active: { $ne: false } });
  next();
});

//instance methods are accessible to all documents of the collection

//Checks if the password entered is correct
userSchema.methods.correctPassword = async function (
  //function will return true/false depending upon match results
  candidatePassword, //password received from req.body
  userPassword //this.password cannot be accessed because select: false by default
) {
  return await bcrypt.compare(candidatePassword, userPassword); //cannot be compared directly because user password is hashed
}; //hence bcypt is used to compare hash passwords to string passwords

//Checks if user changed password after token was issued
userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  let changedTimestamp;
  if (this.passwordChangedAt) {
    changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    return changedTimestamp > JWTTimestamp;
    //TRUE: PASSWORD CHANGED POST ISSUING OF TOKEN
  }
  //FALSE MEANS NOT CHANGED
  return false;
};

//Generates token for resetting password, encyted form of that token is stored in DB
userSchema.methods.correctPasswordResetToken = function () {
  //generating token
  const resetToken = crypto.randomBytes(32).toString('hex');

  //encrypting the token (we should hash the token before saving it to the database )
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //token will expire in 10 minutes
  return resetToken; // we will send unencrypted token,
  //DATABASE has encrypted token, user is sent plain reset token
  //when user requests for change password, plain token is received, encrypted and compared to the one stored in database
};

const User = mongoose.model('User', userSchema);
module.exports = User;
