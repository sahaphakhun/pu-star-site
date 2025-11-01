# Deployment Guide - Railway

คู่มือการ Deploy โปรเจกต์บน Railway

## 📋 ข้อกำหนดเบื้องต้น

- บัญชี Railway (https://railway.app)
- GitHub Repository (หรืออัพโหลดโปรเจกต์โดยตรง)
- MongoDB Database (สามารถใช้ MongoDB Atlas หรือ Railway MongoDB)

## 🚀 ขั้นตอนการ Deploy

### 1. เตรียมโปรเจกต์

```bash
# ตรวจสอบว่าไฟล์สำคัญครบ
- package.json
- next.config.js
- tsconfig.json
- .env.example (สำหรับอ้างอิง)
```

### 2. สร้าง Project บน Railway

1. ไปที่ https://railway.app
2. คลิก "New Project"
3. เลือก "Deploy from GitHub repo" หรือ "Empty Project"

### 3. เพิ่ม Service

#### Option A: Deploy จาก GitHub

1. เชื่อม GitHub Repository
2. เลือก Repository
3. Railway จะ detect Next.js โดยอัตโนมัติ

#### Option B: Deploy จาก Local

1. ติดตั้ง Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Link Project:
```bash
railway link
```

4. Deploy:
```bash
railway up
```

### 4. ตั้งค่า Environment Variables

ไปที่ Project → Variables → Add Variables:

```env
# Node
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Facebook
FB_PAGE_ACCESS_TOKEN=your_page_access_token
FB_APP_SECRET=your_app_secret
FB_VERIFY_TOKEN=your_verify_token
FB_PAGE_ID=your_page_id

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MAIN_MODEL=gpt-4.1

# Base URL (จะได้หลัง Deploy)
NEXT_PUBLIC_BASE_URL=https://your-app.railway.app

# NextAuth (สร้าง secret ใหม่)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app.railway.app

# JWT
JWT_SECRET=your_jwt_secret

# Cloudinary (ถ้าใช้)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. ตั้งค่า Build & Deploy

Railway จะใช้ค่าเริ่มต้นจาก `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT",
    "postbuild": "npx tsx src/scripts/migrate-conversations.ts"
  }
}
```

**หมายเหตุ:** `postbuild` จะรัน migration อัตโนมัติหลัง build เสร็จ

### 6. Deploy

1. คลิก "Deploy" หรือ push code ไปยัง GitHub
2. รอ Build & Deploy เสร็จ (ประมาณ 3-5 นาที)
3. ได้ URL: `https://your-app.railway.app`

### 7. อัพเดท Environment Variables

อัพเดท `NEXT_PUBLIC_BASE_URL` และ `NEXTAUTH_URL` ด้วย URL ที่ได้:

```env
NEXT_PUBLIC_BASE_URL=https://your-app.railway.app
NEXTAUTH_URL=https://your-app.railway.app
```

Redeploy หลังจากอัพเดท:
```bash
railway up
```

### 8. ตั้งค่า Facebook Webhook

1. ไปที่ Facebook App Dashboard
2. ไปที่ Webhooks
3. ตั้งค่า Callback URL:
   ```
   https://your-app.railway.app/api/messenger/webhook
   ```
4. ใส่ Verify Token (ตรงกับ `FB_VERIFY_TOKEN`)
5. Subscribe to Events:
   - ✅ messages
   - ✅ messaging_postbacks
   - ✅ feed
6. Subscribe Page

### 9. ทดสอบ

1. เข้า Admin Panel: `https://your-app.railway.app/admin`
2. Login ด้วย Admin Account
3. ไปที่ Facebook Automation
4. ทดสอบคอมเมนต์บน Facebook Page

## 🔧 การตั้งค่าเพิ่มเติม

### Custom Domain

1. ไปที่ Project → Settings → Domains
2. คลิก "Add Domain"
3. ใส่ Domain Name
4. ตั้งค่า DNS ตามที่ Railway แนะนำ
5. อัพเดท Environment Variables:
   ```env
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   NEXTAUTH_URL=https://your-domain.com
   ```

### MongoDB Atlas (แนะนำ)

