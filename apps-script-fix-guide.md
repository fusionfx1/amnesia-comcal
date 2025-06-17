# 🔧 แก้ไขปัญหา Google Sign-in

## ปัญหาที่พบ:
เมื่อเข้า Web App URL แล้วขึ้นหน้า Google Sign-in แทนที่จะทำงานได้เลย

## วิธีแก้ไข:

### วิธีที่ 1: เปลี่ยนการตั้งค่า Access (แนะนำ)

1. **เปิด Google Apps Script**
   - ไปที่ [script.google.com](https://script.google.com)
   - เปิดโปรเจกต์ "AMNESIA Commission Calculator API"

2. **Deploy ใหม่**
   - คลิก **Deploy** > **Manage deployments**
   - คลิกไอคอน ✏️ (Edit) ข้างๆ deployment ปัจจุบัน
   - เปลี่ยน **"Who has access"** เป็น **"Anyone"**
   - คลิก **Deploy**

3. **ทดสอบ URL ใหม่**
   - คัดลอก Web App URL ใหม่ที่ได้
   - ทดสอบเปิดใน browser ใหม่

### วิธีที่ 2: Sign in ก่อนใช้งาน

1. **Sign in ด้วย Google Account**
   - ใช้ Google Account เดียวกับที่สร้าง Apps Script
   - Sign in ในหน้าที่ขึ้นมา

2. **อนุญาตการเข้าถึง**
   - คลิก "Allow" เมื่อระบบขออนุญาต
   - Web App จะทำงานได้หลังจากนั้น

### วิธีที่ 3: ตรวจสอบการตั้งค่า

\`\`\`javascript
// ใน Apps Script ตรวจสอบว่ามีฟังก์ชันนี้
function doGet(e) {
  // ต้องมีฟังก์ชันนี้เพื่อรับ GET requests
  return ContentService.createTextOutput("API is working!");
}

function doPost(e) {
  // ต้องมีฟังก์ชันนี้เพื่อรับ POST requests
  return ContentService.createTextOutput("API is working!");
}
\`\`\`

## ✅ การทดสอบว่าใช้งานได้:

1. **ทดสอบ GET request:**
   \`\`\`
   https://script.google.com/macros/s/AKfycbw7k9tkaJ0rGDWgK9IstGTfLXqZYSY6-aAMQ-wQIf3gVPfQ2W02W52QzNldebBnLbYV/exec?action=load
   \`\`\`

2. **ควรได้ผลลัพธ์:** JSON response หรือข้อความ แทนหน้า Sign-in

3. **ถ้ายังขึ้น Sign-in:** ให้ทำตามวิธีที่ 1 (เปลี่ยน Access เป็น "Anyone")

## 🔒 ข้อควรระวัง:

- **"Anyone"** = ใครก็เข้าถึงได้ (ไม่ปลอดภัยมาก)
- **"Anyone with Google account"** = ต้อง Sign in Google ก่อน (ปลอดภัยกว่า)
- **"Only myself"** = เฉพาะเจ้าของเท่านั้น (ปลอดภัยที่สุด)

สำหรับการใช้งานภายในทีม แนะนำใช้ "Anyone with Google account"
