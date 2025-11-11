import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp({
  credential: admin.credential.cert("firebase-messaging-sw.js"), // key จาก Firebase Console
});

const db = getFirestore();

async function sendActivityNotification() {
  const snapshot = await db.collection("Activities").where("sent", "==", false).get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const message = {
      notification: {
        title: "📅 แจ้งเตือนกิจกรรม",
        body: data.message,
      },
      data: {
        activityId: doc.id,
        activityName: data.activity,
      },
      topic: "all", // หรือใช้ token แทน topic
    };

    // ✅ ดึง fcmToken ของผู้ใช้จาก Firestore
    const userTokens = [];
    const usersSnap = await db.collection("Users").get();
    usersSnap.forEach(u => {
      const tokens = u.data().fcmTokens || [];
      userTokens.push(...tokens);
    });

    // ส่งหาทุก token
    for (const token of userTokens) {
      await admin.messaging().send({ ...message, token });
      console.log("✅ ส่งแจ้งเตือนสำเร็จให้:", token);
    }

    // อัปเดตสถานะเป็น sent = true
    await db.collection("Activities").doc(doc.id).update({ sent: true });
  }
}

sendActivityNotification()
  .then(() => console.log("เสร็จสิ้น"))
  .catch(console.error);
