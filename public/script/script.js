const thaiMonths = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
];

let currentDate = new Date();
let modalDate = null; // เก็บวันที่ใน modal

function init() {
  renderAllMonths();
  setupEventListeners();
}

// ------------------- Render เดือนทั้งหมด -------------------
function renderAllMonths() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);

  document.getElementById('prevMonth').innerHTML = generateMonthHTML(prev);
  document.getElementById('currentMonthContent').innerHTML = generateMonthHTML(currentDate, true);
  document.getElementById('nextMonth').innerHTML = generateMonthHTML(next);

  document.getElementById('currentMonth').textContent = thaiMonths[month];
  document.getElementById('currentYear').textContent = year + 543;

  setupDayClick();
}

// ------------------- สร้าง HTML เดือน -------------------
function generateMonthHTML(dateObj, highlightToday = false) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  let html = '<div class="calendar-grid">';

  // วันก่อนหน้า
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="border"><div class="calendar-day other-month">${daysInPrevMonth - i}</div></div>`;
  }

  // วันปกติ
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = highlightToday &&
                    day === today.getDate() &&
                    month === today.getMonth() &&
                    year === today.getFullYear();
    const dayOfWeek = new Date(year, month, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    html += `<div class="border"><div class="calendar-day ${isWeekend ? 'weekend' : ''} ${isToday ? 'selected' : ''}">
               ${isToday ? `<span class="today-number">${day}</span>` : day}
             </div></div>`;
  }

  // เติมช่องหลังเดือน
  const totalCells = firstDay + daysInMonth;
  const remaining = Math.ceil(totalCells / 7) * 7 - totalCells;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="border"><div class="calendar-day other-month">${i}</div></div>`;
  }

  html += '</div>';
  return html;
}

// ------------------- คลิกเลือกวัน -------------------
function setupDayClick() {
  document.querySelectorAll('.calendar-day').forEach(dayEl => {
    dayEl.addEventListener('click', () => {
      document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
      dayEl.classList.add('selected');

      const day = parseInt(dayEl.textContent);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      showActivityModal(new Date(year, month, day));
    });
  });
}

// ------------------- ฟังก์ชัน Modal แสดงกิจกรรม -------------------
function showActivityModal(dateObj) {
  const modal = document.getElementById('activityModal');
  modalDate = new Date(dateObj);
  document.body.style.overflow = 'hidden';

  renderActivityInModal();
  modal.classList.add('active');

  // Scroll mouse ใน modal
  modal.addEventListener('wheel', handleModalScroll);
  // Swipe บนมือถือ
  setupModalSwipe(modal, 'activity');
  // Keyboard arrow
  window.addEventListener('keydown', handleModalArrows);
}

function handleModalArrows(e) {
  const modal = document.getElementById('activityModal');
  if (!modal.classList.contains('active')) return;

  if (e.key === 'ArrowRight') modalNextDay();
  else if (e.key === 'ArrowLeft') modalPrevDay();
}

function modalNextDay() {
  modalDate.setDate(modalDate.getDate() + 1);
  updateModalDate();
}
function modalPrevDay() {
  modalDate.setDate(modalDate.getDate() - 1);
  updateModalDate();
}

function handleModalScroll(e) {
  e.preventDefault();
  if (e.deltaY > 0) modalNextDay();
  else if (e.deltaY < 0) modalPrevDay();
}

function updateModalDate() {
  renderActivityInModal();
  currentDate = new Date(modalDate);
  renderAllMonths();
  const day = modalDate.getDate();
  document.querySelectorAll('.calendar-day').forEach(el => {
    if (parseInt(el.textContent) === day && !el.classList.contains('other-month')) {
      el.classList.add('selected');
    }
  });
}

function closeActivityModal() {
  const modal = document.getElementById('activityModal');
  modal.classList.remove('active');
  modal.removeEventListener('wheel', handleModalScroll);
  window.removeEventListener('keydown', handleModalArrows);
  document.body.style.overflow = '';
}

// ------------------- เพิ่มฟังก์ชัน Swipe ทั่วไป -------------------
function setupModalSwipe(modal, type) {
  let startX = 0;
  let endX = 0;

  modal.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX);
  modal.addEventListener('touchend', e => {
    endX = e.changedTouches[0].screenX;
    const swipe = endX - startX;

    if (Math.abs(swipe) < 50) return; // ปัดเบาเกินไปไม่ทำงาน

    if (type === 'activity') {
      if (swipe < 0) modalNextDay(); // ปัดซ้าย = วันถัดไป
      else modalPrevDay(); // ปัดขวา = วันก่อนหน้า
    }
    if (type === 'month') {
      if (swipe < 0) nextYearInMonthModal(); // ปัดซ้าย = ไปปีหน้า
      else prevYearInMonthModal(); // ปัดขวา = ปีก่อน
    }
    if (type === 'year') {
      if (swipe < 0) nextDecadeInYearModal(); // ปัดซ้าย = +10ปี
      else prevDecadeInYearModal(); // ปัดขวา = -10ปี
    }
  });
}

