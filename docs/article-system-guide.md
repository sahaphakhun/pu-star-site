# คู่มือระบบบทความ PU STAR

## ภาพรวมระบบ

ระบบบทความ PU STAR เป็นระบบการจัดการเนื้อหาที่ทันสมัยและครบถ้วน ออกแบบมาเพื่อรองรับการใช้งานบน Railway deployment พร้อมฟีเจอร์ขั้นสูงสำหรับ SEO และประสิทธิภาพ

## ฟีเจอร์หลัก

### 1. ระบบแท็ก (Tag System)
- **แทนที่ระบบหมวดหมู่**: ใช้แท็กแทนหมวดหมู่เพื่อความยืดหยุ่น
- **หลายแท็กต่อบทความ**: สามารถติดแท็กได้หลายอันในบทความเดียว
- **การจัดการแท็ก**: สร้าง แก้ไข และลบแท็กผ่านระบบแอดมิน
- **แท็กยอดนิยม**: แสดงแท็กที่มีบทความมากที่สุด

### 2. Rich Text Editor ขั้นสูง
- **การจัดรูปแบบข้อความ**: ขนาดฟอนต์ น้ำหนักฟอนต์ สีข้อความ และสีพื้นหลัง
- **การจัดตำแหน่ง**: ซ้าย กลาง ขวา
- **รูปภาพ**: อัปโหลด ปรับขนาด และจัดตำแหน่งรูปภาพ
- **เนื้อหาหลากหลาย**: ข้อความ หัวข้อ รูปภาพ คำพูด รายการ และเส้นแบ่ง
- **Drag & Drop**: จัดเรียงเนื้อหาด้วยการลาก
- **Preview**: ดูตัวอย่างแบบ real-time

### 3. ระบบ SEO เต็มรูปแบบ
- **Meta Tags**: Title, Description, Keywords
- **Open Graph**: Facebook, Twitter Cards
- **Structured Data**: JSON-LD สำหรับ Google
- **Sitemap**: สร้างอัตโนมัติ
- **Robots.txt**: กำหนดค่าการ crawl
- **Canonical URLs**: ป้องกัน duplicate content

### 4. ระบบแอดมิน
- **UI ทันสมัย**: ใช้งานง่าย responsive design
- **การจัดการสิทธิ์**: ควบคุมการเข้าถึงแต่ละฟีเจอร์
- **Preview**: ดูตัวอย่างก่อนเผยแพร่
- **กำหนดเวลาเผยแพร่**: Schedule publishing
- **การจัดการแท็ก**: สร้างและแก้ไขแท็ก

### 5. ฟีเจอร์ขั้นสูง
- **บทความที่เกี่ยวข้อง**: แนะนำบทความจากแท็กเดียวกัน
- **เวลาอ่าน**: คำนวณอัตโนมัติจากเนื้อหา
- **Social Sharing**: แชร์ Facebook, Twitter, LINE, LinkedIn
- **Print-friendly**: เวอร์ชันสำหรับพิมพ์
- **Reading Progress**: แสดงความคืบหน้าการอ่าน

### 6. การปรับแต่งประสิทธิภาพ
- **Image Optimization**: WebP, AVIF formats
- **Lazy Loading**: โหลดรูปภาพเมื่อต้องการ
- **Caching**: Cache API responses และ static assets
- **Compression**: บีบอัดไฟล์เพื่อลดขนาด
- **Railway Optimization**: ปรับแต่งสำหรับ Railway deployment

## โครงสร้างไฟล์

```
src/
├── app/
│   ├── articles/
│   │   ├── page.tsx                 # หน้ารวมบทความ
│   │   └── [slug]/
│   │       └── page.tsx             # หน้าบทความแต่ละหน้า
│   ├── api/
│   │   ├── articles/
│   │   │   ├── route.ts             # API บทความสาธารณะ
│   │   │   └── [slug]/route.ts      # API บทความแต่ละหน้า
│   │   ├── admin/
│   │   │   ├── articles/route.ts    # API แอดมินบทความ
│   │   │   └── tags/route.ts        # API แอดมินแท็ก
│   │   └── tags/route.ts            # API แท็กสาธารณะ
│   ├── sitemap.xml/route.ts         # Sitemap XML
│   └── robots.txt/route.ts          # Robots.txt
├── components/
│   ├── AdvancedRichTextEditor.tsx   # Rich Text Editor
│   ├── OptimizedImage.tsx           # Image component
│   ├── StructuredData.tsx           # SEO structured data
│   ├── SocialShare.tsx              # Social sharing
│   └── RelatedArticles.tsx          # บทความที่เกี่ยวข้อง
├── models/
│   ├── Article.ts                   # โมเดลบทความ
│   └── Tag.ts                       # โมเดลแท็ก
└── utils/
    └── imageOptimization.ts         # Image optimization utilities
```

