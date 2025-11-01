"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Star, X } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

import { apiService, APIError, Project } from '@/features/jubili/services/apiService';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalFooter,
  ModalTrigger,
  ModalClose 
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { cn } from '@/components/ui/cn';

// Form validation schema
const projectFormSchema = z.object({
  name: z.string()
    .min(2, 'ชื่อโปรเจคต้องมีความยาวอย่างน้อย 2 ตัวอักษร')
    .max(200, 'ชื่อโปรเจคต้องมีความยาวไม่เกิน 200 ตัวอักษร'),
  type: z.string()
    .min(1, 'กรุณาระบุประเภทโปรเจค')
    .max(100, 'ประเภทโปรเจคต้องมีความยาวไม่เกิน 100 ตัวอักษร'),
  customerId: z.string()
    .min(1, 'กรุณาระบุลูกค้า'),
  customerName: z.string()
    .min(1, 'กรุณาระบุชื่อลูกค้า')
    .max(200, 'ชื่อลูกค้าต้องมีความยาวไม่เกิน 200 ตัวอักษร'),
  tags: z.array(z.string()).optional().default([]),
  importance: z.number()
    .min(1, 'ความสำคัญต้องอยู่ระหว่าง 1-5')
    .max(5, 'ความสำคัญต้องอยู่ระหว่าง 1-5')
    .default(3),
  startDate: z.date({
    message: 'กรุณาระบุวันที่เริ่มต้น',
  }),
  endDate: z.date().optional(),
  value: z.number()
    .min(0, 'มูลค่าโปรเจคต้องไม่ต่ำกว่า 0'),
  team: z.string()
    .min(1, 'กรุณาระบุทีม')
    .max(100, 'ชื่อทีมต้องมีความยาวไม่เกิน 100 ตัวอักษร'),
  status: z.enum(['planning', 'proposed', 'quoted', 'testing', 'approved', 'closed'])
    .default('planning'),
  description: z.string()
    .max(2000, 'รายละเอียดต้องมีความยาวไม่เกิน 2000 ตัวอักษร')
    .optional(),
  location: z.object({
    address: z.string().max(500, 'ที่อยู่ต้องมีความยาวไม่เกิน 500 ตัวอักษร').optional(),
    province: z.string().max(100, 'จังหวัดต้องมีความยาวไม่เกิน 100 ตัวอักษร').optional(),
    district: z.string().max(100, 'อำเภอ/เขตต้องมีความยาวไม่เกิน 100 ตัวอักษร').optional(),
    subdistrict: z.string().max(100, 'ตำบล/แขวงต้องมีความยาวไม่เกิน 100 ตัวอักษร').optional(),
    zipcode: z.string().regex(/^\d{5}$/, 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก').optional(),
  }).optional(),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: 'วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น',
  path: ['endDate'],
});

// Project type options
const projectTypes = [
  'บ้าน / ทาวน์เฮาส์ / ที่พักอาศัยแนวราบ',
  'หอพัก / คอนโดมิเนียม / ที่พักอาศัยแนวสูง',
  'อาคารพาณิชย์ / สำนักงาน',
  'โรงงาน / คลังสินค้า',
  'โรงแรม / รีสอร์ท',
  'ร้านอาหาร / คาเฟ่',
  'อื่นๆ'
];

// Team options
const teamOptions = [
  'ทีมขาย 1',
  'ทีมขาย 2',
  'ทีมขาย 3',
  'ทีมโปรเจคพิเศษ',
  'ทีมลูกค้าองค์กร'
];

// Status options with Thai labels
const statusOptions = [
  { value: 'planning', label: 'วางแผน' },
  { value: 'proposed', label: 'นำเสนอบริษัท' },
  { value: 'quoted', label: 'เสนอราคา' },
  { value: 'testing', label: 'ทดสอบสินค้า/ส่งตัวอย่าง' },
  { value: 'approved', label: 'อนุมัติราคา' },
  { value: 'closed', label: 'ปิดใบเสนอราคา' },
];

// Province options (simplified)
const provinceOptions = [
  'กรุงเทพมหานคร',
  'สมุทรปราการ',
  'นนทบุรี',
  'ปทุมธานี',
  'ชลบุรี',
  'ภูเก็ต',
  'เชียงใหม่',
  'สุราษฎร์ธานี',
  'ขอนแก่น',
  'อื่นๆ'
];

export default function ProjectForm({ 
  isOpen, 
  onClose, 
  project, 
  onSuccess,
  mode = 'create' // 'create' or 'edit'
}: {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSuccess?: (project: Project) => void;
  mode?: 'create' | 'edit';
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Initialize form with default values or project data
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      type: '',
      customerId: '',
      customerName: '',
      tags: [],
      importance: 3,
      startDate: new Date(),
      endDate: undefined,
      value: 0,
      team: '',
      status: 'planning',
      description: '',
      location: {
        address: '',
        province: '',
        district: '',
        subdistrict: '',
        zipcode: '',
      },
    },
  });

  // Reset form when project changes
  useEffect(() => {
    if (project && mode === 'edit') {
      form.reset({
        name: project.name || '',
        type: project.type || '',
        customerId: project.customerId || '',
        customerName: project.customerName || '',
        tags: project.tags || [],
        importance: project.importance || 3,
        startDate: project.startDate ? new Date(project.startDate) : new Date(),
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        value: project.value || 0,
        team: project.team || '',
        status: project.status || 'planning',
        description: project.description || '',
        location: {
          address: project.location?.address || '',
          province: project.location?.province || '',
          district: project.location?.district || '',
          subdistrict: project.location?.subdistrict || '',
          zipcode: project.location?.zipcode || '',
        },
      });
    } else if (mode === 'create') {
      form.reset({
        name: '',
        type: '',
        customerId: '',
        customerName: '',
        tags: [],
        importance: 3,
        startDate: new Date(),
        endDate: undefined,
        value: 0,
        team: '',
        status: 'planning',
        description: '',
        location: {
          address: '',
          province: '',
          district: '',
          subdistrict: '',
          zipcode: '',
        },
      });
    }
  }, [project, mode, form]);

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert dates to strings for API
      const apiData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate ? data.endDate.toISOString() : undefined,
      };

      let result;
      if (mode === 'create') {
        result = await apiService.projects.createProject(apiData);
      } else {
        result = await apiService.projects.updateProject(project!._id, apiData);
      }

      onSuccess && onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError(mode === 'create' 
          ? 'เกิดข้อผิดพลาดในการสร้างโปรเจค' 
          : 'เกิดข้อผิดพลาดในการแก้ไขโปรเจค');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tag management
  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue('tags', [...currentTags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  // Handle date selection
  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('startDate', date);
      setShowStartDatePicker(false);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('endDate', date);
      setShowEndDatePicker(false);
    }
  };

  // Render importance stars
  const renderImportanceStars = (value: number, onChange: (value: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1"
          >
            <Star
              className={`h-5 w-5 ${star <= value ? 'fill-red-500 text-red-500' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>
            {mode === 'create' ? 'สร้างโปรเจคใหม่' : 'แก้ไขโปรเจค'}
          </ModalTitle>
        </ModalHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อโปรเจค *</Label>
              <Input 
                id="name"
                placeholder="ระบุชื่อโปรเจค" 
                {...form.register('name')} 
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">ประเภทโปรเจค *</Label>
              <Select 
                value={form.watch('type')} 
                onValueChange={(value) => form.setValue('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทโปรเจค" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-red-500 text-sm">{form.formState.errors.type.message}</p>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">รหัสลูกค้า *</Label>
              <Input 
                id="customerId"
                placeholder="ระบุรหัสลูกค้า" 
                {...form.register('customerId')} 
              />
              {form.formState.errors.customerId && (
                <p className="text-red-500 text-sm">{form.formState.errors.customerId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">ชื่อลูกค้า *</Label>
              <Input 
                id="customerName"
                placeholder="ระบุชื่อลูกค้า" 
                {...form.register('customerName')} 
              />
              {form.formState.errors.customerName && (
                <p className="text-red-500 text-sm">{form.formState.errors.customerName.message}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">แท็ก</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="เพิ่มแท็ก"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  เพิ่ม
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(form.watch('tags') || []).map((tag: string) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {form.formState.errors.tags && (
              <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>
            )}
          </div>

          {/* Importance and Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ความสำคัญ *</Label>
              {renderImportanceStars(form.watch('importance') || 3, (value) => form.setValue('importance', value))}
              <p className="text-sm text-gray-500">1 = น้อยที่สุด, 5 = สำคัญที่สุด</p>
              {form.formState.errors.importance && (
                <p className="text-red-500 text-sm">{form.formState.errors.importance.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">ทีม *</Label>
              <Select 
                value={form.watch('team')} 
                onValueChange={(value) => form.setValue('team', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกทีม" />
                </SelectTrigger>
                <SelectContent>
                  {teamOptions.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.team && (
                <p className="text-red-500 text-sm">{form.formState.errors.team.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">วันที่เริ่มต้น *</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('startDate') ? format(form.watch('startDate'), "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                </Button>
                {showStartDatePicker && (
                  <div className="absolute top-full left-0 z-50 mt-1 bg-white border rounded-md shadow-lg">
                    <Calendar
                      mode="single"
                      selected={form.watch('startDate')}
                      onSelect={handleStartDateSelect}
                      initialFocus
                    />
                  </div>
                )}
              </div>
              {form.formState.errors.startDate && (
                <p className="text-red-500 text-sm">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('endDate') ? format(form.watch('endDate') as Date, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                </Button>
                {showEndDatePicker && (
                  <div className="absolute top-full left-0 z-50 mt-1 bg-white border rounded-md shadow-lg">
                    <Calendar
                      mode="single"
                      selected={form.watch('endDate')}
                      onSelect={handleEndDateSelect}
                      initialFocus
                    />
                  </div>
                )}
              </div>
              {form.formState.errors.endDate && (
                <p className="text-red-500 text-sm">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Value and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">มูลค่าโปรเจค (THB) *</Label>
              <Input
                id="value"
                type="number"
                placeholder="0.00"
                {...form.register('value', { valueAsNumber: true })}
              />
              {form.formState.errors.value && (
                <p className="text-red-500 text-sm">{form.formState.errors.value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">สถานะ *</Label>
              <Select 
                value={form.watch('status')} 
                onValueChange={(value) => form.setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับโปรเจค"
              className="min-h-[100px]"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">สถานที่</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">ที่อยู่</Label>
              <Input
                id="address"
                placeholder="ระบุที่อยู่"
                {...form.register('location.address')}
              />
              {form.formState.errors.location?.address && (
                <p className="text-red-500 text-sm">{form.formState.errors.location.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">จังหวัด</Label>
                <Select 
                  value={form.watch('location.province')} 
                  onValueChange={(value) => form.setValue('location.province', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกจังหวัด" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinceOptions.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.location?.province && (
                  <p className="text-red-500 text-sm">{form.formState.errors.location.province.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">อำเภอ/เขต</Label>
                <Input
                  id="district"
                  placeholder="ระบุอำเภอ/เขต"
                  {...form.register('location.district')}
                />
                {form.formState.errors.location?.district && (
                  <p className="text-red-500 text-sm">{form.formState.errors.location.district.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subdistrict">ตำบล/แขวง</Label>
                <Input
                  id="subdistrict"
                  placeholder="ระบุตำบล/แขวง"
                  {...form.register('location.subdistrict')}
                />
                {form.formState.errors.location?.subdistrict && (
                  <p className="text-red-500 text-sm">{form.formState.errors.location.subdistrict.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipcode">รหัสไปรษณีย์</Label>
                <Input
                  id="zipcode"
                  placeholder="10500"
                  {...form.register('location.zipcode')}
                />
                {form.formState.errors.location?.zipcode && (
                  <p className="text-red-500 text-sm">{form.formState.errors.location.zipcode.message}</p>
                )}
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'create' ? 'กำลังสร้าง...' : 'กำลังบันทึก...'}
                </>
              ) : (
                mode === 'create' ? 'สร้างโปรเจค' : 'บันทึกการแก้ไข'
              )}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}