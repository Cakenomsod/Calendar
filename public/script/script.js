const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

let currentDate = new Date();

function init() {
  renderCalendar();
  setupEventListeners();
}


// ✅ ย้ายขึ้นมาก่อน setupEventListeners
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar('next');
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar('prev');
}

// ตั้ง event
function setupEventListeners() {
  document.getElementById('currentMonth').addEventListener('click', showMonthModal);
  document.getElementById('closeMonth').addEventListener('click', () => {
    document.getElementById('monthModal').classList.remove('active');
  });

  // คลิกพื้นหลัง modal เพื่อปิด
  window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
      event.target.classList.remove('active');
    }
  };

  // Scroll เมาส์ขึ้น/ลงเพื่อเปลี่ยนเดือน
  window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0) nextMonth();
    else if (e.deltaY < 0) prevMonth();
  });

  // ลูกศรซ้าย/ขวา
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextMonth();
    else if (e.key === 'ArrowLeft') prevMonth();
  });

  // 👇 gesture ปัดซ้าย–ขวา
  const calendarContainer = document.getElementById('calendarContent');
  let touchStartX = 0;
  let touchEndX = 0;

  calendarContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  calendarContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const swipeDistance = touchEndX - touchStartX;

    if (swipeDistance > 80) prevMonth();      // ปัดขวา → เดือนก่อนหน้า
    else if (swipeDistance < -80) nextMonth(); // ปัดซ้าย → เดือนถัดไป
  });
}



// render ปฏิทินแบบเดือน
function renderCalendar(direction = null) {
  const calendarContainer = document.getElementById('calendarContent');

  // ถ้ามีทิศทางให้ใส่ animation ออกก่อน
  if (direction) {
    const slideClass = direction === 'next' ? 'slide-left' : 'slide-right';
    calendarContainer.classList.add(slideClass);

    // หลัง animation จบ ค่อยเปลี่ยนเดือนจริง
    setTimeout(() => {
      calendarContainer.classList.remove(slideClass);
      updateCalendarHTML();
    }, 300);
  } else {
    updateCalendarHTML();
  }
}

function updateCalendarHTML() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  document.getElementById('currentMonth').textContent = `${thaiMonths[month]}`;
  document.getElementById('currentYear').textContent = `${year + 543}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  let html = '<div class="calendar-grid">';

  // วันก่อนหน้า
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
  }

  // วันในเดือนนี้
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    const dayOfWeek = new Date(year, month, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    html += `<div class="calendar-day ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}">
      ${day}
    </div>`;
  }

  // เติมช่องหลังเดือน
  const totalCells = firstDay + daysInMonth;
  const totalNeededCells = Math.ceil(totalCells / 7) * 7;
  const remaining = totalNeededCells - totalCells;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="calendar-day other-month">${i}</div>`;
  }

  html += '</div>';
  document.getElementById('calendarContent').innerHTML = html;
}


// Modal เลือกเดือน
function showMonthModal() {
  const modal = document.getElementById('monthModal');
  const grid = document.getElementById('monthGrid');

  let html = '';
  thaiMonths.forEach((month, index) => {
    html += `<div class="modal-item" onclick="selectMonthFromModal(${index})">${month}</div>`;
  });

  grid.innerHTML = html;
  modal.classList.add('active');
}

function selectMonthFromModal(monthIndex) {
  currentDate.setMonth(monthIndex);
  document.getElementById('monthModal').classList.remove('active');
  renderCalendar();
}

init();

