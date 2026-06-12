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
}