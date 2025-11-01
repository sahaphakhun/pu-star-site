// Mock Data สำหรับระบบ Winrich CRM

export const mockCustomers = [
  {
    id: 1,
    name: "ร้านจึงเจริญอลูมินั่ม",
    code: "C001",
    type: "prospect",
    taxId: "0123456789012",
    tags: ["บริษัทจำหน่ายวัสดุก่อสร้าง-ฮาร์ดแวร์", "อะคริลิก Tiger", "ภาคอีสาน", "PU Foam"],
    contacts: [
      { name: "คุณอิฐ", position: "เจ้าของ", phone: "0867820555", email: "ith@example.com", lineId: "" }
    ],
    importance: 3,
    owner: "Saletrades 1 Kitti",
    team: "Trade Sales Team",
    lastActivity: "2025-10-06",
    address: "123 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900",
    province: "กรุงเทพมหานคร",
    district: "จตุจักร",
    subdistrict: "ลาดยาว",
    zipcode: "10900"
  },
  {
    id: 2,
    name: "บริษัท มิตรภาพโลหะ-กระจก จำกัด",
    code: "C002",
    type: "prospect",
    taxId: "0123456789013",
    tags: ["PU40 MS", "PU Foam", "PU40 มีกรด", "อะคริลิก Tiger"],
    contacts: [
      { name: "พี่แป๋ว", position: "ผู้จัดการ", phone: "0815495008", email: "paew@example.com", lineId: "" }
    ],
    importance: 4,
    owner: "Saletrades 1 Kitti",
    team: "Trade Sales Team",
    lastActivity: "2025-10-06",
    address: "456 ถนนรามอินทรา แขวงท่าแร้ง เขตบางเขน กรุงเทพมหานคร 10220",
    province: "กรุงเทพมหานคร",
    district: "บางเขน",
    subdistrict: "ท่าแร้ง",
    zipcode: "10220"
  },
  {
    id: 3,
    name: "บริษัท พงษ์พรรณธารา จำกัด",
    code: "C003",
    type: "customer",
    taxId: "0123456789014",
    tags: ["PU Foam", "Silicone"],
    contacts: [
      { name: "ณรงค์เดช", position: "ผู้จัดการฝ่ายจัดซื้อ", phone: "0891256092", email: "narongdet@example.com", lineId: "" }
    ],
    importance: 5,
    owner: "PU STAR",
    team: "PU STAR Office",
    lastActivity: "2025-10-07",
    address: "789 ถนนศรีนครินทร์ แขวงหนองบอน เขตประเวศ กรุงเทพมหานคร 10250",
    province: "กรุงเทพมหานคร",
    district: "ประเวศ",
    subdistrict: "หนองบอน",
    zipcode: "10250"
  }
];

