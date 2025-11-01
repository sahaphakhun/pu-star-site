# แผนการย้ายข้อมูลจาก Jubili-clone ไปยัง Next.js Project

## ภาพรวม

เอกสารนี้อธิบายแผนการย้ายข้อมูลจากโปรเจ็กต์ jubili-clone (React + Vite) ไปยังโปรเจ็กต์ Next.js ปัจจุบัน

## 1. Mapping Layout และ Components

### 1.1 Layout Components

| Jubili-clone | Next.js | สถานะ | หมายเหตุ |
|-------------|---------|--------|-----------|
| `src/components/layout/MainLayout.jsx` | `src/components/layout/MainLayout.tsx` | ✅ มีแล้ว | ต้องปรับปรุงให้ตรงกับ design ใหม่ |
| `src/components/layout/Header.jsx` | `src/components/layout/Header.tsx` | ✅ มีแล้ว | ต้องเพิ่ม notification badges และ user profile |
| `src/components/layout/Sidebar.jsx` | `src/components/layout/Sidebar.tsx` | ✅ มีแล้ว | ต้องอัพเดท menu items ให้ตรงกับ jubili |
| `src/components/layout/MobileSidebar.jsx` | `src/components/layout/MobileSidebar.tsx` | ✅ มีแล้ว | ต้องอัพเดท menu items ให้ตรงกับ jubili |

### 1.2 UI Components

| Jubili-clone | Next.js | สถานะ | การดำเนินการ |
|-------------|---------|--------|--------------|
| `src/components/ui/button.jsx` | `src/components/ui/Button.tsx` | ✅ มีแล้ว | ต้อง migrate ไปใช้ class-variance-authority |
| `src/components/ui/card.jsx` | `src/components/ui/Card.tsx` | ✅ มีแล้ว | ต้องเพิ่ม CardHeader, CardContent, CardFooter |
| `src/components/ui/input.jsx` | `src/components/ui/Input.tsx` | ✅ มีแล้ว | ต้องอัพเดท styling |
| `src/components/ui/textarea.jsx` | `src/components/ui/Textarea.tsx` | ✅ มีแล้ว | ต้องอัพเดท styling |
| `src/components/ui/select.jsx` | `src/components/ui/Select.tsx` | ✅ มีแล้ว | ต้องอัพเดท styling |
| `src/components/ui/badge.jsx` | `src/components/ui/Badge.tsx` | ✅ มีแล้ว | ต้องอัพเดท styling |
| `src/components/ui/modal.jsx` | `src/components/ui/Modal.tsx` | ✅ มีแล้ว | ต้องอัพเดท styling |
| `src/components/ui/alert-dialog.jsx` | ❌ ไม่มี | ⚠️ ต้องสร้างใหม่ |
| `src/components/ui/table.jsx` | ❌ ไม่มี | ⚠️ ต้องสร้างใหม่ |
| `src/components/ui/tabs.jsx` | ❌ ไม่มี | ⚠️ ต้องสร้างใหม่ |
| `src/components/ui/accordion.jsx` | ❌ ไม่มี | ⚠️ ต้องสร้างใหม่ |
| `src/components/ui/dropdown-menu.jsx` | ❌ ไม่มี | ⚠️ ต้องสร้างใหม่ |
| `src/components/ui/calendar.jsx` | ❌ ไม่มี | ⚠️ ต้องสร้างใหม่ |
| `src/components/ui/pagination.jsx` | ❌ ไม่มี | ⚠️ ต้องสร้างใหม่ |

### 1.3 Business Components

| Jubili-clone | Next.js | สถานะ | การดำเนินการ |
|-------------|---------|--------|--------------|
| `src/components/CustomerForm.jsx` | `src/components/CustomerForm.tsx` | ✅ มีแล้ว | ต้องอัพเดท form fields |
| `src/components/CustomerFormNew.jsx` | ❌ ไม่มี | ⚠️ ต้อง migrate |
| `src/components/QuotationForm.jsx` | `src/components/QuotationForm.tsx` | ✅ มีแล้ว | ต้องอัพเดท form fields |
| `src/components/SalesOrderForm.jsx` | ❌ ไม่มี | ⚠️ ต้องสร้างใหม่ |

