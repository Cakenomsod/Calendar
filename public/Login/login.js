import { auth, db } from '../src/firebase.js';
import { doc, setDoc, getDoc} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

localStorage.removeItem("loggedInUser");

// ปุ่มเข้าสู่ระบบด้วย Google
document.getElementById("googleLoginBtn").addEventListener("click", async () => {
  if (isInAppBrowser()) {
    alert("❌ ไม่สามารถเข้าสู่ระบบผ่านแอป LINE, Facebook หรือ Instagram ได้\n\n✅ กรุณาเปิดเว็บไซต์นี้ผ่าน Chrome หรือ Safari แล้วลองใหม่อีกครั้ง");
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // เรียกฟังก์ชันบันทึกอีเมล
    await saveUserData(user);

    // เก็บอีเมลไว้ใน localStorage (ถ้าต้องใช้ต่อ)
    localStorage.setItem("loggedInUser", user.email);

    alert("✅ เข้าสู่ระบบสำเร็จ!");
    // redirect ไปหน้า home.html หรือหน้าที่ต้องการ
    window.location.href = "../home.html";

  } catch (error) {
    console.error("Login failed:", error);
    alert("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
  }
}); 

// ตรวจว่าอยู่ใน in-app browser (LINE / FB / IG)
function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /FBAN|FBAV|Instagram|Line/i.test(ua);
}

if (isInAppBrowser()) {
  document.querySelector(".login").style.display = "none";
  document.getElementById("inAppBrowserBlock").style.display = "block";
}

// ฟังก์ชันบันทึกข้อมูลผู้ใช้ลง Firestore
async function saveUserData(user) {
  const uid = user.uid;
  const email = user.email;
  const userRef = doc(db, "Users", uid);

  try {
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        Email: email
      });
      console.log("สร้างผู้ใช้ใหม่สำเร็จ:", email);
    } else {
      console.log("ผู้ใช้นี้มีอยู่แล้ว:", email);
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้:", err);
  }
}
