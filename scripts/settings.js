// HACK: use jQuery instead of uiElements
var uiElements = {
  status: []
};

class Settings {
  constructor() {
    this.valid = {
      accuracy: [2, 3, 4, 8, 10],
      markings: ['grid', 'highschool', 'college', 'pro'],
      theme: ['bw', 'color'],
      audio: ['met', 'none']
    }
    this.defaults = {
      accuracy: [2, 3, 4],
      markings: ['grid', 'college'],
      theme: 'bw',
      audio: 'met'
    };
    this.callbacks = {};


    // Test for local storage support
    ['sessionStorage', 'localStorage'].forEach(type => {
      try {
        let storage = window[type];
        let x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        this[`${type}Available`] = true;
      } catch (e) {
        this[`${type}Available`] = e instanceof DOMException && (
          // everything except Firefox
          e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === 'QuotaExceededError' ||
          // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
          // acknowledge QuotaExceededError only if there's something already stored
          storage.length !== 0;
      }
    });

    // Load all default values
    for (let key in this.defaults) {
      if (!this.localStorageAvailable || !(`settings-${key}` in localStorage)) {
        this.set(key, this.defaults[key]);
      }
    }

    // Hook up settings storage to page inputs
    for (let key in this.valid) {
      let curr = this.get(key);

      this.valid[key].forEach(val => {
        // Check if this is a multi-option setting
        let multi = Array.isArray(this.defaults[key]);
        let id = `#${multi ? 'checkbox' : 'radio'}-${key}-${val}`;

        // Make the page input active state reflect the current setting
        if (curr === val || curr.includes(val)) {
          $(id).addClass('active');
        }

        // Attach event listeners to the page inputs
        if (multi) {
          $(id).click(e => this.toggle(key, val, !e.currentTarget.classList.contains('active')));
        } else {
          $(id).click(e => this.set(key, val));
        }
      });
    }


    // Hide the navbar and load modal when they lose focus
    $('a[data-toggle="tab"]').click(e => $('#navbarNav').collapse('hide'));
    $('#load-button').click(e => $('#navbarNav').collapse('hide'));

    // Set up status bar framework
    uiElements.status = Array.from($('.status-element'));
    $('.status-element').click(e => panes[panes.active].eventHandler(e));

    // Register the keydown event handlers for each pane
    $(document).keydown(e => panes[panes.active].eventHandler(e));

    // Add button click handlers
    for (let button of ['prev', 'playpause', 'next']) {
      $(`#button-${button}`).click(e => panes[panes.active].eventHandler(e));
    }

    // Test for fullscreen support
    if (screenfull.enabled) {
      // $('#button-fullscreen').removeClass('d-none');
      $('#button-fullscreen').click(() => screenfull.toggle());
      screenfull.on('change', () => $('#button-fullscreen').children().toggleClass('zmdi-fullscreen', !screenfull.isFullscreen).toggleClass('zmdi-fullscreen-exit', screenfull.isFullscreen));
    }
  }

  load() {
    for (let type of data.performers) {
      $('#select-performer-type').append(`<option value=${type.symbol}>${type.name}</option>`);
      if (type.squads) {
        for (let squad of type.squads) {
          $('#select-performer-squad').append(`<option value="${squad}" class="d-none">${squad}</option>`);
        }
      }
    }
  }

  // Get the value of the given setting
  get(key) {
    return this.localStorageAvailable ? JSON.parse(localStorage.getItem(`settings-${key}`)) : this.settings[key];
  }

  // Set the value of the given setting
  set(key, val) {
    if (this.isValid(key, val)) {
      let old = this.get(key);

      if (this.localStorageAvailable) {
        localStorage.setItem(`settings-${key}`, JSON.stringify(val));
      } else {
        this.settings[key] = val;
      }

      if (this.callbacks[key]) {
        this.callbacks[key].forEach(func => func(old, val));
      }
    }
  }

  // Toggle the given value of the given setting (for multi-settings only)
  toggle(key, val, set) {
    if (Array.isArray(this.defaults[key])) {
      let curr = this.get(key);
      this.set(key, this.valid[key].filter(v => (v === val && set) || (v !== val && curr.includes(v))));
    }
  }

  // Check if the given value is valid for the given setting
  isValid(key, val) {
    let valid = true;
    (Array.isArray(val) ? val : [val]).forEach(v => valid &= this.valid[key].includes(v));

    return valid;
  }

  // Execute the given function once for each valid value of the given setting
  forEach(key, func) {
    let val = this.get(key);
    this.valid[key].forEach(curr => func(curr, val));
  }

  // Register the given change callback for the given setting
  // Optionally execute the callback once right now (if callNow = true)
  onChange(key, func, callNow) {
    if (this.callbacks[key]) {
      this.callbacks[key].push(func);
    } else {
      this.callbacks[key] = [func];
    }

    if (callNow) {
      let val = this.get(key);
      func(val, val);
    }
  }

  updateUI() {
    if (this.active) {
      for (let i = 0; i < uiElements.status.length; i++) {
        for (let j = 0; j < uiElements.status[i].children.length; j++) {
          uiElements.status[i].children[j].textContent = '';
        }
      }
    }
  }

  eventHandler(e) {}
}