1. สร้าง Cluster ที่ https://www.mongodb.com/cloud/atlas
2. สร้าง Database User
3. Whitelist IP: `0.0.0.0/0` (สำหรับ Railway)
4. คัดลอก Connection String
5. ใส่ใน `MONGODB_URI`

### Monitoring

Railway มี Monitoring ในตัว:
- ไปที่ Project → Metrics
- ดู CPU, Memory, Network usage
- ดู Logs แบบ Real-time

## 📊 การ Scale

### Vertical Scaling

1. ไปที่ Project → Settings
2. เลือก Plan ที่เหมาะสม:
   - **Hobby**: $5/month (512MB RAM)
   - **Pro**: $20/month (8GB RAM)

### Horizontal Scaling

Railway รองรับ Auto-scaling:
1. ไปที่ Service → Settings
2. เปิด "Auto-scaling"
3. ตั้งค่า Min/Max instances

## 🐛 Troubleshooting

### Build Failed

```bash
# ดู logs
railway logs

# ตรวจสอบ dependencies
npm install

# ลองบน local
npm run build
```

### Migration Failed

```bash
# รัน migration ด้วยตัวเอง
railway run npm run migrate:conversations

# ตรวจสอบ MongoDB connection
railway run node -e "console.log(process.env.MONGODB_URI)"
```

### Webhook ไม่ทำงาน

1. ตรวจสอบ Callback URL
2. ตรวจสอบ Verify Token
3. ดู logs:
   ```bash
   railway logs --filter="Webhook"
   ```

### AI ไม่ตอบ

1. ตรวจสอบ `OPENAI_API_KEY`
2. ตรวจสอบ OpenAI Credits
3. ดู logs:
   ```bash
   railway logs --filter="MessengerWorker"
   ```

## 📝 Maintenance

### อัพเดทโค้ด

```bash
# Push to GitHub (ถ้าใช้ GitHub)
git push origin main

# หรือใช้ Railway CLI
railway up
```

### Backup Database

```bash
# Export MongoDB
mongodump --uri="your_mongodb_uri" --out=backup

# Import MongoDB
mongorestore --uri="your_mongodb_uri" backup
```

### ดู Logs

```bash
# Real-time logs
railway logs

# Filter logs
railway logs --filter="error"

# Download logs
railway logs > logs.txt
```

## 💰 ค่าใช้จ่าย

### Railway Pricing

- **Hobby Plan**: $5/month
  - 512MB RAM
  - 1GB Disk
  - 100GB Bandwidth

- **Pro Plan**: $20/month
  - 8GB RAM
  - 100GB Disk
  - 100GB Bandwidth

### MongoDB Atlas Pricing

- **Free Tier**: $0/month
  - 512MB Storage
  - Shared RAM
  - เหมาะสำหรับทดสอบ

- **M10**: $57/month
  - 10GB Storage
  - 2GB RAM
  - เหมาะสำหรับ Production

### OpenAI Pricing

- **GPT-4**: ~$0.03/1K tokens
- **GPT-3.5**: ~$0.002/1K tokens

**ประมาณการ:**
- 1,000 ข้อความ/เดือน ≈ $30-50

## 🔐 Security Checklist

- ✅ ใช้ Environment Variables สำหรับ Secrets
- ✅ ตั้งค่า `NODE_ENV=production`
- ✅ ใช้ HTTPS (Railway ให้ฟรี)
- ✅ Whitelist IP สำหรับ MongoDB
- ✅ ตั้งค่า Rate Limiting
- ✅ ตรวจสอบ Facebook Webhook Signature
- ✅ ใช้ Strong Passwords สำหรับ Admin

## 📞 Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Facebook Developers: https://developers.facebook.com/support
- OpenAI Help: https://help.openai.com

## 🎉 เสร็จสิ้น!

ระบบของคุณพร้อมใช้งานแล้ว! 🚀

ทดสอบโดย:
1. คอมเมนต์ในโพสต์ Facebook
2. รอรับข้อความทาง Messenger
3. ตอบกลับ → AI จะตอบโดยเข้าใจบริบท

Happy Automating! 🤖✨