export const mockProjects = [
  {
    id: 1,
    code: "PJ#251005-0001",
    name: "Iconic Ram-Romklao",
    type: "หอพัก / คอนโดมิเนียม / ที่พักอาศัยแนวสูง",
    customer: "บริษัท ต่อเงิน ต่อทอง แอสเซท จำกัด",
    customerId: 1,
    tags: ["Project Sales"],
    importance: 1,
    quotationCount: 0,
    activityCount: 1,
    startDate: "2025-10-05",
    endDate: "2025-10-05",
    value: 0,
    owner: "Saleprojects 1",
    status: 1
  },
  {
    id: 2,
    code: "PJ#250925-0001",
    name: "The Modeva Bang Toa",
    type: "หอพัก / คอนโดมิเนียม / ที่พักอาศัยแนวสูง",
    customer: "บริษัท ร่มโพธิ์ พร็อพเพอร์ตี้ จำกัด (มหาชน)",
    customerId: 2,
    tags: ["Project Sales"],
    importance: 2,
    quotationCount: 0,
    activityCount: 1,
    startDate: "2025-09-25",
    endDate: "2025-09-25",
    value: 34968131,
    owner: "saleprojects 2",
    status: 2
  },
  {
    id: 3,
    code: "PJ#251001-0003",
    name: "The Grand Residence Sukhumvit",
    type: "หอพัก / คอนโดมิเนียม / ที่พักอาศัยแนวสูง",
    customer: "บริษัท แกรนด์ พร็อพเพอร์ตี้ จำกัด",
    customerId: 3,
    tags: ["Project Sales", "VIP"],
    importance: 5,
    quotationCount: 2,
    activityCount: 5,
    startDate: "2025-10-01",
    endDate: "2025-12-31",
    value: 125000000,
    owner: "Saleprojects 3",
    status: 3
  },
  {
    id: 4,
    code: "PJ#250920-0004",
    name: "Lumpini Park Riverside",
    type: "หอพัก / คอนโดมิเนียม / ที่พักอาศัยแนวสูง",
    customer: "บริษัท ลุมพินี พร็อพเพอร์ตี้ จำกัด (มหาชน)",
    customerId: 4,
    tags: ["Project Sales"],
    importance: 4,
    quotationCount: 1,
    activityCount: 3,
    startDate: "2025-09-20",
    endDate: "2025-11-30",
    value: 89500000,
    owner: "Saleprojects 1",
    status: 2
  },
  {
    id: 5,
    code: "PJ#250915-0005",
    name: "Noble Ploenchit",
    type: "หอพัก / คอนโดมิเนียม / ที่พักอาศัยแนวสูง",
    customer: "บริษัท โนเบิล ดีเวลลอปเมนท์ จำกัด (มหาชน)",
    customerId: 5,
    tags: ["Project Sales", "Premium"],
    importance: 5,
    quotationCount: 3,
    activityCount: 8,
    startDate: "2025-09-15",
    endDate: "2026-03-31",
    value: 250000000,
    owner: "Saleprojects 2",
    status: 3
  },
  {
    id: 6,
    code: "PJ#250910-0006",
    name: "Supalai Park Kaset",
    type: "หอพัก / คอนโดมิเนียม / ที่พักอาศัยแนวสูง",
    customer: "บริษัท ศุภาลัย จำกัด (มหาชน)",
    customerId: 6,
    tags: ["Project Sales"],
    importance: 3,
    quotationCount: 1,
    activityCount: 2,
    startDate: "2025-09-10",
    endDate: "2025-10-31",
    value: 45000000,
    owner: "Saleprojects 3",
    status: 1
  }
];

export const mockOpportunities = [
  {
    id: 1,
    code: "LD#251007-0002",
    customer: "บริษัท พงษ์พรรณธารา จำกัด (สำนักงานใหญ่)",
    customerId: 3,
    contact: "ณรงค์เดช",
    phone: "0891256092",
    owner: "PU STAR",
    importance: 5,
    products: ["1.ฟิล์มกันรอยกระจก สีฟ้า หนา 38 ไมครอน ขนาด 1.20X200 เมตร"],
    date: "2025-10-07",
    value: 45000,
    status: "new",
    likes: 3
  },
  {
    id: 2,
    code: "LD#251006-0003",
    customer: "ช่างยาว เอพี",
    customerId: 1,
    contact: "ช่างยาว",
    phone: "0614253188",
    owner: "Saletrades 1 Kitti",
    importance: 1,
    products: ["1.Tiger Acylic Sealant สีขาว 300ml"],
    date: "2025-10-06",
    value: 12500,
    status: "contacted",
    likes: 1
  },
  {
    id: 3,
    code: "LD#251005-0001",
    customer: "บริษัท มิตรภาพโลหะ-กระจก จำกัด",
    customerId: 2,
    contact: "พี่แป๋ว",
    phone: "0815495008",
    owner: "Saletrades 1 Kitti",
    importance: 4,
    products: ["1.PU40 MS sealant", "2.PU Foam"],
    date: "2025-10-05",
    value: 85000,
    status: "quotation_sent",
    likes: 5
  },
  {
    id: 4,
    code: "LD#251004-0005",
    customer: "ร้านจึงเจริญอลูมินั่ม",
    customerId: 1,
    contact: "คุณอิฐ",
    phone: "0867820555",
    owner: "Saletrades 1 Kitti",
    importance: 3,
    products: ["1.อะคริลิก Tiger สีขาว", "2.PU Foam"],
    date: "2025-10-04",
    value: 32000,
    status: "negotiating",
    likes: 2
  },
  {
    id: 5,
    code: "LD#251003-0008",
    customer: "บริษัท สยามกระจก จำกัด",
    customerId: 4,
    contact: "คุณสมชาย",
    phone: "0812345678",
    owner: "PU STAR",
    importance: 5,
    products: ["1.ฟิล์มกันรอยกระจก", "2.Silicone Sealant"],
    date: "2025-10-03",
    value: 125000,
    status: "won",
    likes: 8
  },
  {
    id: 6,
    code: "LD#251002-0012",
    customer: "ห้างหุ้นส่วนจำกัด บิ๊กซีเมนท์",
    customerId: 5,
    contact: "คุณวิชัย",
    phone: "0898765432",
    owner: "Saletrades 1 Kitti",
    importance: 2,
    products: ["1.PU40 MS sealant ขนาด 600ML"],
    date: "2025-10-02",
    value: 18000,
    status: "lost",
    likes: 0
  }
];

