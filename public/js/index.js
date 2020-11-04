import { displayMap } from './mapbox';
import { login } from './login';
import '@babel/polyfill';

// console.log('Hello from index.js');

// //DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  console.log('Hey from the MapBox 🤗');
  displayMap(locations);
}

if (loginForm) {
  console.log('Hey from the LOGIN form 🤗');
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
console.log('Hello from parcel!');
