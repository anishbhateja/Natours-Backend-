/* eslint-disable */

//Accessing data stored in the data attributeproperty
// const locations = JSON.parse(document.getElementById('map').dataset.locations);
// console.log(locations);

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYW5pc2hiaGF0ZWphIiwiYSI6ImNraDFtN2RvazA2bnoycm83eHcyMzRzNXgifQ.gV1G0GSn9c3dOw1Oy7rzHw';

  //this will put the map on the element called 'map' as stated below
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/anishbhateja/ckh1nlpe50vw319llz5u5w5t3',
    schrollZoom: false,
    //   center: [-118.113491, 34.111745], //long-lat
    //   zoom: 10,
    interactive: false,
  });

  //the are that will be displayed on the map
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Create marker
    const el = document.createElement('div');

    //Add marker
    el.className = 'marker';
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