export const mockQuotations = [
  {
    id: 1,
    code: "Q#251007-0004",
    customer: "บริษัท พงษ์พรรณธารา จำกัด",
    customerId: 3,
    contact: "ณรงค์เดช",
    phone: "0891256092",
    email: "narongdet@example.com",
    project: null,
    poCustomer: "",
    poPurchase: "",
    paymentType: "เครดิต 30 วัน",
    paymentMethod: "เงินโอน",
    issueDate: "2025-10-07",
    owner: "PU STAR",
    team: "PU STAR Office",
    status: "pending_approval",
    items: [
      {
        id: 1,
        code: "FILM-001",
        name: "ฟิล์มกันรอยกระจก สีฟ้า หนา 38 ไมครอน ขนาด 1.20X200 เมตร",
        quantity: 5,
        unit: "ม้วน",
        pricePerUnit: 2500,
        discount: 0,
        total: 12500
      },
      {
        id: 2,
        code: "PU-001",
        name: "PU40 MS sealant ขนาด 600ML/900G สีขาว (บรรจุ 20 เส้น/ลัง)",
        quantity: 10,
        unit: "ลัง",
        pricePerUnit: 1800,
        discount: 5,
        total: 17100
      }
    ],
    subtotal: 29600,
    discount: 0,
    afterDiscount: 29600,
    vat: 2072,
    total: 31672,
    deliveryMethod: "จัดส่ง",
    deliveryDate: "2025-10-10",
    deliveryAddress: "789 ถนนศรีนครินทร์ แขวงหนองบอน เขตประเวศ กรุงเทพมหานคร 10250",
    notes: "",
    timeline: [
      { date: "2025-10-07 09:30", action: "สร้างใบเสนอราคา", user: "PU STAR" },
      { date: "2025-10-07 10:15", action: "ส่งขออนุมัติ", user: "PU STAR" }
    ]
  },
  {
    id: 2,
    code: "Q#251007-0003",
    customer: "บริษัท เจเค อลูเทค จำกัด",
    customerId: 2,
    contact: "คุณ เทิดพงศ์ วงษาญาณ (Bee)",
    phone: "0818818544",
    email: "bee@example.com",
    project: null,
    poCustomer: "",
    poPurchase: "",
    paymentType: "เครดิต 30 วัน",
    paymentMethod: "เงินโอน",
    issueDate: "2025-10-07",
    owner: "PU STAR",
    team: "PU STAR Office",
    status: "approved",
    items: [
      {
        id: 1,
        code: "TIGER-001",
        name: "Tiger Acylic Sealant สีขาว 300ml",
        quantity: 50,
        unit: "หลอด",
        pricePerUnit: 45,
        discount: 0,
        total: 2250
      }
    ],
    subtotal: 2250,
    discount: 0,
    afterDiscount: 2250,
    vat: 157.5,
    total: 2407.5,
    deliveryMethod: "รับเอง",
    deliveryDate: "2025-10-08",
    deliveryAddress: "",
    notes: "",
    timeline: [
      { date: "2025-10-07 06:52", action: "สร้างใบเสนอราคา", user: "PU STAR" },
      { date: "2025-10-07 08:30", action: "ส่งขออนุมัติ", user: "PU STAR" },
      { date: "2025-10-07 09:00", action: "อนุมัติ", user: "Manager" }
    ]
  }
];

