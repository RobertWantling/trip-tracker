// 'use strict';

// ignore for prettier
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// all handlers
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// solve scope by creating global varibale and then reassign it later
let map, mapEvent;

// geolocation api
if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      console.log(
        `https://www.google.com/maps/@${latitude},${longitude},14z?entry=ttu`
      );

      const coords = [latitude, longitude];
      // whatever string passed into 'map' function must be ID name of element in HTML - it is in that element where the map is displayed
      map = L.map('map').setView(coords, 13);

      L.tileLayer(
        // 'https://{s}.tile.openstreetmap.tiles/outdoors/{z}/{x}/{y}.png',
        'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 20,
          attribution:
            // '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        }
      ).addTo(map);

      // 'map' is an object generated by Leaflet - special object with method n properties on it
      // Handling clicks on map
      map.on('click', function (mapE) {
        mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
      });
    },
    function () {
      alert('could not get your position');
    }
  );

// submit workout form
form.addEventListener('submit', function (e) {
  e.preventDefault();

  // clear input fields
  inputDistance.value =
    inputDuration.value =
    inputCadence.value =
    inputElevation.value =
      '';

  // display marker
  // when a click happens want to show the form
  console.log(mapEvent);
  const { lat, lng } = mapEvent.latlng;

  // adds marker to the map
  L.marker([lat, lng])
    .addTo(map) // trying access map when not in scope
    .bindPopup(
      L.popup({
        // leaflet api reference
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: 'running-popup',
        // all methods for leaflet marker are chainable with 'this'
      })
    )
    .setPopupContent('Asecent Conquored')
    .openPopup();
});