## การใช้งาน

### สำหรับผู้ดูแลระบบ

#### การสร้างบทความใหม่
1. เข้าไปที่ `/admin/articles/create`
2. กรอกข้อมูลพื้นฐาน (ชื่อ, slug, คำอธิบาย)
3. เลือกแท็กหรือสร้างแท็กใหม่
4. ใช้ Rich Text Editor สร้างเนื้อหา
5. ตั้งค่า SEO
6. เลือกสถานะ (แบบร่าง/เผยแพร่)
7. บันทึก

#### การจัดการแท็ก
1. เข้าไปที่ `/admin/tags`
2. ดูรายการแท็กทั้งหมด
3. สร้างแท็กใหม่หรือแก้ไขแท็กที่มีอยู่
4. กำหนดสี และคำอธิบายแท็ก

### สำหรับผู้ใช้ทั่วไป

#### การอ่านบทความ
1. เข้าไปที่ `/articles` เพื่อดูรายการบทความ
2. ใช้ระบบค้นหาหรือกรองตามแท็ก
3. คลิกบทความที่สนใจ
4. อ่านเนื้อหาพร้อมฟีเจอร์เสริม:
   - แชร์ social media
   - ดูความคืบหน้าการอ่าน
   - พิมพ์บทความ
   - ดูบทความที่เกี่ยวข้อง

## การกำหนดค่า

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://...

# Base URL
NEXT_PUBLIC_BASE_URL=https://www.winrichdynamic.com

# Image Upload (ถ้าใช้ Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Railway Deployment
1. ตั้งค่า environment variables ใน Railway dashboard
2. ระบบจะ deploy อัตโนมัติจาก `railway.json`
3. ตรวจสอบ health check ที่ `/api/ping`

## การปรับแต่งประสิทธิภาพ

### Image Optimization
- ใช้ WebP/AVIF formats
- Responsive images
- Lazy loading
- Compression

### Caching Strategy
- Static assets: 1 year
- Articles: 1 hour
- API responses: 5 minutes

### SEO Optimization
- Automatic sitemap generation
- Structured data
- Meta tags optimization
- Social media cards

## การบำรุงรักษา

### การสำรองข้อมูล
- สำรองฐานข้อมูล MongoDB เป็นประจำ
- สำรองไฟล์รูปภาพ

### การตรวจสอบประสิทธิภาพ
- ใช้ Google PageSpeed Insights
- ตรวจสอบ Core Web Vitals
- Monitor Railway metrics

### การอัปเดต
- อัปเดต dependencies เป็นประจำ
- ตรวจสอบ security vulnerabilities
- ทดสอบฟีเจอร์ใหม่ใน staging environment

## การแก้ไขปัญหา

### ปัญหาทั่วไป
1. **รูปภาพโหลดช้า**: ตรวจสอบการตั้งค่า image optimization
2. **SEO ไม่แสดงผล**: ตรวจสอบ meta tags และ structured data
3. **แท็กไม่แสดง**: ตรวจสอบการเชื่อมต่อฐานข้อมูล
4. **Rich Text Editor ไม่ทำงาน**: ตรวจสอบ JavaScript errors

### Logs และ Debugging
- ตรวจสอบ Railway logs
- ใช้ browser developer tools
- ตรวจสอบ API responses

## การพัฒนาเพิ่มเติม

### ฟีเจอร์ที่สามารถเพิ่ม
- ระบบ comment
- การ vote/like บทความ
- Newsletter subscription
- Advanced search
- Multi-language support

### การขยายระบบ
- CDN integration
- Full-text search
- Analytics integration
- A/B testing

---

สำหรับข้อมูลเพิ่มเติมหรือการสนับสนุน กรุณาติดต่อทีมพัฒนา