export const mockSalesOrders = [
  {
    id: 1,
    salesOrderNumber: "SO#251007-0003",
    quotationCode: "Q#251007-0003",
    customerName: "บริษัท พงษ์พรรณธารา จำกัด",
    customerId: 3,
    projectName: "โครงการคอนโด The Modeva",
    contact: "มัท",
    phone: "0891256092",
    email: "",
    poCustomer: "",
    poPurchase: "",
    paymentTerms: "เครดิต 30 วัน",
    paymentMethod: "เงินโอน",
    orderDate: "2025-10-07",
    deliveryDate: "2025-10-15",
    dueDate: "2025-11-06",
    owner: "PU STAR",
    team: "PU STAR Office",
    importance: 4,
    status: "confirmed",
    deliveryStatus: "preparing",
    paymentStatus: "unpaid",
    items: [
      {
        id: 1,
        code: "PU-001",
        name: "PU40 MS sealant ขนาด 600ML/900G สีขาว",
        quantity: 20,
        unit: "เส้น",
        pricePerUnit: 90,
        discount: 0,
        total: 1800
      },
      {
        id: 2,
        code: "TIGER-002",
        name: "Tiger Acylic Sealant สีเทา 300ml",
        quantity: 100,
        unit: "หลอด",
        pricePerUnit: 48,
        discount: 0,
        total: 4800
      }
    ],
    subtotal: 6600,
    discount: 0,
    afterDiscount: 6600,
    vat: 462,
    total: 7062,
    paidAmount: 0,
    remainingAmount: 7062,
    cost: 0,
    profit: 100,
    deliveryMethod: "จัดส่ง",
    deliveryAddress: "60/323 ซอยประเสริฐบุญทิ้ง 27 แขวงประเสริฐบุญทิ้ง แขวงจรเข้บัว เขตลาดพร้าว กรุงเทพมหานคร 10230",
    country: "Thailand (ไทย)",
    province: "Bangkok (กรุงเทพมหานคร)",
    district: "Lat Phrao (ลาดพร้าว)",
    trackingNumber: "",
    notes: ""
  },
  {
    id: 2,
    salesOrderNumber: "SO#251006-0003",
    quotationCode: "Q#251006-0002",
    customerName: "ช่างยาว เอพี",
    customerId: 1,
    projectName: null,
    contact: "ช่างยาว",
    phone: "0614253188",
    email: "",
    poCustomer: "",
    poPurchase: "",
    paymentTerms: "เงินสด",
    paymentMethod: "เงินสด",
    orderDate: "2025-10-06",
    deliveryDate: "2025-10-06",
    dueDate: "2025-10-06",
    owner: "Saletrades 1 Kitti",
    team: "Trade Sales Team",
    importance: 3,
    status: "completed",
    deliveryStatus: "delivered",
    paymentStatus: "paid",
    items: [
      {
        id: 1,
        code: "TIGER-001",
        name: "Tiger Acylic Sealant สีขาว 300ml",
        quantity: 24,
        unit: "หลอด",
        pricePerUnit: 45,
        discount: 0,
        total: 1080
      }
    ],
    subtotal: 1080,
    discount: 0,
    afterDiscount: 1080,
    vat: 75.6,
    total: 1155.6,
    paidAmount: 1155.6,
    remainingAmount: 0,
    cost: 800,
    profit: 35,
    deliveryMethod: "รับเอง",
    deliveryAddress: "",
    country: "Thailand (ไทย)",
    province: "",
    district: "",
    trackingNumber: "TH123456789",
    notes: "ลูกค้ามารับเองที่โกดัง"
  },
  {
    id: 3,
    salesOrderNumber: "SO#251005-0012",
    quotationCode: "Q#251005-0008",
    customerName: "บริษัท มิตรภาพโลหะ-กระจก จำกัด",
    customerId: 2,
    projectName: "โครงการอาคารสำนักงาน Central Tower",
    contact: "พี่แป๋ว",
    phone: "0815495008",
    email: "paew@example.com",
    poCustomer: "PO-2025-001",
    poPurchase: "",
    paymentTerms: "เครดิต 45 วัน",
    paymentMethod: "เงินโอน",
    orderDate: "2025-10-05",
    deliveryDate: "2025-10-20",
    dueDate: "2025-11-19",
    owner: "Saletrades 1 Kitti",
    team: "Trade Sales Team",
    importance: 5,
    status: "processing",
    deliveryStatus: "preparing",
    paymentStatus: "partial",
    items: [
      {
        id: 1,
        code: "PU-001",
        name: "PU40 MS sealant ขนาด 600ML/900G สีขาว",
        quantity: 50,
        unit: "เส้น",
        pricePerUnit: 90,
        discount: 5,
        total: 4275
      },
      {
        id: 2,
        code: "PU-002",
        name: "PU40 MS sealant ขนาด 600ML/900G สีดำ",
        quantity: 30,
        unit: "เส้น",
        pricePerUnit: 90,
        discount: 5,
        total: 2565
      },
      {
        id: 3,
        code: "SIL-001",
        name: "Silicone Sealant สีใส 300ml",
        quantity: 100,
        unit: "หลอด",
        pricePerUnit: 55,
        discount: 10,
        total: 4950
      }
    ],
    subtotal: 11790,
    discount: 589.5,
    afterDiscount: 11200.5,
    vat: 784.04,
    total: 11984.54,
    paidAmount: 5000,
    remainingAmount: 6984.54,
    cost: 8500,
    profit: 30,
    deliveryMethod: "จัดส่ง",
    deliveryAddress: "456 ถนนรามอินทรา แขวงท่าแร้ง เขตบางเขน กรุงเทพมหานคร 10220",
    country: "Thailand (ไทย)",
    province: "Bangkok (กรุงเทพมหานคร)",
    district: "Bang Khen (บางเขน)",
    trackingNumber: "",
    notes: "ส่งก่อน 10:00 น."
  },
  {
    id: 4,
    salesOrderNumber: "SO#251004-0025",
    quotationCode: "Q#251004-0018",
    customerName: "ร้านจึงเจริญอลูมินั่ม",
    customerId: 1,
    projectName: null,
    contact: "คุณอิฐ",
    phone: "0867820555",
    email: "ith@example.com",
    poCustomer: "",
    poPurchase: "",
    paymentTerms: "เครดิต 30 วัน",
    paymentMethod: "เงินโอน",
    orderDate: "2025-10-04",
    deliveryDate: "2025-10-12",
    dueDate: "2025-11-03",
    owner: "Saletrades 1 Kitti",
    team: "Trade Sales Team",
    importance: 3,
    status: "confirmed",
    deliveryStatus: "shipped",
    paymentStatus: "unpaid",
    items: [
      {
        id: 1,
        code: "TIGER-001",
        name: "Tiger Acylic Sealant สีขาว 300ml",
        quantity: 200,
        unit: "หลอด",
        pricePerUnit: 45,
        discount: 0,
        total: 9000
      },
      {
        id: 2,
        code: "TIGER-002",
        name: "Tiger Acylic Sealant สีเทา 300ml",
        quantity: 150,
        unit: "หลอด",
        pricePerUnit: 48,
        discount: 0,
        total: 7200
      }
    ],
    subtotal: 16200,
    discount: 0,
    afterDiscount: 16200,
    vat: 1134,
    total: 17334,
    paidAmount: 0,
    remainingAmount: 17334,
    cost: 12000,
    profit: 30.8,
    deliveryMethod: "จัดส่ง",
    deliveryAddress: "123 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900",
    country: "Thailand (ไทย)",
    province: "Bangkok (กรุงเทพมหานคร)",
    district: "Chatuchak (จตุจักร)",
    trackingNumber: "TH987654321",
    notes: "ส่งตามรอบปกติ"
  },
  {
    id: 5,
    salesOrderNumber: "SO#251003-0018",
    quotationCode: "Q#251003-0012",
    customerName: "บริษัท สยามคอนสตรัคชั่น จำกัด",
    customerId: 4,
    projectName: "โครงการหมู่บ้านสยามพาร์ค",
    contact: "คุณสมชาย",
    phone: "0812345678",
    email: "somchai@siam.com",
    poCustomer: "PO-SC-2025-045",
    poPurchase: "",
    paymentTerms: "เครดิต 60 วัน",
    paymentMethod: "เช็ค",
    orderDate: "2025-10-03",
    deliveryDate: "2025-10-18",
    dueDate: "2025-12-02",
    owner: "Saleprojects 1 Sunisa",
    team: "Project Sales Team",
    importance: 4,
    status: "confirmed",
    deliveryStatus: "pending",
    paymentStatus: "unpaid",
    items: [
      {
        id: 1,
        code: "PU-001",
        name: "PU40 MS sealant ขนาด 600ML/900G สีขาว",
        quantity: 500,
        unit: "เส้น",
        pricePerUnit: 85,
        discount: 10,
        total: 38250
      },
      {
        id: 2,
        code: "FOAM-001",
        name: "PU Foam Gun Grade 750ml",
        quantity: 300,
        unit: "กระป๋อง",
        pricePerUnit: 120,
        discount: 15,
        total: 30600
      }
    ],
    subtotal: 68850,
    discount: 6885,
    afterDiscount: 61965,
    vat: 4337.55,
    total: 66302.55,
    paidAmount: 0,
    remainingAmount: 66302.55,
    cost: 48000,
    profit: 29,
    deliveryMethod: "จัดส่ง",
    deliveryAddress: "789 ถนนบางนา-ตราด กม.15 แขวงบางนา เขตบางนา กรุงเทพมหานคร 10260",
    country: "Thailand (ไทย)",
    province: "Bangkok (กรุงเทพมหานคร)",
    district: "Bang Na (บางนา)",
    trackingNumber: "",
    notes: "โครงการใหญ่ ส่งเป็นงวดๆ งวดแรก 50%"
  },
  {
    id: 6,
    salesOrderNumber: "SO#251002-0033",
    quotationCode: "Q#251002-0028",
    customerName: "ห้างหุ้นส่วน วัสดุก่อสร้างไทย",
    customerId: 5,
    projectName: null,
    contact: "คุณประยุทธ",
    phone: "0898765432",
    email: "",
    poCustomer: "",
    poPurchase: "",
    paymentTerms: "เงินสด",
    paymentMethod: "เงินสด",
    orderDate: "2025-10-02",
    deliveryDate: "2025-10-02",
    dueDate: "2025-10-02",
    owner: "Saletrades 1 Kitti",
    team: "Trade Sales Team",
    importance: 2,
    status: "completed",
    deliveryStatus: "delivered",
    paymentStatus: "paid",
    items: [
      {
        id: 1,
        code: "TIGER-001",
        name: "Tiger Acylic Sealant สีขาว 300ml",
        quantity: 48,
        unit: "หลอด",
        pricePerUnit: 45,
        discount: 0,
        total: 2160
      }
    ],
    subtotal: 2160,
    discount: 0,
    afterDiscount: 2160,
    vat: 151.2,
    total: 2311.2,
    paidAmount: 2311.2,
    remainingAmount: 0,
    cost: 1600,
    profit: 30.8,
    deliveryMethod: "รับเอง",
    deliveryAddress: "",
    country: "Thailand (ไทย)",
    province: "",
    district: "",
    trackingNumber: "",
    notes: "ลูกค้าประจำ"
  }
];

