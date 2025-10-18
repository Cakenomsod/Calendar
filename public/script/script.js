const calendarGrid = document.querySelector(".calendar-grid");
const monthYear = document.getElementById("month-year");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

let currentDate = new Date();

function renderCalendar(date) {
  // ลบวันเก่าออกก่อน
  const dayCells = document.querySelectorAll(".day-cell");
  dayCells.forEach(cell => cell.remove());

  const year = date.getFullYear();
  const month = date.getMonth();

  // แสดงชื่อเดือน
  const monthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  monthYear.textContent = `${monthNames[month]} ${year}`;

  // วันที่ 1 ของเดือน
  const firstDay = new Date(year, month, 1).getDay(); // 0=อา, 1=จ, ...
  const lastDate = new Date(year, month + 1, 0).getDate(); // จำนวนวันในเดือน

  // เติมช่องว่างวันก่อนวันแรก
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("day-cell");
    calendarGrid.appendChild(emptyCell);
  }

  // เติมวันของเดือน
  for (let day = 1; day <= lastDate; day++) {
    const dayCell = document.createElement("div");
    dayCell.classList.add("day-cell");
    dayCell.textContent = day;
    calendarGrid.appendChild(dayCell);
  }
}

// ปุ่ม prev/next
prevMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});

nextMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

// เรียกครั้งแรก
renderCalendar(currentDate);
