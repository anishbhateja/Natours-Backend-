const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); //this give us the stripe object
const Tour = require('../models/tourModels');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) Get the currently booked tour

  const tour = await Tour.findById(req.params.tourID);

  //2) Create checkout session object
  const session = await stripe.checkout.sessions.create({
    //creating the session which will then be passed on to the front end where payment will take place
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-tours?tour=${
    //   req.params.tourID
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID, //we will be creating a booking from this session object: which userID,tourID,price
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
        ],
        amount: tour.price * 100 * 73.98, //amt is expected to be in cents
        currency: 'inr',
        quantity: 1,
      },
    ],
  });

  //3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying!
//   const { tour, user, price } = req.query;
//   if (!tour || !user || !price) {
//     return next();
//   }
//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email }).id;
  // const price = session.display_items[0].amount / 100;
  const price = session.amount_total / (100 * 73.98);

  await Booking.create({ tour, user, price });
};

//this is a webhook, as soon as payment is successful, stripe will make a posy request to this route before going to the success url
exports.webhookCheckout = async (req, res, next) => {
  console.log('Hello from webhook checkout');
  const signature = req.headers['stripe-signature'];
  var event;
  try {
    event = await stripe.webhooks.constructEvent(
      req.body, //this body needs to be in the raw format
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }
  console.log('STRIPE EVENT', event);

  if (event.object === 'event') {
    createBookingCheckout(event.data.object);
    res.status(200).json({
      received: true,
    });
  }
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
