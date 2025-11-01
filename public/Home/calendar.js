import { auth, signOut, db } from "../src/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getDoc, addDoc, collection} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // ตรวจสอบสถานะการเข้าสู่ระบบทุกครั้งที่หน้าโหลด
  onAuthStateChanged(auth, async (user) => {
    const userEmailElement = document.getElementById("userEmail");
    const userInfoDiv = document.querySelector(".user-info");

    if (user) {
      console.log("✅ ผู้ใช้ล็อกอินอยู่:", user.email);

      // แสดงอีเมล
      userEmailElement.textContent = `Email: ${user.email}`;

      // แสดงรูปโปรไฟล์ (ถ้ามี)
      if (user.photoURL && userInfoDiv) {
        userInfoDiv.style.setProperty("--user-photo", `url('${user.photoURL}')`);
        userInfoDiv.classList.add("has-photo");
      }

    } else {
      console.log("❌ ยังไม่ได้เข้าสู่ระบบ → กลับไปหน้า login");
      window.location.href = "../Login/index.html"; // เปลี่ยน path ตามจริง
    }
  });
});

// ปุ่มออกจากระบบ
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
      localStorage.removeItem("loggedInUser");
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
  yearModalBase = currentYear - (currentYear % 10); // เช่น 2570 → เริ่มที่ 2569
  renderYearModalGrid();
  modal.classList.add('active');

  // รองรับ swipe
  setupModalSwipe(modal, 'year');

  // เพิ่มปุ่มลูกศรซ้ายขวา (กดได้ใน modal)
  document.addEventListener('keydown', handleYearModalArrowKeys);
}

function NotificationSettings() {
  document.getElementById('NotificationModal').classList.add('active');
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
    }
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
          const index = Array.from(dayEl.parentElement.children).indexOf(dayEl);
          if (index < 7) {
            // อยู่แถวแรก → เดือนก่อนหน้า
            month -= 1;
          } else {
            // แถวสุดท้าย → เดือนถัดไป
            month += 1;
          }
        }

      const selectedDate = new Date(year, month, day);
      showActivityModal(selectedDate);
    });
  });
}



// แสดงกิจกรรมใน modal
async function renderActivityInModal() {
  const title = document.getElementById("activityTitle");
  const list = document.getElementById("activityList");

  const year = modalDate.getFullYear();
  const month = modalDate.getMonth();
  const day = modalDate.getDate();
  const keyDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

  title.textContent = `กิจกรรมวันที่ ${day} ${thaiMonths[month]} ${year + 543}`;
  list.innerHTML = "<p style='color:#999;'>กำลังโหลด...</p>";

  const events = await loadActivitiesByDate(keyDate);

  if (events.length > 0) {
    list.innerHTML = "";
    events.forEach((e) => {
      const div = document.createElement("div");
      div.className = "activity-item";
      div.textContent = `• ${e.Name}`;
      list.appendChild(div);
    });
  } else {
    list.innerHTML = "<p style='color:#999;'>ไม่มีรายการกิจกรรมในวันนี้</p>";
  }
}





  // ------------------- เพิ่มกิจกรรม -------------------
  document.getElementById('addActivityBtn').addEventListener('click', addActivity);
  document.getElementById('activityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addActivity();
  });

  function addActivity() {
  const input = document.getElementById('activityInput');
  const text = input.value.trim();
  if (text === '') {    
    closeActivityModal();
    openAddDetailModal(modalDate);
  } else{
    sendactivitydata("Normal", text);

    input.value = '';
  }; // เปิดหน้าต่างเพิ่มกิจกรรมแบบระเอียด


  }


// ✅ ซ่อน/แสดงเวลาในฟอร์มเพิ่มกิจกรรมเมื่อเลือก "ทั้งวัน"
const allDayToggle = document.getElementById("allDayToggle");
const timeInputsRow = document.querySelector(".time-inputs");

