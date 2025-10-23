import { auth, provider } from '../src/firebase.js';
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

localStorage.removeItem("loggedInUser");

document.getElementById("googleLoginBtn").addEventListener("click", async () => {
  if (isInAppBrowser()) {
    alert("❌ ไม่สามารถเข้าสู่ระบบผ่านแอป LINE, Facebook หรือ Instagram ได้\n\n✅ กรุณาเปิดเว็บไซต์นี้ผ่าน Chrome หรือ Safari แล้วลองใหม่อีกครั้ง");
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    datausers(user.email);
  } catch (error) {
    console.error("Login failed:", error);
    alert("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
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