export const mockActivities = [
  {
    id: 1,
    type: "approval",
    title: "ขออนุมัติใบเสนอราคา",
    customer: "บริษัท พงษ์พรรณธารา จำกัด",
    customerId: 3,
    contact: "ณรงค์เดช",
    relatedDoc: "Q#251007-0004",
    owner: "PU STAR",
    date: "2025-10-07",
    time: "Today",
    status: "pending",
    importance: 1
  },
  {
    id: 2,
    type: "call",
    title: "ติดต่อ (โทร)",
    customer: "บริษัท ยูโร อลูมิเนียม",
    customerId: 1,
    contact: "ช่างเดช",
    relatedDoc: "Q#250910-0009",
    owner: "Saletrades 1 Kitti",
    date: "2025-10-07",
    time: "Today",
    status: "completed",
    importance: 3,
    note: "ติดตาม"
  },
  {
    id: 3,
    type: "line",
    title: "ติดต่อ (LINE)",
    customer: "บริษัท เจเค อลูเทค จำกัด",
    customerId: 2,
    contact: "คุณ เทิดพงศ์ วงษาญาณ (Bee)",
    relatedDoc: "Q#251007-0003",
    owner: "PU STAR",
    date: "2025-10-07",
    time: "06:52",
    status: "completed",
    importance: 1,
    note: "ติดตาม"
  },
  {
    id: 4,
    type: "meeting",
    title: "ติดต่อ (เข้าพบ)",
    customer: "บริษัท ร่มโพธิ์ พร็อพเพอร์ตี้ จำกัด (มหาชน)",
    customerId: 2,
    contact: "คุณเจ",
    relatedDoc: "The Title Serenity Naiyang",
    owner: "saleprojects 2",
    date: "2025-10-10",
    time: "10 Oct",
    status: "scheduled",
    importance: 2
  }
];

