const citySelect = document.getElementById("location");
const locationSelect = document.getElementById("location_id");

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
  const bookBtn = document.getElementById('book-btn');

  function getRegistrationNumber() {
    const el = document.getElementById('registration_number');
    return el ? el.value.trim() : '';
  }

  function showFitMessage(text, isError) {
    if (!fitMsgEl) return;
    fitMsgEl.textContent = text || '';
    fitMsgEl.style.color = isError ? '#b00020' : '#0b6623';
    if (bookBtn) bookBtn.disabled = !!isError;
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

  locationSelect.addEventListener('change', (e) => {
    const id = parseInt(e.target.value, 10);
    if (!id) return showFitMessage('', false);
    checkFit(id);
  });

  // final validation on form submit
  const bookingForm = document.querySelector('.booking-form');
  if (bookingForm) {
    const onBookingSubmit = async (e) => {
      const locationId = parseInt(locationSelect.value, 10);
      const registration_number = getRegistrationNumber();

      // re-check fit before allowing submission
      if (locationId && registration_number) {
        e.preventDefault();
        try {
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
          if (!data.fits) {
            showFitMessage('Ei saa broneerida: ' + (data.message || 'Auto ei mahu'), true);
            return;
          }
          // fit is OK, allow submission
          bookingForm.removeEventListener('submit', onBookingSubmit);
          bookingForm.submit();
        } catch (err) {
          console.error('submit fit check error', err);
          showFitMessage('Võrguviga: ' + (err && err.message ? err.message : 'Kontroll ebaõnnestus'), true);
        }
      }
    };

    bookingForm.addEventListener('submit', onBookingSubmit);
  }
}