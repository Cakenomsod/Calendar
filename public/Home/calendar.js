import { auth, db } from "../src/firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // ตรวจสอบสถานะการเข้าสู่ระบบทุกครั้งที่หน้าโหลด
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("✅ ผู้ใช้ล็อกอินอยู่:", user.email);

      // โหลดข้อมูลผู้ใช้จาก Firestore
      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("📄 ข้อมูลผู้ใช้จาก Firestore:", userData);

        // ✅ แสดงผลในหน้า calendar (เช่นชื่อหรืออีเมล)
        document.getElementById("userEmail").textContent = userData.Email || user.email;
      } else {
        console.warn("⚠️ ไม่พบข้อมูลผู้ใช้ใน Firestore (อาจยังไม่เคยบันทึก)");
      }

    } else {
      console.log("❌ ยังไม่ได้เข้าสู่ระบบ → กลับไปหน้า login");
      window.location.href = "../Login/index.html"; // เปลี่ยน path ตามจริง
    }
  });
});


// ปุ่มออกจากระบบ (กรณีมีในหน้า calendar)
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("loggedInUser");
      alert("ออกจากระบบเรียบร้อย");
      window.location.href = "../Login/index.html";
    } catch (error) {
      console.error("ออกจากระบบไม่สำเร็จ:", error);
    }
  });
}

const thaiMonths = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
];

let currentDate = new Date();
let modalDate = null;

function init() {
  renderAllMonths();
  setupEventListeners();
}


// ================== SETTINGS PANEL CONTROL ==================
document.addEventListener("DOMContentLoaded", () => {
  const settingIcon = document.querySelector(".setting-icon");
  const settingPanel = document.getElementById("settingPanel");
  const overlay = document.getElementById("overlay");
  const calendar = document.querySelector(".calendar-container");

  settingIcon.addEventListener("click", () => {
    settingPanel.classList.add("active");
    overlay.classList.add("active");
    calendar.classList.add("slide-left");
  });

  // คลิก overlay เพื่อปิด
  overlay.addEventListener("click", () => {
    // เพิ่มคลาส closing เพื่อให้เล่นแอนิเมชันออก
    settingPanel.classList.add("closing");
    overlay.classList.remove("active");

    // รอฟังเมื่อ transition จบ
    settingPanel.addEventListener(
      "transitionend",
      () => {
        settingPanel.classList.remove("active", "closing");
      },
      { once: true } // ให้ทำแค่ครั้งเดียว
    );
  });

  // ปุ่มออกจากระบบ (ตัวอย่าง)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("ออกจากระบบเรียบร้อย!");
      settingPanel.classList.remove("active");
      overlay.classList.remove("active");
      calendar.classList.remove("slide-left");
    });
  }
});


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

// ------------------- เลื่อนเดือน -------------------
function nextMonth() {
  const wrapper = document.getElementById('calendarContentWrapper');
  wrapper.style.transform = 'translateX(-200%)';
  wrapper.addEventListener('transitionend', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderAllMonths();
    wrapper.style.transition = 'none';
    wrapper.style.transform = 'translateX(-100%)';
    setTimeout(() => wrapper.style.transition = 'transform 0.5s ease', 10);
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
    setTimeout(() => wrapper.style.transition = 'transform 0.5s ease', 10);
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
  yearModalBase += 10; // ไปข้างหน้า 12 ปี
  renderYearModalGrid();
}

function prevDecadeInYearModal() {
  yearModalBase -= 10; // ย้อนหลัง 12 ปี
  renderYearModalGrid();
}


function selectYearFromModal(year) {
  currentDate.setFullYear(year);
  renderAllMonths();
  closeYearModal();
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
    }ก
  });
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