export const mockReports = [
  {
    code: "R-00",
    name: "รายงานสรุปยอดขายประจำปี",
    description: "รายงานสรุปยอดขายประจำปี แสดงรายเดือน นับจากต้นปี เทียบกับปีก่อนหน้า",
    lastGenerated: "07 Oct 2025"
  },
  {
    code: "R-01",
    name: "สรุปยอดขายรายเดือนของกิจการ",
    description: "รายงานสรุปยอดขายรายเดือนของกิจการ นับถึงสิ้นเดือน",
    lastGenerated: "01 Oct 2025"
  },
  {
    code: "R-02",
    name: "รายละเอียดยอดขายรายเดือน",
    description: "รายงานรายละเอียดยอดขาย ยอดชำระเงิน รายเดือน ของพนักงานรายบุคคล / ทีม / ทั้งกิจการ",
    lastGenerated: "02 Oct 2025"
  },
  {
    code: "R-03",
    name: "รายละเอียดกิจกรรมการขาย",
    description: "รายงานรายละเอียดกิจกรรมการขาย รายเดือน ของพนักงานรายบุคคล / ทีม / ทั้งกิจการ",
    lastGenerated: "06 Oct 2025"
  },
  {
    code: "R-04",
    name: "สรุปสาเหตุที่ไม่ได้งาน",
    description: "รายงานสรุปข้อมูลการขายที่ลูกค้าปฏิเสธ ตามช่วงเวลาที่กำหนด แยกตามกลุ่มสินค้า",
    lastGenerated: "24 Sep 2025"
  },
  {
    code: "R-05",
    name: "วิเคราะห์รายลูกค้า",
    description: "รายงานวิเคราะห์พฤติกรรมลูกค้า ย้อนหลัง 30/60/90/180 วัน",
    lastGenerated: "04 Aug 2025"
  },
  {
    code: "R-06",
    name: "วิเคราะห์ตามแท็กลูกค้า",
    description: "รายงานวิเคราะห์กิจกรรมการขาย และยอดขาย รายเดือน ตามแท็กลูกค้า",
    lastGenerated: "27 Aug 2025"
  },
  {
    code: "R-07",
    name: "รายงานสรุปการคาดการณ์ยอดขายตามกลุ่มสินค้า",
    description: "รายงานสรุปรายละเอียดยอดขายกลุ่มสินค้ารายเดือน",
    lastGenerated: "27 Jun 2025"
  },
  {
    code: "R-09",
    name: "รายงานสรุปการคาดการณ์ยอดขายรายเดือน",
    description: "รายงานสรุปรายละเอียดเปรียบเทียบเป้ายอดขาย คาดการณ์ยอดขาย และยอดขายจริง รายเดือน",
    lastGenerated: "14 Jul 2025"
  },
  {
    code: "R-91",
    name: "รายละเอียดการเดินทาง",
    description: "รายงานรายละเอียดการเดินทาง การเช็คอิน ตามช่วงเวลาที่กำหนด ของพนักงานรายบุคคล",
    lastGenerated: "14 Jul 2025"
  }
];