if (allDayToggle && timeInputsRow) {
  allDayToggle.addEventListener("change", () => {
    if (allDayToggle.checked) {
      timeInputsRow.style.display = "none"; // ซ่อนช่องเวลา
    } else {
      timeInputsRow.style.display = "flex"; // แสดงกลับมา
    }
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
    // ลบ 1 วันจากวันที่ที่คลิก
    const adjustedDate = new Date(dateObj);
    adjustedDate.setDate(adjustedDate.getDate() + 1);

    const isoDate = adjustedDate.toISOString().split('T')[0];
    document.getElementById('startDate').value = isoDate;
    document.getElementById('endDate').value = isoDate;

    document.getElementById('startTime').value = '09:00';
    document.getElementById('endTime').value = '10:00';
  }
}




function closeAddDetailActivityModal() {
  addDetailModal.classList.remove('active');
  document.body.style.overflow = '';
}



// ปุ่มปิด
closeAddDetailModal.addEventListener('click', closeAddDetailActivityModal);
cancelEventBtn.addEventListener('click', closeAddDetailActivityModal);


const Notification = document.getElementById('Notification');
const NotificationModal = document.getElementById('NotificationModal');
const closeNotificationModal = document.getElementById('closeNotificationModal');

Notification.addEventListener('click', () => {
  NotificationModal.classList.add('active');
});

closeNotificationModal.addEventListener('click', () => {
  NotificationModal.classList.remove('active');
});




// ฟังก์ชันสร้าง notification item
function createNotificationItem(listContainer) {
  const div = document.createElement('div');
  div.className = 'notification-item';
  div.innerHTML = `
    <input type="number" min="0" value="1">
    <select>
      <option value="minutes">นาที</option>
      <option value="hours">ชั่วโมง</option>
      <option value="days">วัน</option>
      <option value="weeks">อาทิตย์</option>
      <option value="months">เดือน</option>
    </select>
    <button class="remove-btn">❌</button>
  `;
  div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
  listContainer.appendChild(div);
}



// ก่อนเริ่มกิจกรรม
const beforeStartList = document.getElementById('beforeStartList');
const addBeforeStart = document.getElementById('addBeforeStart');
addBeforeStart.addEventListener('click', () => createNotificationItem(beforeStartList));

// ก่อนจบกิจกรรม
const beforeEndList = document.getElementById('beforeEndList');
const addBeforeEnd = document.getElementById('addBeforeEnd');
addBeforeEnd.addEventListener('click', () => createNotificationItem(beforeEndList));

// เพิ่ม notification เริ่มต้น 1 อัน
createNotificationItem(beforeStartList);
createNotificationItem(beforeEndList);

const cancelNotificationBtn = document.getElementById('cancelNotificationSettings');

cancelNotificationBtn.addEventListener('click', () => {
  NotificationModal.classList.remove('active');
});

// --- Modal การเตือนซ้ำ ---
const repeatBtn = document.getElementById('RepeatLabel');
const repeatModal = document.getElementById('RepeatModal');
const closeRepeat = document.getElementById('closeRepeat');

repeatBtn.addEventListener('click', () => {
  repeatModal.classList.add('active');
});
closeRepeat.addEventListener('click', () => {
  repeatModal.classList.remove('active');
});


// --- การเตือนซ้ำ: ปุ่ม "ตลอดไป" ---
const repeatForever = document.getElementById('repeatForever');
const repeatEndDate = document.getElementById('repeatEndDate');

repeatForever.addEventListener('change', () => {
  if (repeatForever.checked) {
    repeatEndDate.disabled = true;
    repeatEndDate.value = ""; // ล้างค่าถ้ามี
  } else {
    repeatEndDate.disabled = false;
  }
});


// ====== จัดการปุ่มและ Modal ======
document.getElementById("addCategoryBtn").addEventListener("click", () => {
  document.getElementById("addCategoryModal").classList.add("active");
});

document.getElementById("closeAddCategoryModal").addEventListener("click", () => {
  document.getElementById("addCategoryModal").classList.remove("active");
});

document.getElementById("saveCategoryBtn").addEventListener("click", () => {
  const newCat = document.getElementById("newCategoryName").value.trim();
  addNewCategory(newCat);
  document.getElementById("newCategoryName").value = "";
});

// โหลดหมวดหมู่ทุกครั้งเมื่อเปิด modal เพิ่มกิจกรรม
document.getElementById("addDetailActivityModal").addEventListener("click", loadCategories);





// ========= ระบบหมวดหมู่ =========

// โหลดหมวดหมู่ทั้งหมดของผู้ใช้
async function loadCategories() {
  const user = auth.currentUser;


  try {
    const userRef = doc(db, "Users", user.uid);
    const subcollections = await getDoc(userRef);

    const select = document.getElementById("categorySelect");
    select.innerHTML = '<option value="">-- เลือกหมวดหมู่ --</option>';

    subcollections.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.id;
      select.appendChild(opt);
    });

    console.log("✅ โหลดหมวดหมู่สำเร็จ:", subcollections.map(c => c.id));
  } catch (err) {
    console.error("❌ โหลดหมวดหมู่ล้มเหลว:", err);
  }
}