// แสดงกิจกรรมใน modal
function renderActivityInModal() {
  const modal = document.getElementById('activityModal');
  const title = document.getElementById('activityTitle');
  const list = document.getElementById('activityList');

  const year = modalDate.getFullYear();
  const month = modalDate.getMonth();
  const day = modalDate.getDate();

  title.textContent = `กิจกรรมวันที่ ${day} ${thaiMonths[month]} ${year + 543}`;
  list.innerHTML = '';

  // ตัวอย่างข้อมูลกิจกรรม
  const exampleEvents = {
    '2025-10-22': ['สอบคณิต', 'นัดพรีเซนต์โปรเจค'],
    '2025-10-25': ['ประชุมสภานักเรียน', 'ส่งงานคอมพ์'],
  };

  const key = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const events = exampleEvents[key];

  if (events && events.length > 0) {
    events.forEach(e => {
      const div = document.createElement('div');
      div.className = 'activity-item';
      div.textContent = `• ${e}`;
      list.appendChild(div);
    });
  } else {
    list.innerHTML = '<p style="color:#999;">ไม่มีรายการกิจกรรมในวันนี้</p>';
  }

  // ------------------- เพิ่มกิจกรรม -------------------
  document.getElementById('addActivityBtn').addEventListener('click', addActivity);
  document.getElementById('activityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addActivity();
  });

  function addActivity() {
  const input = document.getElementById('activityInput');
  const text = input.value.trim();
  if (text === '') return; // ❌ ไม่มีค่าไม่ทำอะไร

    const div = document.createElement('div');
    div.className = 'activity-item';
    div.textContent = `• ${text}`;
    document.getElementById('activityList').appendChild(div);

    // 📅 เตรียมข้อมูลกิจกรรมพื้นฐาน
    const year = modalDate.getFullYear();
    const month = (modalDate.getMonth() + 1).toString().padStart(2, '0');
    const day = modalDate.getDate().toString().padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const activityData = {
      title: text,
      startDate: dateKey,
      endDate: dateKey,
      isAllDay: true,
      startTime: null,
      endTime: null,
      notify: false,
      createdAt: serverTimestamp()
    };

    // ✅ อัปโหลดไป Firestore
    addDoc(collection(db, "activities"), activityData)
      .then(() => {
        console.log("เพิ่มกิจกรรมสำเร็จ:", text);
      })
      .catch((err) => {
        console.error("เกิดข้อผิดพลาดในการเพิ่มกิจกรรม:", err);
      });

    // ล้างช่อง input
    input.value = '';
  }
}

// ------------------- เลื่อนใน modal -------------------
function handleModalScroll(e) {
  e.preventDefault(); // ❗ ป้องกันไม่ให้ body เลื่อน

  if (e.deltaY > 0) {
    // scroll ลง → วันถัดไป
    modalDate.setDate(modalDate.getDate() + 1);
  } else if (e.deltaY < 0) {
    // scroll ขึ้น → วันก่อนหน้า
    modalDate.setDate(modalDate.getDate() - 1);
  }

  // อัปเดตกิจกรรมใหม่
  renderActivityInModal();

  // sync กับปฏิทินหลัก
  currentDate = new Date(modalDate);
  renderAllMonths();

  // highlight วันที่ในปฏิทินหลัก
  const day = modalDate.getDate();
  document.querySelectorAll('.calendar-day').forEach(el => {
    if (parseInt(el.textContent) === day && !el.classList.contains('other-month')) {
      el.classList.add('selected');
    }
  });
}

// ------------------- ปิด modal -------------------
function closeActivityModal() {
  const modal = document.getElementById('activityModal');
  modal.classList.remove('active');
  modal.removeEventListener('wheel', handleModalScroll);
  document.body.style.overflow = ''; // คืน scroll
}

// ------------------- เลื่อนเดือน -------------------
function nextMonth() {
  const wrapper = document.getElementById('calendarContentWrapper');
  wrapper.style.transform = 'translateX(-200%)';
  wrapper.addEventListener('transitionend', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderAllMonths();
    wrapper.style.transition = 'none';
    wrapper.style.transform = 'translateX(-100%)';
    setTimeout(() => wrapper.style.transition = 'transform 0.3s ease', 10);
  }, { once: true });
}