// ------------------- คลิกเลือกวัน -------------------
function setupDayClick() {
  document.querySelectorAll('.calendar-day').forEach(dayEl => {
    dayEl.addEventListener('click', () => {
      document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
      dayEl.classList.add('selected');

      const day = parseInt(dayEl.textContent);
      const year = currentDate.getFullYear();
      let month = currentDate.getMonth();

      // ✅ ตรวจว่าคือวันของเดือนก่อนหน้าหรือเดือนถัดไป
      if (dayEl.classList.contains('other-month')) {
        // นับจำนวนช่องวันก่อนหน้าในเดือนนี้
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // ถ้าตัวเลขใน .other-month < 15 และอยู่ท้าย grid → เดือนถัดไป
        // ถ้า > (daysInPrevMonth - firstDayOfMonth) → เดือนก่อนหน้า
        if (day <= 15 && dayEl.parentElement && dayEl.parentElement.parentElement) {
          // ตรวจจากตำแหน่ง index ใน grid เพื่อแยกฝั่ง
          const index = Array.from(document.querySelectorAll('.calendar-day')).indexOf(dayEl);
          const totalDays = document.querySelectorAll('.calendar-day').length;
          if (index > totalDays - 7) month += 1; // แถวสุดท้าย → เดือนถัดไป
          else month -= 1; // แถวแรก ๆ → เดือนก่อนหน้า
        } else {
          // fallback ปลอดภัย
          if (day > 20) month -= 1;
          else month += 1;
        }
      }

      const selectedDate = new Date(year, month, day);
      showActivityModal(selectedDate);
    });
  });
}



// แสดงกิจกรรมใน modal
function renderActivityInModal() {
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
  if (text === '') return; // เปิดหน้าต่างเพิ่มกิจกรรมแบบระเอียด

  const div = document.createElement('div');
  div.className = 'activity-item';
  div.textContent = `• ${text}`;
  document.getElementById('activityList').appendChild(div);

  input.value = '';
  }
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
    if (modalActive) return;
    if (settingPanel && settingPanel.classList.contains('active')) return;
    if (e.deltaY > 0) nextMonth();
    else if (e.deltaY < 0) prevMonth();
  });

  // Arrow keys
  window.addEventListener('keydown', (e) => {
    const modalActive = document.querySelector('.modal.active');
    if (modalActive) return;
    if (settingPanel && settingPanel.classList.contains('active')) return;
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
    if (settingPanel && settingPanel.classList.contains('active')) return;
    touchEndX = e.changedTouches[0].screenX;
    const swipe = touchEndX - touchStartX;
    if (swipe > 80) prevMonth();
    else if (swipe < -80) nextMonth();
  });
}


// ------------------- MODAL เพิ่มกิจกรรมละเอียด -------------------
const addDetailModal = document.getElementById('addDetailActivityModal');
const closeAddDetailModal = document.getElementById('closeAddDetailModal');
const cancelEventBtn = document.getElementById('cancelEventBtn');
const repeatToggle = document.getElementById('repeatToggle');
const repeatOptions = document.getElementById('repeatOptions');

function openAddDetailModal(dateObj = null) {
  addDetailModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (dateObj) {
    const isoDate = dateObj.toISOString().split('T')[0];
    document.getElementById('startDate').value = isoDate;
    document.getElementById('endDate').value = isoDate;
  }
}

function closeAddDetailActivityModal() {
  addDetailModal.classList.remove('active');
  document.body.style.overflow = '';
}

// toggle ซ้ำ
repeatToggle.addEventListener('change', () => {
  repeatOptions.style.display = repeatToggle.checked ? 'block' : 'none';
});

// ปุ่มปิด
closeAddDetailModal.addEventListener('click', closeAddDetailActivityModal);
cancelEventBtn.addEventListener('click', closeAddDetailActivityModal);

// เมื่อกด + ตอนช่องว่าง
document.getElementById('addActivityBtn').addEventListener('click', () => {
  const input = document.getElementById('activityInput');
  if (input.value.trim() === '') {
    openAddDetailModal(modalDate);
  }
});

// เมื่อคลิกวันที่ที่ไม่มีกิจกรรม
function handleEmptyDayClick(dateObj) {
  openAddDetailModal(dateObj);
}


// เริ่มทำงานหลัง DOM โหลดครบ
document.addEventListener("DOMContentLoaded", () => {
  init();

  // ทำให้เรียกใช้ได้จาก onclick ใน HTML
  window.selectMonthFromModal = selectMonthFromModal;
  window.selectYearFromModal = selectYearFromModal;

});