## 2. Dependencies ที่ต้องเพิ่ม

### 2.1 UI Libraries
```json
{
  "@hookform/resolvers": "^5.0.1",
  "@radix-ui/react-accordion": "^1.2.10",
  "@radix-ui/react-alert-dialog": "^1.1.13",
  "@radix-ui/react-aspect-ratio": "^1.1.6",
  "@radix-ui/react-avatar": "^1.1.9",
  "@radix-ui/react-checkbox": "^1.3.1",
  "@radix-ui/react-collapsible": "^1.1.10",
  "@radix-ui/react-context-menu": "^2.2.14",
  "@radix-ui/react-dialog": "^1.1.13",
  "@radix-ui/react-dropdown-menu": "^2.1.14",
  "@radix-ui/react-hover-card": "^1.1.13",
  "@radix-ui/react-label": "^2.1.6",
  "@radix-ui/react-menubar": "^1.1.14",
  "@radix-ui/react-navigation-menu": "^1.2.12",
  "@radix-ui/react-popover": "^1.1.13",
  "@radix-ui/react-progress": "^1.1.6",
  "@radix-ui/react-radio-group": "^1.3.6",
  "@radix-ui/react-scroll-area": "^1.2.8",
  "@radix-ui/react-select": "^2.2.4",
  "@radix-ui/react-separator": "^1.1.6",
  "@radix-ui/react-slider": "^1.3.4",
  "@radix-ui/react-slot": "^1.2.2",
  "@radix-ui/react-switch": "^1.2.4",
  "@radix-ui/react-tabs": "^1.1.11",
  "@radix-ui/react-toggle": "^1.1.8",
  "@radix-ui/react-toggle-group": "^1.1.9",
  "@radix-ui/react-tooltip": "^1.2.6",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "cmdk": "^1.1.1",
  "date-fns": "^4.1.0",
  "embla-carousel-react": "^8.6.0",
  "input-otp": "^1.4.2",
  "lucide-react": "^0.510.0",
  "next-themes": "^0.4.6",
  "react-day-picker": "8.10.1",
  "react-hook-form": "^7.56.3",
  "react-resizable-panels": "^3.0.2",
  "recharts": "^2.15.3",
  "sonner": "^2.0.3",
  "tailwind-merge": "^3.3.0",
  "tailwindcss-animate": "^1.0.7",
  "vaul": "^1.1.2"
}
```

### 2.2 การติดตั้ง
```bash
npm install @hookform/resolvers @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip class-variance-authority clsx cmdk date-fns embla-carousel-react input-otp lucide-react next-themes react-day-picker react-hook-form react-resizable-panels recharts sonner tailwind-merge tailwindcss-animate vaul
```

## 3. ลำดับความสำคัญของหน้าที่ต้องย้าย

### 3.1 Priority 1 (หน้าหลัก)
1. **Dashboard** (`/adminb2b/dashboard`)
   - มี KPI cards, charts, และ statistics
   - ต้อง migrate recharts components
   - ต้องอัพเดท layout ให้ตรงกับ design ใหม่

2. **Customers** (`/adminb2b/customers`)
   - มี table, search, filters
   - ต้อง migrate CustomerFormNew component
   - ต้องอัพเดท table styling

3. **Quotations** (`/adminb2b/quotations`)
   - มี table, status badges, form
   - ต้อง migrate QuotationForm component
   - ต้องอัพเดท status management

### 3.2 Priority 2 (หน้ารอง)
4. **Sales Orders** (`/adminb2b/sales-orders`)
   - ต้องสร้าง SalesOrderForm component
   - ต้องอัพเดท order management