async function sendactivitydata (category, text) {
  console.log("หมวดหมู่", category);
  console.log("ส่งข้อมูลกิจกรรม:", text);
  const user = auth.currentUser;
  // ส่งข้อมูลไปยังเซิร์ฟเวอร์หรือจัดการข้อมูลที่นี่
  try {
    // อ้างอิงไปที่ collection ของหมวดหมู่ใน Users/{uid}
    const categoryRef = collection(db, "Users", user.uid, category);

    // เพิ่มกิจกรรมใหม่ (Firestore จะสร้าง id อัตโนมัติ)
    await addDoc(categoryRef, {
      name: text,
      createdAt: new Date(),
    });

    console.log("✅ บันทึกกิจกรรมสำเร็จในหมวด:", category);
  } catch (err) {
    console.error("🔥 เกิดข้อผิดพลาดในการบันทึกกิจกรรม:", err);
  }
}




// document.getElementById("saveEventBtn").addEventListener("click", async () => {
//   const name = document.getElementById("eventTitle").value;
//   const note = document.getElementById("eventNotes").value;
//   const allday = document.getElementById("allDayToggle").checked;
//   const startDate = document.getElementById("startDate").value;
//   const endDate = document.getElementById("endDate").value;
//   const startTime = document.getElementById("startTime").value;
//   const endTime = document.getElementById("endTime").value;

//   const categoryName = document.getElementById("categorySelect").value;
//   if (!categoryName) {
//     alert("กรุณาเลือกหมวดหมู่ก่อนบันทึกกิจกรรม");
//     return;
//   }

//   const activityData = {
//     name,
//     note,
//     allday,
//     day: {
//       DayStart: { Date: startDate },
//       DayEnd: { Date: endDate }
//     },
//     time: allday
//       ? {}
//       : {
//           TimeStart: { Hour: +startTime.split(":")[0], Minute: +startTime.split(":")[1] },
//           TimeEnd: { Hour: +endTime.split(":")[0], Minute: +endTime.split(":")[1] }
//         },
//     notification: false,
//     loop: {},
//   };

//   await saveActivityToFirestore(activityData, categoryName);
// });






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

  document.getElementById('Notification').addEventListener('click', NotificationSettings);

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

// เริ่มทำงานหลัง DOM โหลดครบ
document.addEventListener("DOMContentLoaded", () => {
  init();

  // ทำให้เรียกใช้ได้จาก onclick ใน HTML
  window.selectMonthFromModal = selectMonthFromModal;
  window.selectYearFromModal = selectYearFromModal;

  document.querySelectorAll('input[type="time"]').forEach(input => {
    input.addEventListener('change', () => {
      // แปลงค่าเวลาให้เป็น 24 ชั่วโมง
      const [h, m] = input.value.split(':');
      const formatted = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
      input.value = formatted;
    });
  });

});
