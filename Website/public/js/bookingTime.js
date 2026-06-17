const startTimeInput = document.getElementById("start_time");
const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const timeButtonsWrap = document.getElementById("timeButtons");
const selectedDateTimeLabel = document.getElementById("selectedDateTime");
const availabilityMsgEl = document.getElementById("availability-msg");

const draft = window.bookingDraft || {};

const monthNames = [
    "Jaanuar", "Veebruar", "Märts", "Aprill", "Mai", "Juuni",
    "Juuli", "August", "September", "Oktoober", "November", "Detsember"
];

const availableTimes = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00"
];

let currentMonth = new Date();
currentMonth.setDate(1);

let selectedDateKey = "";
let selectedTime = "";
let availabilityOk = false;

function pad2(value) {
    return String(value).padStart(2, "0");
}

function getTodayDateOnly() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getDateKey(year, monthIndex, day) {
    return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function getCsrfHeaders() {
    const csrfEl = document.querySelector('input[name="_csrf"]');
    const csrfToken = csrfEl ? csrfEl.value : null;

    const headers = {
        "Content-Type": "application/json"
    };

    if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
    }

    return headers;
}

function syncStartTimeInput() {
    if (selectedDateKey && selectedTime) {
        startTimeInput.value = `${selectedDateKey}T${selectedTime}`;
        selectedDateTimeLabel.textContent =
            `Valitud aeg: ${selectedDateKey} ${selectedTime}`;
    } else {
        startTimeInput.value = "";
        selectedDateTimeLabel.textContent = "Valik puudub";
    }
}

function showAvailabilityMessage(text, isError, isNeutral = false) {
    availabilityMsgEl.textContent = text || "";

    if (isNeutral) {
        availabilityMsgEl.style.color = "#666";
        availabilityOk = false;
    } else {
        availabilityMsgEl.style.color = isError ? "#b00020" : "#0b6623";
        availabilityOk = !!text && !isError;
    }
}

async function checkAvailability() {
    if (!selectedDateKey || !selectedTime) {
        showAvailabilityMessage("", false, true);
        return;
    }

    const start_time = `${selectedDateKey}T${selectedTime}`;

    try {
        const res = await fetch("/api/check-availability", {
            method: "POST",
            headers: getCsrfHeaders(),
            body: JSON.stringify({
                locationId: draft.location_id,
                serviceId: draft.service_id,
                start_time
            }),
            credentials: "same-origin"
        });

        const data = await res.json();

        if (!res.ok || !data.available) {
            showAvailabilityMessage(
                data.message || "Valitud aeg ei ole saadaval.",
                true
            );
            return;
        }

        showAvailabilityMessage("Valitud aeg on saadaval.", false);

    } catch (err) {
        console.error(err);
        showAvailabilityMessage("Võrguviga saadavuse kontrollimisel.", true);
    }
}

async function isTimeAvailable(time) {
    if (!selectedDateKey) {
        return false;
    }

    const start_time = `${selectedDateKey}T${time}`;

    try {
        const res = await fetch("/api/check-availability", {
            method: "POST",
            headers: getCsrfHeaders(),
            body: JSON.stringify({
                locationId: draft.location_id,
                serviceId: draft.service_id,
                start_time
            }),
            credentials: "same-origin"
        });

        const data = await res.json();

        return res.ok && data.available;
    } catch (err) {
        console.error(err);
        return false;
    }
}

async function renderTimeButtons() {
    timeButtonsWrap.innerHTML = "";

    if (!selectedDateKey) {
        availableTimes.forEach(time => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = time;
            button.disabled = true;
            button.classList.add("unavailable-time");
            timeButtonsWrap.appendChild(button);
        });

        return;
    }

    const availabilityResults = await Promise.all(
        availableTimes.map(async time => {
            const available = await isTimeAvailable(time);

            return {
                time,
                available
            };
        })
    );

    availabilityResults.forEach(({ time, available }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = time;

        if (!available) {
            button.disabled = true;
            button.classList.add("unavailable-time");
        }

        if (time === selectedTime) {
            button.classList.add("active");
        }

        button.addEventListener("click", () => {
            if (!available) return;

            selectedTime = time;
            renderTimeButtons();
            syncStartTimeInput();
            checkAvailability();
        });

        timeButtonsWrap.appendChild(button);
    });
}

function renderCalendar() {
    calendarGrid.innerHTML = "";

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    monthTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    const prevMonthLastDate = new Date(year, month, 0).getDate();

    for (let i = startOffset - 1; i >= 0; i -= 1) {
        const dayEl = document.createElement("button");
        dayEl.type = "button";
        dayEl.className = "calendar-day other-month";
        dayEl.textContent = String(prevMonthLastDate - i);
        dayEl.disabled = true;
        calendarGrid.appendChild(dayEl);
    }

    const today = getTodayDateOnly();

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
        const dayEl = document.createElement("button");
        dayEl.type = "button";
        dayEl.className = "calendar-day";
        dayEl.textContent = String(day);

        const dateKey = getDateKey(year, month, day);
        const thisDate = new Date(year, month, day);
        const isPast = thisDate < today;

        if (isPast) {
            dayEl.classList.add("past-day");
            dayEl.disabled = true;
        } else {
            dayEl.addEventListener("click", () => {
                selectedDateKey = dateKey;
                selectedTime = "";
                renderCalendar();
                renderTimeButtons();
                syncStartTimeInput();
                checkAvailability();
            });
        }

        if (dateKey === selectedDateKey) {
            dayEl.classList.add("selected");
        }

        calendarGrid.appendChild(dayEl);
    }

    let nextMonthDay = 1;

    while (calendarGrid.children.length % 7 !== 0) {
        const dayEl = document.createElement("button");
        dayEl.type = "button";
        dayEl.className = "calendar-day other-month";
        dayEl.textContent = String(nextMonthDay);
        dayEl.disabled = true;
        calendarGrid.appendChild(dayEl);
        nextMonthDay++;
    }
}

if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });
}

const form = document.querySelector(".booking-time-form");

if (form) {
    form.addEventListener("submit", (event) => {
        if (!startTimeInput.value || !availabilityOk) {
            event.preventDefault();
            showAvailabilityMessage("Vali saadaval olev aeg.", true);
        }
    });
}

renderCalendar();
renderTimeButtons();
syncStartTimeInput();