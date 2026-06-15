const bossCalendarGrid = document.getElementById("bossCalendarGrid");
const monthTitle = document.getElementById("monthTitle");
const selectedBossDate = document.getElementById("selectedBossDate");
const bossDaySchedule = document.getElementById("bossDaySchedule");

const bossShifts = window.bossShifts || [];

let currentDate = new Date();
currentDate.setDate(1);

const monthNames = [
    "Jaanuar", "Veebruar", "Märts", "Aprill", "Mai", "Juuni",
    "Juuli", "August", "September", "Oktoober", "November", "Detsember"
];

function getDateKey(day) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const date = String(day).padStart(2, "0");
    return `${year}-${month}-${date}`;
}

function getShiftsForDate(dateKey) {
    return bossShifts.filter(shift => {
        return shift.start_time.startsWith(dateKey);
    });
}

function renderBossCalendar() {
    bossCalendarGrid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startOffset - 1; i >= 0; i--) {
        createBossDay(prevMonthLastDay - i, true);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        createBossDay(day, false);
    }

    while (bossCalendarGrid.children.length % 7 !== 0) {
        createBossDay(bossCalendarGrid.children.length, true);
    }
}

function createBossDay(day, otherMonth) {
    const dayEl = document.createElement("div");
    dayEl.className = "calendar-day";
    dayEl.innerHTML = `<strong>${day}</strong>`;

    if (otherMonth) {
        dayEl.classList.add("other-month");
        bossCalendarGrid.appendChild(dayEl);
        return;
    }

    const dateKey = getDateKey(day);
    const shifts = getShiftsForDate(dateKey);

    if (shifts.length > 0) {
        const hasPending = shifts.some(s => s.status === "pending");
        const hasRejected = shifts.some(s => s.status === "rejected");
        const hasApproved = shifts.some(s => s.status === "approved");

        if (hasPending) {
            dayEl.classList.add("boss-pending");
        } else if (hasRejected) {
            dayEl.classList.add("boss-rejected");
        } else if (hasApproved) {
            dayEl.classList.add("boss-approved");
        }

        dayEl.innerHTML += `<small>${shifts.length} vahetust</small>`;
    }

    dayEl.addEventListener("click", () => {
        selectedBossDate.textContent = dateKey;
        renderDayDetails(dateKey);
    });

    bossCalendarGrid.appendChild(dayEl);
}

function renderDayDetails(dateKey) {
    const shifts = getShiftsForDate(dateKey);

    if (shifts.length === 0) {
        bossDaySchedule.innerHTML = "<p>Sellel päeval ei ole vahetusi.</p>";
        return;
    }

    bossDaySchedule.innerHTML = "";

    shifts.forEach(shift => {
        const start = shift.start_time.substring(11, 16);
        const end = shift.end_time.substring(11, 16);

        const card = document.createElement("div");
        card.className = "card p-3 mb-2";

        if (shift.status === "pending") {

            card.innerHTML = `
                <strong>${shift.worker_name}</strong>
                <p>${shift.location_city}, ${shift.location_address}</p>
                <p>${start}-${end}</p>
                <p>Status: Ootel</p>
        
                <button class="approve-btn">
                    Kinnita
                </button>
        
                <button class="reject-btn">
                    Keeldu
                </button>
        
                <button class="edit-btn">
                    Muuda
                </button>
            `;
        
        } else if (shift.status === "approved") {
        
            card.innerHTML = `
                <strong>${shift.worker_name}</strong>
                <p>${shift.location_city}, ${shift.location_address}</p>
                <p>${start}-${end}</p>
                <p>✅ Kinnitatud</p>
            `;
        
        } else {
        
            card.innerHTML = `
                <strong>${shift.worker_name}</strong>
                <p>${shift.location_city}, ${shift.location_address}</p>
                <p>${start}-${end}</p>
                <p>❌ Tagasi lükatud</p>
            `;
        }

        if (shift.status !== "pending") {
            bossDaySchedule.appendChild(card);
            return;
        }

        const approveBtn =
            card.querySelector(".approve-btn");

        approveBtn.addEventListener(
            "click",
            async () => {

                const response =
                    await fetch(
                        `/boss/schedule/${shift.id}/status`,
                        {
                            method: "PATCH",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                "CSRF-Token":
                                    window.csrfToken
                            },
                            body: JSON.stringify({
                                status: "approved"
                            })
                        }
                    );

                if (response.ok) {
                    window.location.reload();
                }
            }
        );

        const rejectBtn =
            card.querySelector(".reject-btn");

        rejectBtn.addEventListener(
            "click",
            async () => {

                const response =
                    await fetch(
                        `/boss/schedule/${shift.id}/status`,
                        {
                            method: "PATCH",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                "CSRF-Token":
                                    window.csrfToken
                            },
                            body: JSON.stringify({
                                status: "rejected"
                            })
                        }
                    );

                if (response.ok) {
                    window.location.reload();
                }
            }
        );

        const editBtn =
            card.querySelector(".edit-btn");
        
            editBtn.addEventListener(
                "click",
                () => {
            
                    const start =
                        shift.start_time.substring(11,16);
            
                    const end =
                        shift.end_time.substring(11,16);
            
                    card.innerHTML += `
                        <hr>
            
                        <label>Algusaeg</label>
                        <input
                            type="time"
                            class="edit-start"
                            value="${start}"
                        >
            
                        <label>Lõppaeg</label>
                        <input
                            type="time"
                            class="edit-end"
                            value="${end}"
                        >
            
                        <label>Asukoht</label>
            
                        <select class="edit-location">
                            ${window.locations.map(
                                location =>
                                    `<option
                                        value="${location.id}"
                                    >
                                        ${location.city},
                                        ${location.address}
                                    </option>`
                            ).join("")}
                        </select>
            
                        <button
                            class="save-edit-btn"
                        >
                            Salvesta
                        </button>
                    `;
            
                    const saveBtn =
                        card.querySelector(
                            ".save-edit-btn"
                        );
            
                    saveBtn.addEventListener(
                        "click",
                        async () => {
            
                            const newStart =
                                card.querySelector(
                                    ".edit-start"
                                ).value;
            
                            const newEnd =
                                card.querySelector(
                                    ".edit-end"
                                ).value;
            
                            const newLocation =
                                card.querySelector(
                                    ".edit-location"
                                ).value;
            
                            const date =
                                shift.start_time.substring(0,10);
            
                            const response =
                                await fetch(
                                    `/boss/schedule/${shift.id}`,
                                    {
                                        method: "PATCH",
                                        headers: {
                                            "Content-Type":
                                                "application/json",
                                            "CSRF-Token":
                                                window.csrfToken
                                        },
                                        body: JSON.stringify({
                                            location_id:
                                                newLocation,
                                            start_time:
                                                `${date} ${newStart}:00`,
                                            end_time:
                                                `${date} ${newEnd}:00`
                                        })
                                    }
                                );
            
                            if (response.ok) {
                                window.location.reload();
                            }
                        }
                    );
                }
            );

        bossDaySchedule.appendChild(card);
    });
}

document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderBossCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderBossCalendar();
});

renderBossCalendar();