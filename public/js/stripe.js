/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51HklVTHOQueVdWWoyoBb7GGhrdXqWNduYhaoJmseqXSXNwOcCkV0irC8Qa7oxUzz6BhuxRdwJTjXgd6XnrmWSkqa00icZPEyet'
);

export const bookTour = async (tourId) => {
  try {
    //1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`); //for get requests, we don't need to specify method,url etc in axios

    //2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    // console.log(error);
    showAlert('error', error);
  }
};
