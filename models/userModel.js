const mongoose = require('mongoose');
const validator = require('validator');

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
      validate: [validator.isEmail, 'Email not correct!'],
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'A user must have an password'],
      minlength: 8,
    },
    confirmPassword: {
      type: String,
      required: [true, 'A user must have an password'],
      validate: [
        function (value) {
          return this.password === value;
        },
        'Password and confirm Password must me same!',
      ],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
