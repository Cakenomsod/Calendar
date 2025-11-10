import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
admin.initializeApp();
const db = admin.firestore();

// 🔹 รันทุกนาทีเพื่อตรวจสอบว่าแจ้งเตือนใดถึงเวลาแล้ว
export const sendScheduledNotifications = onSchedule("* * * * *", async () => {
  const now = admin.firestore.Timestamp.now();

  // 🔍 หาการแจ้งเตือนที่ถึงเวลาแล้ว แต่ยังไม่ส่ง
  const snapshot = await db.collectionGroup("Notifications")
    .where("scheduledTime", "<=", now)
    .where("sent", "==", false)
    .get();

  if (snapshot.empty) {
    console.log("⏰ ไม่มีการแจ้งเตือนที่ถึงเวลาในตอนนี้");
    return null;
  }

  console.log(`📢 พบ ${snapshot.size} รายการที่ต้องแจ้งเตือน`);

  const promises = snapshot.docs.map(async docSnap => {
    const data = docSnap.data();
    const userId = docSnap.ref.parent.parent.id; // ดึง uid จาก path
    const userRef = db.collection("Users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return;

    const tokens = userDoc.data().fcmTokens || [];
    if (tokens.length === 0) return;

    const message = {
      notification: {
        title: data.activityName || "การแจ้งเตือนกิจกรรม",
        body: data.message || "คุณมีกิจกรรมใหม่ที่กำลังจะถึงเวลา!",
      },
      tokens: tokens,
      data: {
        activityId: data.activityId,
        type: data.type || "general",
      }
    };

    try {
      await admin.messaging().sendMulticast(message);
      console.log(`✅ ส่งแจ้งเตือนให้ ${userId} แล้ว: ${data.activityName}`);

      // อัปเดตสถานะ
      await docSnap.ref.update({ sent: true });
    } catch (err) {
      console.error(`❌ ส่งแจ้งเตือนล้มเหลวสำหรับ ${userId}:`, err);
    }
  });

  await Promise.all(promises);
  console.log("🎯 จบการทำงานรอบนี้");
});
