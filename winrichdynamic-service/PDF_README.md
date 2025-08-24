# ระบบสร้าง PDF ใบเสนอราคา - WinRich Dynamic Service

## 🎯 ภาพรวม

ระบบสร้าง PDF ใบเสนอราคาที่รองรับภาษาไทยและมีดีไซน์ที่สวยงาม ใช้ Puppeteer ในการแปลง HTML เป็น PDF

## ✨ Features

### 🎨 การออกแบบ
- **Font ภาษาไทย**: ใช้ Sarabun font ที่รองรับภาษาไทยอย่างสมบูรณ์
- **ดีไซน์สวยงาม**: ใช้ gradient, shadow, และสีที่ทันสมัย
- **Responsive Layout**: รองรับการพิมพ์และแสดงผลบนหน้าจอ
- **Logo**: มีโลโก้บริษัทในรูปแบบ SVG

### 🌐 การรองรับภาษา
- **ภาษาไทย**: รองรับการแสดงผลภาษาไทยอย่างสมบูรณ์
- **การจัดรูปแบบวันที่**: แสดงวันที่ในรูปแบบภาษาไทย
- **การจัดรูปแบบเงิน**: แสดงราคาในรูปแบบสกุลเงินบาท

### 📄 โครงสร้าง PDF
1. **Header**: ชื่อบริษัทและโลโก้
2. **ข้อมูลบริษัทและลูกค้า**: แสดงข้อมูลทั้งสองฝ่าย
3. **รายละเอียดใบเสนอราคา**: เลขที่, วันที่สร้าง, วันหมดอายุ
4. **หัวข้อ**: หัวข้อของใบเสนอราคา
5. **ตารางรายการ**: แสดงสินค้าและบริการ
6. **สรุปราคา**: ราคารวม, ส่วนลด, ภาษี, ราคารวมทั้งสิ้น
7. **เงื่อนไข**: เงื่อนไขการชำระเงินและการส่งมอบ
8. **หมายเหตุ**: หมายเหตุเพิ่มเติม (ถ้ามี)
9. **ลายเซ็น**: พื้นที่สำหรับลายเซ็นลูกค้าและผู้เสนอราคา
10. **Footer**: ข้อมูลเพิ่มเติมและวันที่สร้าง

## 🚀 การใช้งาน

### API Endpoint
```
GET /api/quotations/[id]/pdf
```

### การเรียกใช้ใน Frontend
```typescript
const handleDownloadPDF = async (quotation: Quotation) => {
  try {
    const response = await fetch(`/api/quotations/${quotation._id}/pdf`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('เกิดข้อผิดพลาดในการสร้าง PDF')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ใบเสนอราคา_${quotation.quotationNumber}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast.success('ดาวน์โหลด PDF เรียบร้อยแล้ว')
  } catch (error) {
    console.error('Error downloading PDF:', error)
    toast.error('เกิดข้อผิดพลาดในการดาวน์โหลด PDF')
  }
}
```

## 🔧 การปรับแต่ง

### การเปลี่ยน Font
แก้ไขใน `src/utils/pdfUtils.ts`:
```typescript
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

body {
    font-family: 'Sarabun', 'Noto Sans Thai', 'Tahoma', sans-serif;
}
```

### การเปลี่ยนสี
แก้ไข CSS variables ใน `src/utils/pdfUtils.ts`:
```css
.header h1 {
    color: #1e40af; /* เปลี่ยนสีหัวข้อ */
}

.company-info {
    border-left: 5px solid #2563eb; /* เปลี่ยนสีขอบ */
}
```

### การเพิ่มโลโก้
แทนที่ SVG ใน `src/utils/pdfUtils.ts`:
```html
<img src="data:image/svg+xml;base64,YOUR_BASE64_LOGO" alt="Logo" class="logo">
```

## 📁 โครงสร้างไฟล์

```
src/
├── app/
│   └── api/
│       └── quotations/
│           └── [id]/
│               └── pdf/
│                   └── route.ts          # API endpoint
├── utils/
│   └── pdfUtils.ts                       # Utility functions
└── public/
    └── fonts/
        └── README.md                      # Font documentation
```

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Font ไม่แสดงผล**
   - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
   - เพิ่ม timeout สำหรับการโหลด font

2. **ภาษาไทยแสดงเป็นกล่อง**
   - ตรวจสอบ charset ใน HTML
   - ใช้ font ที่รองรับภาษาไทย

3. **PDF ไม่สร้าง**
   - ตรวจสอบ Puppeteer installation
   - ตรวจสอบ memory และ disk space

### การ Debug
```typescript
// เพิ่ม logging ใน pdfUtils.ts
console.log('Generating PDF for quotation:', quotation.quotationNumber);
console.log('HTML generated:', html.substring(0, 200) + '...');
```

## 🔒 Security

- ใช้ environment variables สำหรับ sensitive data
- ตรวจสอบสิทธิ์การเข้าถึงก่อนสร้าง PDF
- ไม่เปิดเผยข้อมูลภายในใน error messages

## 📊 Performance

- **Font Loading**: รอ 2 วินาทีให้ font โหลดเสร็จ
- **Memory Management**: ปิด browser หลังสร้าง PDF เสร็จ
- **Caching**: สามารถเพิ่ม caching สำหรับ PDF ที่สร้างแล้ว

## 🚀 การพัฒนาต่อ

### Features ที่สามารถเพิ่มได้
1. **Template System**: ระบบ template สำหรับ PDF หลายรูปแบบ
2. **Watermark**: เพิ่ม watermark บน PDF
3. **Digital Signature**: เพิ่มลายเซ็นดิจิทัล
4. **Batch Generation**: สร้าง PDF หลายไฟล์พร้อมกัน
5. **Custom Styling**: ระบบปรับแต่งสีและฟอนต์แบบ dynamic

### การเพิ่ม Template ใหม่
1. สร้างฟังก์ชันใหม่ใน `pdfUtils.ts`
2. เพิ่ม interface สำหรับข้อมูลใหม่
3. สร้าง HTML template ใหม่
4. เพิ่ม API endpoint ใหม่

---

## 📞 การติดต่อ

สำหรับปัญหาหรือคำถามเกี่ยวกับระบบ PDF กรุณาติดต่อทีมพัฒนา
