const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const selectedDatesList = document.getElementById("selectedDates");
const confirmBtn = document.getElementById("confirmBtn");

let currentDate = new Date();
currentDate.setDate(1);
let selectedDates = [];
let selectedStartTime = null;
let selectedEndTime = null;

const unavailableDays = [1, 11, 12, 13, 17, 25, 26, 29];

const monthNames = [
  "Jaanuar", "Veebruar", "Märts", "Aprill", "Mai", "Juuni",
  "Juuli", "August", "September", "Oktoober", "November", "Detsember"
];

const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function renderCalendar() {
  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthTitle.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startOffset = firstDay.getDay() - 1;
  if (startOffset === -1) startOffset = 6;

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  for (let i = startOffset - 1; i >= 0; i--) {
    createDay(prevMonthLastDay - i, true);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    createDay(day, false);
  }

  while (calendarGrid.children.length % 7 !== 0) {
    createDay(calendarGrid.children.length, true);
  }
}

function isPastDate(day) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calendarDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    day
  );

  return calendarDate < today;
}

function createDay(day, otherMonth) {
  const dayEl = document.createElement("div");
  dayEl.className = "calendar-day";
  dayEl.innerHTML = `<span>${day}</span>`;

  if (otherMonth) {
    dayEl.classList.add("other-month");
    calendarGrid.appendChild(dayEl);
    return;
  }

  if (isPastDate(day) || unavailableDays.includes(day)) {
    dayEl.classList.add("unavailable");
    dayEl.innerHTML += `<small>Pole saadaval</small>`;
    calendarGrid.appendChild(dayEl);
    return;
  }

  const dateKey = getDateKey(day);

  if (selectedDates.includes(dateKey)) {
    dayEl.classList.add("selected");
  }

  dayEl.addEventListener("click", () => {
    if (selectedDates.includes(dateKey)) {
      selectedDates = selectedDates.filter(date => date !== dateKey);
    } else {
      selectedDates.push(dateKey);
    }

    renderCalendar();
    renderSelectedDates();
    updateConfirmButton();
  });

  calendarGrid.appendChild(dayEl);
}

function getDateKey(day) {
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function renderSelectedDates() {
  selectedDatesList.innerHTML = "";

  selectedDates.forEach(date => {
    const li = document.createElement("li");
    li.textContent = date;
    selectedDatesList.appendChild(li);
  });
}

function renderTimeButtons(containerId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  times.forEach(time => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = time;

    button.addEventListener("click", () => {
      if (type === "start") selectedStartTime = time;
      if (type === "end") selectedEndTime = time;

      [...container.children].forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      updateConfirmButton();
    });

    container.appendChild(button);
  });
}

function updateConfirmButton() {
  const locationSelected = document.getElementById("locationSelect").value !== "";

  confirmBtn.disabled = !(
    selectedDates.length > 0 &&
    selectedStartTime &&
    selectedEndTime &&
    locationSelected
  );
}

document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  selectedDates = [];
  renderCalendar();
  renderSelectedDates();
  updateConfirmButton();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  selectedDates = [];
  renderCalendar();
  renderSelectedDates();
  updateConfirmButton();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  selectedDates = [];
  selectedStartTime = null;
  selectedEndTime = null;
  renderCalendar();
  renderSelectedDates();
  updateConfirmButton();
});

document.getElementById("locationSelect").addEventListener("change", updateConfirmButton);

confirmBtn.addEventListener("click", () => {
  const data = {
    location_id: document.getElementById("locationSelect").value,
    dates: selectedDates,
    start_time: selectedStartTime,
    end_time: selectedEndTime
  };

  console.log("Saadetav tööaeg:", data);
  alert("Tööaeg valitud! Vaata console'i.");
});

renderCalendar();
renderTimeButtons("startTimes", "start");
renderTimeButtons("endTimes", "end");