export const dashboardData = {
  dateRange: "01 ต.ค. 2025- 31 ต.ค. 2025",
  kpis: {
    activeCustomers: {
      current: 41,
      total: 1597,
      change: 17.14,
      changeValue: 35,
      trend: "up"
    },
    activities: {
      current: 82,
      change: -19.61,
      changeValue: 102,
      trend: "down"
    },
    sales: {
      amount: 334978.59,
      count: 46,
      average: 7282.14,
      change: 35.35,
      previousPeriod: 247490.21,
      trend: "up"
    },
    pendingShipment: {
      amount: 160182.06,
      count: 3,
      average: 53394.02,
      change: 13.35,
      status: "รอส่ง",
      trend: "up"
    },
    pendingPayment: {
      amount: 262376.20,
      count: 34,
      average: 7716.95,
      daysOverdue: 4,
      trend: "neutral"
    },
    forecast: {
      amount: 0,
      count: 0,
      average: 0,
      change: 0,
      changeValue: 0,
      trend: "neutral"
    }
  },
  goals: {
    newCustomers: { achieved: 35, target: 451613, percentage: 0.01 },
    opportunities: { achieved: 54, target: 5, percentage: 1080.00 },
    salesRevenue: { achieved: 334978.59, target: 0, percentage: 100.00 },
    profit: { achieved: 334978.59, target: 0, percentage: 100.00 }
  },
  statusChart: {
    win: 76.3,
    newOpportunity: 16.6,
    quotation: 5.1,
    negotiation: 2.0
  },
  salesByEmployee: [
    { name: "PU STAR Office", total: 23, newOpportunity: 0, quotation: 1, negotiation: 2, lost: 0, win: 21 },
    { name: "Saletrades 1 Kitti", total: 17, newOpportunity: 0, quotation: 4, negotiation: 0, lost: 0, win: 8 },
    { name: "Saleprojects 2 Suchada", total: 13, newOpportunity: 0, quotation: 0, negotiation: 0, lost: 0, win: 1 },
    { name: "Chawanya Thanomwong", total: 11, newOpportunity: 0, quotation: 2, negotiation: 1, lost: 1, win: 11 },
    { name: "Saleprojects 1 Sunisa", total: 9, newOpportunity: 0, quotation: 0, negotiation: 0, lost: 0, win: 0 },
    { name: "ณรงค์เดช ศรีสมบัติ", total: 8, newOpportunity: 0, quotation: 3, negotiation: 0, lost: 0, win: 4 }
  ],
  trendData: [
    { date: "01 ต.ค.", activity: 15, lead: 8, win: 3 },
    { date: "02 ต.ค.", activity: 18, lead: 10, win: 5 },
    { date: "03 ต.ค.", activity: 22, lead: 12, win: 7 },
    { date: "04 ต.ค.", activity: 20, lead: 15, win: 6 },
    { date: "05 ต.ค.", activity: 25, lead: 18, win: 8 },
    { date: "06 ต.ค.", activity: 28, lead: 20, win: 10 },
    { date: "07 ต.ค.", activity: 30, lead: 22, win: 12 }
  ],
  funnel: {
    activity: 87,
    lead: 59,
    quotation: 45,
    win: 21
  }
};



export const mockSettings = {
  company: {
    name: "บริษัท วินริช ไดนามิค จำกัด",
    logo: "WINRICH DYNAMIC",
    address: "",
    mainAddress: "100/167 ซอยแจ้งวัฒนะ 10 แยก 9-5 (โกสุมนิเวศน์ 3 ค) แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210 กรุงเทพมหานคร ไทย",
    taxId: "0105567196872",
    promptpayNumber: "",
    promptpayName: "",
    phone: "0989746363",
    mobile: "",
    email: "winrichdynamic@gmail.com"
  },
  features: {
    geoFence: true,
    autoSuggestProducts: true,
    checkInWithLocation: true
  },
  quotation: {
    paymentTerms: ["เครดิต 7 วัน", "เครดิต 15 วัน", "เครดิต 30 วัน", "เครดิต 45 วัน", "เครดิต 60 วัน"],
    notes: "ธ.กสิกรไทย ออมทรัพย์ 1943234902 บริษัท วินริช ไดนามิค จำกัด",
    footer: "",
    paymentDetails: ""
  }
};
