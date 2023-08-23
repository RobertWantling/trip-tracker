'use strict';

// Implement parent class for all workout types
class Workout {
  // date for new workout
  date = new Date();
  // Object should have unique identifier so later access using that ID
  //id = (Date.now() + '').slice(-10); // not pracitcal for real world - as might have numerous users on creating obj at same time so wont work as unique ID
  id = uuid.v4(); // random id from cdn library
  clicks = 0;

  constructor(mapWorkoutObj, coords, distance, duration, grade, city, country) {
    this.coords = coords; // equal to coordinates get as an input etc. [lat, lng]
    this.distance = distance; // in miles
    this.duration = duration; // in mins
    this.grade = grade; // v
    this.city = city;
    this.country = country;
    this.mapWorkoutObj = mapWorkoutObj; // obj of icon on map
  }

  // SET DESCRIPTION /////////////////////////////////////////////////////////////////////

  _setDescription() {
    // prettier-ignore
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

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// months[this.date.getMonth()]
// ${this.date.getDay()}`;
// Shows can interact with each of the objects using PI
// click() {
// this.clicks++;
// }

// child classes
class Running extends Workout {
  type = 'running';

  constructor(mapWorkoutObj, coords, distance, duration, cadence) {
    // takes same data as parent class + props (cadence)
    super(mapWorkoutObj, coords, distance, duration);
    this.cadence = cadence;
    this.calcPace(); // bien call any code in constructor
    this._setDescription(); // work due to scope train, the instructor will have access to all methods of the parent class (setDescription)
  }
  // calculate pace
  calcPace() {
    // min/miles
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  // defining field - will now be available on all instances - same as this.type = 'cycling
  type = 'cycling';
  constructor(mapWorkoutObj, coords, distance, duration, elevationGain) {
    super(mapWorkoutObj, coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  // calculate speed
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class Hiking extends Workout {
  type = 'hiking';
  constructor(mapWorkoutObj, coords, distance, duration, elevationGain) {
    super(mapWorkoutObj, coords, distance, duration);
    this.elevationGain = elevationGain;
    this._setDescription();
  }
}

class Walking extends Workout {
  type = 'walking';
  constructor(mapWorkoutObj, coords, distance, duration, cadence) {
    super(mapWorkoutObj, coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  // calculate pace
  calcPace() {
    // min/miles
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Climbing extends Workout {
  type = 'climbing';
  constructor(mapWorkoutObj, coords, distance, duration, grade) {
    super(mapWorkoutObj, coords, distance, duration);
    this.grade = grade;
    this._setDescription();
  }
}

// test
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// const walking1 = new Walking([39, -12], 10, 30, 123);
// console.log(run1, cycling1, walking1);

class ComplexDrawing {
  constructor(center) {
    this._center = center;
  }
  set _center(center) {
    const { latlng } = center;
    this.center = [latlng];
  }
  get _center() {
    return this.center;
  }
}

class DrawLine extends ComplexDrawing {
  name = 'DrawLine';
  constructor(latlng, color, center) {
    super(center);
    this.latlng = latlng.flat(); // [lat, lng, lat, lng]
    this.color = color; // color code
  }
}

class DrawMarker {
  name = 'DrawMarker';
  constructor(latlng) {
    this.latlng = latlng; // [lat, lng]
    this._setCenter();
  }
  _setCenter() {
    this.center = this.latlng;
  }
}

////////////////////////////////////////////////////////////////////////////
// solve scope by creating global varibale and then reassign it later
// let map, mapEvent;

// APPLICATION ARCHITECTURE
// Variable input types
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const inputGrade = document.querySelector('.form__input--grade');

// Edit workout form
const formEdit = document.querySelector('.form-editing');

// Edit-workout form
// const formEdit =

class App {
  // private instance properties (want everything in the APP class - so define the map and mapevent as properties of the app object - use private class field with hash)
  #map;
  #mapEvent; // now properties that are gonna be present on all instances created through this class
  #workouts = [];
  #userCoords = [];
  #mapZoomLevel = 13;
  #workoutMarkers = [];

  ////////////////////////////////////////////////////////////////////////////

  // auto calls soon as page loads
  constructor() {
    // Get user's position ////////////////////////////////////////////////////////////////////////
    this._getPosition();

    // Get data from local storage ////////////////////////////////////////////////////////////////////////
    //this._getLocalStorage();

    // ATTACH EVENT HANDLERS ////////////////////////////////////////////////////////////////////////
    // submit workout form
    form.addEventListener('submit', this._newWorkout.bind(this)); // method here basically an event handler a function that is going to be called by event listener ^
    // 'this' keyword on newWorkout will have the DOM el from 'form' el - meaning 'this' keyword will point to form and not App object - fix it by using 'bind()'

    // listen to input of 'type' to allow change to input fields
    inputType.addEventListener('change', this._toggleElevationField);

    // When have el that want to attach to event listener but hasnt been created yet - will use event delegation - add to constructor so its added right at the beginning
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  // GET POSITION ////////////////////////////////////////////////////////////////////

  _getPosition() {
    // geolocation api
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // this is treated as a regular function call not a method call - not calling it - calls as regaulr function call so 'this' is set to underfined - manually bind 'this' to loadMap
        function () {
          // first callback function need to call loadmap now as in a class can use 'this' - call this callback function here and pass in position argument as soon as current position of user is determined
          alert(
            'Could not get your current position. Please check your connection.'
          );
        }
      );
    else alert('Your Browser does not support geolocation');
  }

  // LOAD MAP ////////////////////////////////////////////////////////////////////////

  // this LOADMAP method is called by getCurrentPos function
  _loadMap(position) {
    const { latitude: lat, longitude: lng } = position.coords;
    console.log(`https://www.google.com/maps/@${lat},${lng},14z?entry=ttu`);
    const coords = [lat, lng];
    // whatever string passed into 'map' function must be ID name of element in HTML - it is in  that element where the map is displayed
    // Creating the leaflet map
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    // customised leaflet map
    // L.tileLayer(
    // 'https://{s}.tile.openstreetmap.tiles/outdoors/{z}/{x}/{y}.png',
    // 'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png',
    // {
    // maxZoom: 20,
    // attribution:
    // '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    // // // '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://  openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>    contributors',
    // }
    // ).addTo(map);
    // google maps
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(this.#map);
    // 'map' is an object generated by Leaflet - special object with method n properties on it

    // Marker for current location render marker and popup
    const myIcon = L.icon({
      iconUrl: 'marker.png',
      iconSize: [30, 30],
      iconAnchor: [8, 8],
      className: 'marker',
    });

    const marker = L.marker([lat, lng], { icon: myIcon }).addTo(this.#map);
    marker
      .bindPopup(
        L.popup({
          minWidth: 220,
          autoClose: false,
          className: 'inital--popup',
        }).setContent(
          `This is your <strong>current position</strong>.<br> Click on the map to add a workout.`
        )
      )
      .openPopup();

    // Init edit layers on map
    const drawnItems = new L.FeatureGroup();
    this.#map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: false,
        polyline: true,
        circle: false,
        marker: true,
      },
      edit: {
        featureGroup: drawnItems,
        edit: false,
        remove: false,
      },
    });
    this.#map.addControl(drawControl);

    this.#map.on('click', this._renderPopup.bind(this));

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
    // 'this' keyword points to map b that is where the event handler points to - so need to use bind again to override the location to the APP object

    // Handling maps drawing
    this.#map.on('draw:created', this._showForm.bind(this));

    // Loading workouts lists and markers from local storage - use leaflets method 'whenReady' call getLocal only when map is loaded
    this.#map.whenReady(this._getLocalStorage.bind(this));

    // Render markers from local storage (map available here due to ASYNC)
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  // MapE is an object generated by leaflets when we click on the map. It contains a lot of information that we need (including the coordinates of the click on the map)

  // RENDER POPUP ///////////////////////////////////////////////////////////////////////
  _renderPopup(mapE) {
    // if (
    // formEdit.classList.contains('active') ||
    // !deleteContainer.classList.contains('delete-confirmation--hidden')
    // )
    // return;

    this.#mapEvent = mapE;

    const { lat, lng } = mapE.latlng;

    const popup = L.popup()
      .setLatLng([lat, lng])
      .setContent('Add a workout here.')
      .openOn(this.#map);
  }

  // SHOW FORM ///////////////////////////////////////////////////////////////////////

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // HIDE FORM ///////////////////////////////////////////////////////////////////////

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
      inputGrade.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _highlightWorkout() {}

  _iconSelect(workout) {
    if (workout.type === 'running') {
      return '🏃🏻‍♂️';
    } else if (workout.type === 'cycling') {
      return '🚴🏻‍♂️';
    }
  }

  // TOGGLE INPUT FIELDS //////////////////////////////////////////////////////////////////////////

  _toggleElevationField(e) {
    if (e.target.value === 'running') {
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputGrade.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
    }
    if (e.target.value === 'cycling') {
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputGrade.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
    }
    if (e.target.value === 'hiking') {
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputGrade.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
    }
    if (e.target.value === 'walking') {
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputGrade.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
    }
    if (e.target.value === 'climbing') {
      inputGrade.closest('.form__row').classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
    }
  }

  // DEAL MAP PROPERTIES /////////////////////////////////////////////////////////////////////
  // (need to return formatted obj)
  _mapEventProps() {
    if (this.#mapEvent.type === 'polyline') {
      const latlngsArr = this.#mapEvent.layer.getLatLngs();
      const color = this.#mapEvent.layer.options.color;
      const center = this.#mapEvent.layer.getBounds().getCenter();
      return new DrawLine(latlngsArr, color, center);
    }
    if (this.#mapEvent.type === 'click') {
      const { lat, lng } = this.#mapEvent.latlng;
      return new DrawMarker([lat, lng]);
    }
    if (this.#mapEvent.type === 'draw:created') {
      if (this.#mapEvent.layerType === 'marker') {
        const { lat, lng } = this.#mapEvent.layer._latlng;
        return new DrawMarker([lat, lng]);
      }
    }
  }

  // NEW WORKOUT /////////////////////////////////////////////////////////////////////

  _newWorkout(e) {
    // helper functions
    // when use rest param get an array - so can loop over
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input)); // loop over check if number is finite or not - only return true if all el are true ^
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value; // '+' Unary Operator turn to num
    const duration = +inputDuration.value;
    const grade = +inputGrade.value;
    // const { lat, lng } = this.#mapEvent.latlng;
    const workoutMapProps = this._mapEventProps();
    let workout;

    // Check if data is valid

    // Delete workouts
    // It s a bit tricky but easy in the end, first I add a delete button on each workout I render, then I add a addEventListener on he, e.target(delete button).parentNode.remove()  (e being the function argument on addEventListener) practically when I press delete button, javascript select that workout which is the button and then remove it.  To delete marker from map I initialize a variable layer on each coords after submit the form, then I remove it in exact same place where delete workouts. A nice explanation for parentNode you can find on w3schools. I don't really know how to explain things, but I hope you understand! :)

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid - use guard clause - check for opposite if true return function
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!'); // if distance is NAN return asap

      workout = new Running(workoutMapProps, distance, duration, cadence); // redefine workout so able to access out of scope
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling(workoutMapProps, distance, duration, elevation);
    }

    // If workout hiking, create hiking object
    if (type === 'hiking') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration, elevation)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Hiking(workoutMapProps, distance, duration, elevation);
    }

    // If workout walking, create walking object
    if (type === 'walking') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Walking(workoutMapProps, distance, duration, cadence);
    }

    // If workout climbing, create climbing object
    if (type === 'climbing') {
      const grade = +inputGrade.value;
      if (
        !validInputs(distance, duration, grade) ||
        !allPositive(distance, duration, grade)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Climbing(workoutMapProps, distance, duration, grade);
    }

    ////////////////// Good habit to export functionality into thier own methods or own functions

    // Add/push new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout); // pass in workout data to display on map | not a callback function of any other function so no to use 'bind' method

    // Render workout on list
    this._renderWorkout(workout); // delegated the functionality to the method below

    // Hide form  clear input fields
    this._hideForm();

    // Set local sotrage to all workouts
    this._setLocalStorage();

    this._highlightWorkout();

    this._iconSelect(workout);
  }

  // RENDER WORKOUT MARKER /////////////////////////////////////////////////////////////////////

  _renderWorkoutMarker(workout) {
    let mapIcon;

    if (workout.mapWorkoutObj) {
      if (workout.mapWorkoutObj.name == 'DrawMarker') {
        mapIcon = L.marker(workout.mapWorkoutObj.latlng);
      }
      if (workout.mapWorkoutObj.name == 'DrawLine') {
        mapIcon = L.polyline(workout.mapWorkoutObj.latlng, {
          color: workout.mapWorkoutObj.color,
        });
      }
    }
    const myIcon = L.icon({
      iconUrl: 'marker.png',
      iconSize: [30, 30],
      iconAnchor: [10, 10],
    });
    // adds marker to the map
    // important have data in actual workout object needed to tell leaflet where to display the marker
    const marker = L.marker(workout.coords, { icon: myIcon }).addTo(this.#map); // trying access map when not in scope
    const popup = L.popup({
      // leaflet api reference
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
      draggable: true,
      // all methods for leaflet marker are chainable with 'this'
    }).setPopupContent(
      `${workout.type === 'running' ? '🏃‍♀️' : '🚴‍♂️'} ${workout.description}`
    );
    // {
    // this._iconSelect
    // if (workout.type === 'running') {
    // `${"🏃‍♂️"} ${workout.description}`;
    // } else if (workout.type === 'cycling') {
    // `${"🚴‍♀️"} ${workout.description}`;
    // } else if (workout.type === 'hiking') {
    // `${"🏞"} ${workout.description}`;
    // } else if (workout.type === 'walking') {
    // `${"🚶🏻‍♂️"} ${workout.description}`;
    // } else {
    // `${"🧗🏻‍♂️"} ${workout.description}`;
    // }

    marker.bindPopup(popup).openPopup();

    if (newMarker) this.#workoutMarkers.push(marker);

    if (editMarker) {
      const markerIndex = this.#workoutMarkers.findIndex(marker => {
        return (
          marker._latlng.lat === workout.coords[0] &&
          marker._latlng.lng === workout.coords[1]
        );
      });

      // Deleting the old marker from UI (From map)
      this.#map.removeLayer(this.#workoutMarkers[markerIndex]);

      // Replacing the old marker witht he new one in the workoutMarkers array
      this.#workoutMarkers.splice(markerIndex, 1, marker);
      console.log(this.#workoutMarkers);
    }
  }
  // .on('click', function (eClick) {
  // const selectReqId = workout.id;
  // const formWrkOut = document.querySelector(`[data-id="${selectReqId}"]`);
  // formWrkOut.style.backgroundColor = '#ececec';
  // setTimeout(function () {
  // formWrkOut.style.backgroundColor = '#c3c1c1';
  // }, 500);
  // });

  // RENDER WORKOUT /////////////////////////////////////////////////////////////////////

  _renderWorkout(workout, adding = true, editing = false) {
    // create markup HTML that can insert into the DOM wherever there is a new workout
    // data-id - used as custom data attribute, use data properties like this to build a bridge between UI and data that have on application
    let html = ` 

   <li class="workout workout--${workout.type}" data-id="${workout.id}">
   <h4 class="workout__location">
    <svg class="workout__location-icon">
        <img src="svg-icons/location-pin.png"></img>
    </svg>
   </h4>
   <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__menu">
      <svg class="workout__menu-trigger workout__menu-icons">
        <img src="svg-icons/navigation-more.svg" width="30px" height="30px"></img>
      </svg>
    <ul class="workout__menu-options workout__menu-options--hidden">
          <li>
            <a
              class="workout__menu-options workout__menu-option--edit"
              href="#"
            >
              <svg class="workout__menu-icons">
                <img src="svg-icons/sprite.svg"></img>
              </svg>
              Edit Workout
            </a>
          </li>
          <li>
            <a
              class="workout__menu-options workout__menu-option--delete"
              href="#"
            >
              <svg class="workout__menu-icons">
                <img src="svg-icons/sprite.svg"></img>
              </svg>
              Delete Workout
            </a>
          </li>
        </ul>
    </div>
   `;

    if (workout.type === 'running')
      html += `
    <div class="workout__details">
      <span class="workout__icon">🏃‍♂️</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div> 
  <div class="workout__details"> 
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.pace.toFixed(1)}</span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">🦶🏼</span>
    <span class="workout__value">${workout.cadence}</span>
    <span class="workout__unit">spm</span>
  </div>
  </li>
      `;

    if (workout.type === 'cycling')
      html += `
  <div class="workout__details">
    <span class="workout__icon">🚴‍♀️</span>
    <span class="workout__value">27</span>
    <span class="workout__unit">km</span>
  </div>
  <div class="workout__details">
  <span class="workout__icon">⏱</span>
  <span class="workout__value">${workout.duration}</span>
  <span class="workout__unit">min</span>
</div>
  <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.elevationGain}</span>
    <span class="workout__unit">metres</span>
  </div>
  </li> `;
    if (workout.type === 'hiking')
      html += `
  <div class="workout__details">
    <span class="workout__icon">🏞</span>
    <span class="workout__value">27</span>
    <span class="workout__unit">km</span>
  </div>
  <div class="workout__details">
  <span class="workout__icon">⏱</span>
  <span class="workout__value">${workout.duration}</span>
  <span class="workout__unit">min</span>
</div>
  <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">16</span>
    <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">223</span>
    <span class="workout__unit">m</span>
  </div>
</li> `;
    if (workout.type === 'walking')
      html += `
     <div class="workout__details">
   <span class="workout__icon">🚶🏻‍♂️</span>
   <span class="workout__value">27</span>
   <span class="workout__unit">km</span>
 </div>
 <div class="workout__details">
   <span class="workout__icon">⏱</span>
   <span class="workout__value">${workout.duration}</span>
   <span class="workout__unit">min</span>
 </div>
 <div class="workout__details">
   <span class="workout__icon">⚡️</span>
   <span class="workout__value">${workout.pace.toFixed(1)}</span>
   <span class="workout__unit">km/h</span>
 </div>
 <div class="workout__details">
   <span class="workout__icon">🦶🏼</span>
   <span class="workout__value">${workout.cadence}</span>
   <span class="workout__unit">spm</span>
 </div>`;
    if (workout.type === 'climbing')
      html += `
    <div class="workout__details">
  <span class="workout__icon">🧗🏻‍♂️</span>
  <span class="workout__value">27</span>
  <span class="workout__unit">km</span>
</div>
<div class="workout__details">
  <span class="workout__icon">⏱</span>
  <span class="workout__value">${workout.duration}</span>
  <span class="workout__unit">min</span>
</div>
<div class="workout__details">
  <span class="workout__icon">⚡️</span>
  <span class="workout__value">16</span>
  <span class="workout__unit">km/h</span>
</div>
<div class="workout__details">
  <span class="workout__icon">📈</span>
  <span class="workout__value">v3</span>
  <span class="workout__unit">grade</span>
</div>`;

    // Insert form as a sibling element - This one will add the new element as a sibling el at end of the form
    form.insertAdjacentHTML('afterend', html);
  }

  // HANDLE CLICK /////////////////////////////////////////////////////////////////////
  _handleClick(e) {
    this._closeAllMenus();

    if (
      (!e.target.closest('.workout__menu') &&
        !e.target.cloest('.menu__option')) ||
      formEdit.classList.contains('active') ||
      !deleteContainer.classList.contains
    )
      'delete-confirmation--hidden';
  }

  // MOVE TO CLICKED WORKOUT /////////////////////////////////////////////////////////////////////

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout'); // 'closest' allows to move up chain to closest parent
    //console.log(workoutEl); // closest takes care of selecting the entire element, gain access to ID - This ID will be used to find the workout array - ables to build a bridge between UI and data in application
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // take coords from wokrout el and move map to that position - use leaflet method avail on all map objects - setview() sets view of map with given coords + animation options

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      // pass in an object of options
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // workout.click();
  }

  // doesnt need any parameters as get workouts from workout property
  // In practise only use local storage for small amounts of data (blocking issue)
  _setLocalStorage() {
    // local storage is api browser provides - 1st arg name 2nd arg a string want to store assos with 'workouts' key (key, value store)
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); // use JSON convert any object to a string
  }

  // Because converted object to string and back again it lost prototype chain - now just regualr objects without any previous methods wont inherit
  _getLocalStorage() {
    // Parse opposite of 'stringify' converts back to an object
    const data = JSON.parse(localStorage.getItem('workouts'));

    // when wokrouts array is empty
    if (!data) return;

    // if had some data in local storage, set that workout array to data had before
    this.#workouts = data;

    // Render in the list
    this.#workouts.forEach(workout => {
      this._renderWorkout(workout); // helpful have logic rendering a workout in side bar
      this._renderWorkoutMarker(workout);
    });
  }

  // Delete all workouts
  reset() {
    localStorage.removeItem('workouts');
    // 'location' big object contains lots of methods n props in browser has ability to reload page
    location.reload();
  }
}

////////////////////////////////////////////////////////////////////////////
// create object out of this ^^ class (app)
const app = new App();
// trigger geolocation API - method needs to be called
// app._getPosition();

/*
Architecture: Initial Approach 

1. Decide where and how want to store data (most fundamental part)
 'User Stories' - log running workouts with location, distance, time, pace and steps/minute (cadence)
 - log cycling workouts with location, distance, time, pace and elevation gain 
 - log hiking workouts with location, distance, time, pace and elevation gain 
 - log walking workouts with location, distance, time, pace and elevation gain 
 - log climbing workouts with location, distance, time, pace and grade 

 - Design classes so they can create objects that will hold all this ^^ data

 // click events needs to implement - create dif functions that will handle these events
 load page
 receive position 
 click on map 
 change input 
 submit form 
*/

///////////
// console.log('test');
// function splitAndMerge(string, separator) {
// let words = string.split(' ');
// let arr = [];
// let res = [];
// for (let i = 0; i < words.length; i++) {
// arr.push(words[i].split('').join(separator));
// }
// res = arr.join(' ');
// console.log(res);
// }

// splitAndMerge('My name is John', ' ');
// splitAndMerge('My name is John', '-');

let x = 0 / 0;
console.log(x);