function prevMonth() {
  const wrapper = document.getElementById('calendarContentWrapper');
  wrapper.style.transform = 'translateX(0)';
  wrapper.addEventListener('transitionend', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderAllMonths();
    wrapper.style.transition = 'none';
    wrapper.style.transform = 'translateX(-100%)';
    setTimeout(() => wrapper.style.transition = 'transform 0.3s ease', 10);
  }, { once: true });
}

// ------------------- Modal เดือน -------------------
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
  renderAllMonths();
}



// ------------------- Modal ปี -------------------


let yearModalBase = null;

function showYearModal() {
  const modal = document.getElementById('YearModal');
  const currentYear = currentDate.getFullYear() + 543;
  
  // แสดงช่วงปีรอบปัจจุบัน
  yearModalBase = Math.floor(currentYear / 10) * 10; // เช่น 2570 → เริ่มที่ 2569
  renderYearModalGrid();
  modal.classList.add('active');

  // รองรับ swipe
  setupModalSwipe(modal, 'year');

  // เพิ่มปุ่มลูกศรซ้ายขวา (กดได้ใน modal)
  document.addEventListener('keydown', handleYearModalArrowKeys);
}

function handleYearModalArrowKeys(e) {
  const modal = document.getElementById('YearModal');
  if (!modal.classList.contains('active')) return;

  if (e.key === 'ArrowRight') nextDecadeInYearModal();
  else if (e.key === 'ArrowLeft') prevDecadeInYearModal();
}

function closeYearModal() {
  const modal = document.getElementById('YearModal');
  modal.classList.remove('active');
  document.removeEventListener('keydown', handleYearModalArrowKeys);
}

function renderYearModalGrid() {
  const grid = document.getElementById('YearGrid');
  let html = '';

  // แสดง 12 ปี (เช่น 2569–2580)
  for (let year = yearModalBase; year < yearModalBase + 11; year++) {
    html += `<div class="modal-item" onclick="selectYearFromModal(${year - 543})">${year}</div>`;
  }

  grid.innerHTML = `
    <div class="year-modal-header">
      <button id="prevDecadeBtn" class="arrow-btn">←</button>
      <span>${yearModalBase} - ${yearModalBase + 10}</span>
      <button id="nextDecadeBtn" class="arrow-btn">→</button>
    </div>
    ${html}
  `;

  document.getElementById('prevDecadeBtn').addEventListener('click', prevDecadeInYearModal);
  document.getElementById('nextDecadeBtn').addEventListener('click', nextDecadeInYearModal);
}

function nextDecadeInYearModal() {
  yearModalBase += 12; // ไปข้างหน้า 12 ปี
  renderYearModalGrid();
}

function prevDecadeInYearModal() {
  yearModalBase -= 12; // ย้อนหลัง 12 ปี
  renderYearModalGrid();
}

function selectYearFromModal(year) {
  // กดเลือกปี → เปลี่ยนปีในปฏิทินหลัก
  currentDate.setFullYear(year);
  renderAllMonths();
  closeYearModal();
}

// ------------------- Event listeners -------------------
function setupEventListeners() {
  document.getElementById('currentMonth').addEventListener('click', showMonthModal);
  document.getElementById('closeMonth').addEventListener('click', () => {
    document.getElementById('monthModal').classList.remove('active');
  });

  document.getElementById('currentYear').addEventListener('click', showYearModal);
  document.getElementById('closeYear').addEventListener('click', () => {
    document.getElementById('YearModal').classList.remove('active');
  });

  document.getElementById('closeActivity').addEventListener('click', closeActivityModal);

  // คลิก background ปิด modal
  window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
      closeActivityModal();
      e.target.classList.remove('active');
    }
  };

  // Scroll เมาส์ใน body (เฉพาะตอน modal ปิด)
  window.addEventListener('wheel', (e) => {
    const modalActive = document.querySelector('.modal.active');
    if (modalActive) return; // ❗ ถ้ามี modal เปิดอยู่ ไม่เลื่อนเดือน
    if (e.deltaY > 0) nextMonth();
    else if (e.deltaY < 0) prevMonth();
  });

  // Arrow keys
  window.addEventListener('keydown', (e) => {
    const modalActive = document.querySelector('.modal.active');
    if (modalActive) return;
    if (e.key === 'ArrowRight') nextMonth();
    else if (e.key === 'ArrowLeft') prevMonth();
  });

  // Touch swipe
  const calendarContainer = document.getElementById('calendarContent');
  let touchStartX = 0;
  let touchEndX = 0;

  calendarContainer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; });
  calendarContainer.addEventListener('touchend', e => {
    const modalActive = document.querySelector('.modal.active');
    if (modalActive) return;
    touchEndX = e.changedTouches[0].screenX;
    const swipe = touchEndX - touchStartX;
    if (swipe > 80) prevMonth();
    else if (swipe < -80) nextMonth();
  });
}

init();