5. **Activities** (`/adminb2b/activities`)
   - ต้องสร้าง activity timeline component
   - ต้องอัพเดท activity management

6. **Reports** (`/adminb2b/reports`)
   - ต้อง migrate recharts components
   - ต้องอัพเดท report generation

### 3.3 Priority 3 (หน้าเสริม)
7. **Projects** (`/adminb2b/projects`)
   - ต้องสร้าง project management components
   - ต้องอัพเดท project tracking

8. **Opportunities** (`/adminb2b/opportunities`)
   - ต้องสร้าง opportunity management components
   - ต้องอัพเดท sales pipeline

9. **Forecast** (`/adminb2b/forecast`)
   - ต้องสร้าง forecasting components
   - ต้องอัพเดท prediction models

10. **Settings** (`/adminb2b/settings`)
    - ต้องอัพเดท settings management
    - ต้องอัพเดท user preferences

## 4. Checklist สำหรับแต่ละหน้า

### 4.1 Dashboard
- [ ] Migrate KPI cards component
- [ ] Migrate recharts components (PieChart, LineChart, BarChart)
- [ ] Update header with filters and date range
- [ ] Migrate sales team table
- [ ] Migrate sales funnel visualization
- [ ] Migrate recent activity photos section
- [ ] Update responsive design
- [ ] Add loading states
- [ ] Add error handling

### 4.2 Customers
- [ ] Migrate CustomerFormNew component
- [ ] Update customer table with new styling
- [ ] Add customer statistics cards
- [ ] Migrate search and filter functionality
- [ ] Add customer type tabs
- [ ] Update customer detail view
- [ ] Add customer import/export functionality
- [ ] Update responsive design

### 4.3 Quotations
- [ ] Update QuotationForm component
- [ ] Migrate quotation table with status badges
- [ ] Add quotation statistics
- [ ] Update quotation status management
- [ ] Add quotation PDF generation
- [ ] Add quotation email functionality
- [ ] Update responsive design
- [ ] Add quotation templates

### 4.4 Sales Orders
- [ ] Create SalesOrderForm component
- [ ] Create sales order table
- [ ] Add order status management
- [ ] Add order tracking
- [ ] Add order fulfillment
- [ ] Add order reporting
- [ ] Update responsive design

### 4.5 Activities
- [ ] Create activity timeline component
- [ ] Create activity form
- [ ] Add activity filtering
- [ ] Add activity reporting
- [ ] Add activity reminders
- [ ] Update responsive design

### 4.6 Reports
- [ ] Migrate report charts
- [ ] Add report filters
- [ ] Add report export functionality
- [ ] Add custom report builder
- [ ] Update responsive design

## 5. ขั้นตอนการดำเนินการ

### 5.1 เตรียมการ
1. ติดตั้ง dependencies ทั้งหมด
2. อัพเดท Tailwind CSS configuration
3. สร้าง UI components ที่จำเป็น
4. อัพเดท layout components

### 5.2 Migration
1. เริ่มกับ Priority 1 pages
2. ทีละหน้าตาม checklist
3. ทดสอบแต่ละหน้าก่อนไปต่อ
4. อัพเดท API endpoints ถ้าจำเป็น

### 5.3 ทดสอบและปรับปรุง
1. ทดสอบ responsive design
2. ทดสอบ functionality ทั้งหมด
3. ปรับปรุง performance
4. แก้ไข bugs ที่พบ

## 6. หมายเหตุเพิ่มเติม

- ต้องพิจารณาการ migrate จาก React Router ไปยัง Next.js App Router
- ต้องอัพเดท state management จาก Context ไปยัง Server Components ถ้าเหมาะสม
- ต้องพิจารณาการใช้ Server Actions สำหรับ form submissions
- ต้องอัพเดท authentication flow ให้เข้ากับระบบปัจจุบัน