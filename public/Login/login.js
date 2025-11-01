import { auth, db, provider, signInWithPopup } from "../src/firebase.js";
import { doc, setDoc, getDoc} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

localStorage.removeItem("loggedInUser");

document.getElementById("googleLoginBtn").addEventListener("click", async () => {
  if (isInAppBrowser()) {
    alert("❌ ไม่สามารถเข้าสู่ระบบผ่านแอป LINE, Facebook หรือ Instagram ได้\n\n✅ กรุณาเปิดเว็บไซต์นี้ผ่าน Chrome หรือ Safari แล้วลองใหม่อีกครั้ง");
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // บันทึกผู้ใช้ใหม่หรืออัปเดตใน Firestore
    await saveUserData(user);

    // เก็บอีเมลไว้ใน localStorage
    localStorage.setItem("loggedInUser", user.email);

    alert("✅ เข้าสู่ระบบสำเร็จ!");
    window.location.href = "https://calendarproject-f570e.web.app/";

  } catch (error) {
    console.error("Login failed:", error);
    alert("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่\n\n" + error.message);
  }
});

function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /FBAN|FBAV|Instagram|Line/i.test(ua);
}

if (isInAppBrowser()) {
  document.querySelector(".login").style.display = "none";
  document.getElementById("inAppBrowserBlock").style.display = "block";
}

// ⛅ ฟังก์ชันบันทึกข้อมูลผู้ใช้
async function saveUserData(user) {
  const uid = user.uid;
  const email = user.email;
  const userRef = doc(db, "Users", uid);

  try {
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, { Email: email });

      // ✅ สร้าง document ย่อย Normal/00
      const normalRef = doc(db, "Users", uid, "Normal", "00");
      await setDoc(normalRef, { createdAt: new Date()});

      console.log("✅ สร้างผู้ใช้ใหม่สำเร็จ:", email);
    } else {
      console.log("ℹ️ ผู้ใช้นี้มีอยู่แล้ว:", email);
    }
  } catch (err) {
    console.error("🔥 เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้:", err);
  }
}

