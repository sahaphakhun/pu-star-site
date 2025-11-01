import { z } from 'zod';

// Location schema
const locationSchema = z.object({
  address: z.string().max(500, 'ที่อยู่ต้องมีความยาวไม่เกิน 500 ตัวอักษร').optional(),
  province: z.string().max(100, 'จังหวัดต้องมีความยาวไม่เกิน 100 ตัวอักษร').optional(),
  district: z.string().max(100, 'อำเภอ/เขตต้องมีความยาวไม่เกิน 100 ตัวอักษร').optional(),
  subdistrict: z.string().max(100, 'ตำบล/แขวงต้องมีความยาวไม่เกิน 100 ตัวอักษร').optional(),
  zipcode: z.string().regex(/^\d{5}$/, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก').optional(),
}).optional();

// Schema for creating a new project
export const createProjectSchema = z.object({
  name: z.string()
    .min(2, 'ชื่อโปรเจคต้องมีความยาวอย่างน้อย 2 ตัวอักษร')
    .max(200, 'ชื่อโปรเจคต้องมีความยาวไม่เกิน 200 ตัวอักษร')
    .trim(),
  type: z.string()
    .min(1, 'กรุณาระบุประเภทโปรเจค')
    .max(100, 'ประเภทโปรเจคต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    .trim(),
  customerId: z.string()
    .min(1, 'กรุณาระบุลูกค้า')
    .trim(),
  customerName: z.string()
    .min(1, 'กรุณาระบุชื่อลูกค้า')
    .max(200, 'ชื่อลูกค้าต้องมีความยาวไม่เกิน 200 ตัวอักษร')
    .trim(),
  tags: z.array(z.string()).optional().default([]),
  importance: z.number()
    .min(1, 'ความสำคัญต้องอยู่ระหว่าง 1-5')
    .max(5, 'ความสำคัญต้องอยู่ระหว่าง 1-5')
    .default(3),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  value: z.number()
    .min(0, 'มูลค่าโปรเจคต้องไม่ต่ำกว่า 0')
    .nonnegative('มูลค่าโปรเจคต้องเป็นตัวเลขที่ไม่ติดลบ'),
  team: z.string()
    .min(1, 'กรุณาระบุทีม')
    .max(100, 'ชื่อทีมต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    .trim(),
  status: z.enum(['planning', 'proposed', 'quoted', 'testing', 'approved', 'closed'])
    .default('planning'),
  description: z.string()
    .max(2000, 'รายละเอียดต้องมีความยาวไม่เกิน 2000 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  location: locationSchema,
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: 'วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น',
  path: ['endDate'],
});

// Schema for updating a project
export const updateProjectSchema = createProjectSchema.partial();

// Schema for searching projects
export const searchProjectSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  customerId: z.string().optional(),
  ownerId: z.string().optional(),
  team: z.string().optional(),
  status: z.enum(['planning', 'proposed', 'quoted', 'testing', 'approved', 'closed']).optional(),
  importance: z.coerce.number().min(1).max(5).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
}).refine((data) => {
  if (data.dateFrom && data.dateTo) {
    return data.dateTo >= data.dateFrom;
  }
  return true;
}, {
  message: 'วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น',
  path: ['dateTo'],
});

// Schema for project status update
export const updateProjectStatusSchema = z.object({
  status: z.enum(['planning', 'proposed', 'quoted', 'testing', 'approved', 'closed']),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

// Type definitions
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SearchProjectInput = z.infer<typeof searchProjectSchema>;
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>;
export type LocationInput = z.infer<typeof locationSchema>;