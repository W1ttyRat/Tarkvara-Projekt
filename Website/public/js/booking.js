const citySelect = document.getElementById("location");
const locationSelect = document.getElementById("location_id");
const serviceSelect = document.getElementById("service_id");
const startTimeInput = document.getElementById("start_time");
const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const timeButtonsWrap = document.getElementById("timeButtons");
const selectedDateTimeLabel = document.getElementById("selectedDateTime");

const monthNames = [
  "Jaanuar", "Veebruar", "Marts", "Aprill", "Mai", "Juuni",
  "Juuli", "August", "September", "Oktoober", "November", "Detsember"
];

const availableTimes = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

let currentMonth = new Date();
currentMonth.setDate(1);
let selectedDateKey = "";
let selectedTime = "";

if (!citySelect || !locationSelect) {
  console.warn('booking.js: required select elements not found');
} else {
  // ensure window.locations is always an array
  window.locations = Array.isArray(window.locations) ? window.locations : [];

  citySelect.addEventListener("change", () => {
    const selectedCity = citySelect.value;
    locationSelect.innerHTML = "";

    if (!selectedCity) {
      locationSelect.disabled = true;
      locationSelect.innerHTML = `<option value="">Vali esmalt linn</option>`;
      return;
    }

    const matchingLocations = window.locations.filter(location => location.city === selectedCity);

    locationSelect.disabled = false;
    locationSelect.innerHTML = `<option value="">Vali ülevaatuspunkt</option>`;

    matchingLocations.forEach(location => {
      const option = document.createElement("option");
      option.value = location.id;
      option.textContent = location.address;
      locationSelect.appendChild(option);
    });
  });

  // check fit when a location is selected
  const fitMsgEl = document.getElementById('fit-msg');
  const availabilityMsgEl = document.getElementById('availability-msg');
  const bookBtn = document.getElementById('book-btn');
  let fitOk = false;
  let availabilityOk = false;

  function updateBookButtonState() {
    if (!bookBtn) return;
    bookBtn.disabled = !(fitOk && availabilityOk);
  }

  function getCsrfHeaders() {
    const csrfEl = document.querySelector('input[name="_csrf"]');
    const csrfToken = csrfEl ? csrfEl.value : null;
    const headers = { 'Content-Type': 'application/json' };
    if (csrfToken) headers['x-csrf-token'] = csrfToken;
    return headers;
  }

  function getRegistrationNumber() {
    const el = document.getElementById('registration_number');
    return el ? el.value.trim() : '';
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function getTodayDateOnly() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function getDateKey(year, monthIndex, day) {
    return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
  }

  function syncStartTimeInput() {
    if (!startTimeInput) {
      return;
    }

    if (selectedDateKey && selectedTime) {
      startTimeInput.value = `${selectedDateKey}T${selectedTime}`;
      if (selectedDateTimeLabel) {
        selectedDateTimeLabel.textContent = `Valitud aeg: ${selectedDateKey} ${selectedTime}`;
      }
    } else {
      startTimeInput.value = "";
      if (selectedDateTimeLabel) {
        selectedDateTimeLabel.textContent = "Valik puudub";
      }
    }
  }

  function renderTimeButtons() {
    if (!timeButtonsWrap) {
      return;
    }

    timeButtonsWrap.innerHTML = "";

    availableTimes.forEach((time) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = time;

      if (time === selectedTime) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {
        selectedTime = time;
        renderTimeButtons();
        syncStartTimeInput();
        checkAvailability();
      });

      timeButtonsWrap.appendChild(button);
    });
  }

  function renderCalendar() {
    if (!calendarGrid || !monthTitle) {
      return;
    }

    calendarGrid.innerHTML = "";

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    monthTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) {
      startOffset = 6;
    }

    const prevMonthLastDate = new Date(year, month, 0).getDate();

    for (let i = startOffset - 1; i >= 0; i -= 1) {
      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = 'calendar-day other-month';
      dayEl.textContent = String(prevMonthLastDate - i);
      dayEl.disabled = true;
      calendarGrid.appendChild(dayEl);
    }

    const today = getTodayDateOnly();

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = 'calendar-day';
      dayEl.textContent = String(day);

      const dateKey = getDateKey(year, month, day);
      const thisDate = new Date(year, month, day);
      const isPast = thisDate < today;

      if (isPast) {
        dayEl.classList.add('past-day');
        dayEl.disabled = true;
      } else {
        dayEl.addEventListener('click', () => {
          selectedDateKey = dateKey;
          renderCalendar();
          syncStartTimeInput();
          checkAvailability();
        });
      }

      if (dateKey === selectedDateKey) {
        dayEl.classList.add('selected');
      }

      calendarGrid.appendChild(dayEl);
    }

    while (calendarGrid.children.length % 7 !== 0) {
      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = 'calendar-day other-month';
      dayEl.textContent = "";
      dayEl.disabled = true;
      calendarGrid.appendChild(dayEl);
    }
  }

  function showFitMessage(text, isError) {
    if (!fitMsgEl) return;
    fitMsgEl.textContent = text || '';
    fitMsgEl.style.color = isError ? '#b00020' : '#0b6623';
    fitOk = !!text && !isError;
    updateBookButtonState();
  }

  function showAvailabilityMessage(text, isError, isNeutral = false) {
    if (!availabilityMsgEl) return;
    availabilityMsgEl.textContent = text || '';

    if (isNeutral) {
      availabilityMsgEl.style.color = '#666666';
      availabilityOk = false;
    } else {
      availabilityMsgEl.style.color = isError ? '#b00020' : '#0b6623';
      availabilityOk = !!text && !isError;
    }

    updateBookButtonState();
  }

  async function checkFit(locationId) {
    const registration_number = getRegistrationNumber();
    if (!registration_number) {
      showFitMessage('Sisesta registreerimisnumber, et kontrollida mahutavust.', true);
      return;
    }

    try {
      // include CSRF token from the form hidden input if present
      const csrfEl = document.querySelector('input[name="_csrf"]');
      const csrfToken = csrfEl ? csrfEl.value : null;
      const headers = { 'Content-Type': 'application/json' };
      if (csrfToken) headers['x-csrf-token'] = csrfToken;

      const res = await fetch('/api/check-fit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ registration_number, locationId }),
        credentials: 'same-origin'
      });
      const data = await res.json();
      if (!res.ok) {
        showFitMessage(data.message || 'Viga kontrollimisel', true);
        return;
      }
      if (data.fits) {
        showFitMessage('Auto mahub asukohta.', false);
      } else {
        showFitMessage(data.message || 'Auto ei mahu sellesse asukohta.', true);
      }
    } catch (err) {
      console.error('checkFit fetch error', err);
      showFitMessage('Võrguviga kontrollimisel', true);
    }
  }

  async function checkAvailability() {
    const locationId = parseInt(locationSelect.value, 10);
    const serviceId = parseInt(serviceSelect && serviceSelect.value, 10);
    const start_time = startTimeInput && typeof startTimeInput.value === 'string'
      ? startTimeInput.value.trim()
      : '';

    if (!locationId || !serviceId || !start_time) {
      showAvailabilityMessage('', false, true);
      return;
    }

    try {
      const res = await fetch('/api/check-availability', {
        method: 'POST',
        headers: getCsrfHeaders(),
        body: JSON.stringify({ locationId, serviceId, start_time }),
        credentials: 'same-origin'
      });
      const data = await res.json();

      if (!res.ok) {
        showAvailabilityMessage(data.message || 'Viga saadavuse kontrollimisel.', true);
        return;
      }

      if (data.available) {
        showAvailabilityMessage('Valitud aeg on saadaval.', false);
      } else {
        showAvailabilityMessage(data.message || 'Valitud aeg ei ole saadaval.', true);
      }
    } catch (err) {
      console.error('availability check error', err);
      showAvailabilityMessage('Võrguviga saadavuse kontrollimisel.', true);
    }
  }

  locationSelect.addEventListener('change', (e) => {
    const id = parseInt(e.target.value, 10);
    if (!id) {
      showFitMessage('', false);
      showAvailabilityMessage('', false, true);
      return;
    }

    checkFit(id);
    checkAvailability();
  });

  if (serviceSelect) {
    serviceSelect.addEventListener('change', () => {
      checkAvailability();
    });
  }

  if (startTimeInput) {
    startTimeInput.addEventListener('change', checkAvailability);
  }

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      renderCalendar();
    });
  }

  const registrationInput = document.getElementById('registration_number');
  if (registrationInput) {
    registrationInput.addEventListener('change', () => {
      const id = parseInt(locationSelect.value, 10);
      if (!id) {
        showFitMessage('', false);
        return;
      }

      checkFit(id);
    });
  }

  // final validation on form submit
  const bookingForm = document.querySelector('.booking-form');
  if (bookingForm) {
    const onBookingSubmit = async (e) => {
      const locationId = parseInt(locationSelect.value, 10);
      const serviceId = parseInt(serviceSelect && serviceSelect.value, 10);
      const registration_number = getRegistrationNumber();
      const start_time = startTimeInput && typeof startTimeInput.value === 'string'
        ? startTimeInput.value.trim()
        : '';

      if (!start_time) {
        e.preventDefault();
        showAvailabilityMessage('Vali kalendrist kuupaev ja kellaaeg.', true);
        return;
      }

      // Re-check both fit and staffed availability before allowing submission.
      if (locationId && serviceId && registration_number && start_time) {
        e.preventDefault();

        try {
          const res = await fetch('/api/check-fit', {
            method: 'POST',
            headers: getCsrfHeaders(),
            body: JSON.stringify({ registration_number, locationId }),
            credentials: 'same-origin'
          });
          const data = await res.json();
          if (!data.fits) {
            showFitMessage('Ei saa broneerida: ' + (data.message || 'Auto ei mahu'), true);
            return;
          }

          showFitMessage('Auto mahub asukohta.', false);

          const availabilityRes = await fetch('/api/check-availability', {
            method: 'POST',
            headers: getCsrfHeaders(),
            body: JSON.stringify({ locationId, serviceId, start_time }),
            credentials: 'same-origin'
          });
          const availabilityData = await availabilityRes.json();

          if (!availabilityData.available) {
            showAvailabilityMessage(
              'Ei saa broneerida: ' + (availabilityData.message || 'Aeg ei ole saadaval'),
              true
            );
            return;
          }

          showAvailabilityMessage('Valitud aeg on saadaval.', false);

          bookingForm.removeEventListener('submit', onBookingSubmit);
          bookingForm.submit();
        } catch (err) {
          console.error('submit fit check error', err);
          showFitMessage('Võrguviga: ' + (err && err.message ? err.message : 'Kontroll ebaõnnestus'), true);
          showAvailabilityMessage('Võrguviga saadavuse kontrollimisel.', true);
        }
      }
    };

    bookingForm.addEventListener('submit', onBookingSubmit);
  }

  renderCalendar();
  renderTimeButtons();
  syncStartTimeInput();
  updateBookButtonState();
}