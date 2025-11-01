"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

import { apiService, APIError, Opportunity } from '@/features/jubili/services/apiService';
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

// Form validation schema based on Deal model
const opportunityFormSchema = z.object({
  title: z.string()
    .min(2, 'ชื่อโอกาสต้องมีความยาวอย่างน้อย 2 ตัวอักษร')
    .max(200, 'ชื่อโอกาสต้องมีความยาวไม่เกิน 200 ตัวอักษร'),
  customerId: z.string()
    .min(1, 'กรุณาระบุลูกค้า'),
  customerName: z.string()
    .min(1, 'กรุณาระบุชื่อลูกค้า')
    .max(200, 'ชื่อลูกค้าต้องมีความยาวไม่เกิน 200 ตัวอักษร'),
  amount: z.number()
    .min(0, 'มูลค่าโอกาสต้องไม่ต่ำกว่า 0'),
  currency: z.string()
    .min(1, 'กรุณาระบุสกุลเงิน')
    .max(10, 'สกุลเงินต้องมีความยาวไม่เกิน 10 ตัวอักษร')
    .default('THB'),
  stageId: z.string()
    .min(1, 'กรุณาระบุสเตจ'),
  stageName: z.string()
    .max(100, 'ชื่อสเตจต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    .optional(),
  ownerId: z.string().optional(),
  team: z.string()
    .max(100, 'ชื่อทีมต้องมีความยาวไม่เกิน 100 ตัวอักษร')
    .optional(),
  expectedCloseDate: z.date().optional(),
  status: z.enum(['open', 'won', 'lost'])
    .default('open'),
  probability: z.number()
    .min(0, 'ความน่าจะเป็นต้องไม่ต่ำกว่า 0')
    .max(100, 'ความน่าจะเป็นต้องไม่เกิน 100')
    .optional(),
  tags: z.array(z.string()).optional().default([]),
  description: z.string()
    .max(2000, 'รายละเอียดต้องมีความยาวไม่เกิน 2000 ตัวอักษร')
    .optional(),
  quotationIds: z.array(z.string()).optional().default([]),
});

// Currency options
const currencyOptions = [
  { value: 'THB', label: 'THB - บาทไทย' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
];

// Pipeline stage options (mock data - should be fetched from API)
const pipelineStageOptions = [
  { value: '1', label: 'ใหม่', probability: 10 },
  { value: '2', label: 'ติดต่อแล้ว', probability: 25 },
  { value: '3', label: 'ส่งใบเสนอราคา', probability: 50 },
  { value: '4', label: 'เจรจา', probability: 75 },
  { value: '5', label: 'ชนะ', probability: 100 },
  { value: '6', label: 'แพ้', probability: 0 },
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
  { value: 'open', label: 'เปิด' },
  { value: 'won', label: 'ชนะ' },
  { value: 'lost', label: 'แพ้' },
];

export default function OpportunityForm({ 
  isOpen, 
  onClose, 
  opportunity, 
  onSuccess,
  mode = 'create' // 'create' or 'edit'
}: {
  isOpen: boolean;
  onClose: () => void;
  opportunity?: Opportunity | null;
  onSuccess?: (opportunity: Opportunity) => void;
  mode?: 'create' | 'edit';
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showExpectedCloseDatePicker, setShowExpectedCloseDatePicker] = useState(false);

  // Initialize form with default values or opportunity data
  const form = useForm({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      title: '',
      customerId: '',
      customerName: '',
      amount: 0,
      currency: 'THB',
      stageId: '',
      stageName: '',
      ownerId: '',
      team: '',
      expectedCloseDate: undefined,
      status: 'open',
      probability: undefined,
      tags: [],
      description: '',
      quotationIds: [],
    },
  });

  // Reset form when opportunity changes
  useEffect(() => {
    if (opportunity && mode === 'edit') {
      form.reset({
        title: opportunity.title || '',
        customerId: opportunity.customerId || '',
        customerName: opportunity.customerName || '',
        amount: opportunity.amount || 0,
        currency: opportunity.currency || 'THB',
        stageId: opportunity.stageId || '',
        stageName: opportunity.stageName || '',
        ownerId: opportunity.ownerId || '',
        team: opportunity.team || '',
        expectedCloseDate: opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate) : undefined,
        status: opportunity.status || 'open',
        probability: opportunity.probability,
        tags: opportunity.tags || [],
        description: opportunity.description || '',
        quotationIds: opportunity.quotationIds || [],
      });
    } else if (mode === 'create') {
      form.reset({
        title: '',
        customerId: '',
        customerName: '',
        amount: 0,
        currency: 'THB',
        stageId: '',
        stageName: '',
        ownerId: '',
        team: '',
        expectedCloseDate: undefined,
        status: 'open',
        probability: undefined,
        tags: [],
        description: '',
        quotationIds: [],
      });
    }
  }, [opportunity, mode, form]);

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert dates to strings for API
      const apiData = {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? data.expectedCloseDate.toISOString() : undefined,
      };

      let result;
      if (mode === 'create') {
        result = await apiService.opportunities.createOpportunity(apiData);
      } else {
        result = await apiService.opportunities.updateOpportunity(opportunity!._id, apiData);
      }

      onSuccess && onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Error saving opportunity:', err);
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError(mode === 'create' 
          ? 'เกิดข้อผิดพลาดในการสร้างโอกาส' 
          : 'เกิดข้อผิดพลาดในการแก้ไขโอกาส');
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
  const handleExpectedCloseDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('expectedCloseDate', date);
      setShowExpectedCloseDatePicker(false);
    }
  };

  // Handle stage change to update probability
  const handleStageChange = (stageId: string) => {
    form.setValue('stageId', stageId);
    const stage = pipelineStageOptions.find(s => s.value === stageId);
    if (stage) {
      form.setValue('stageName', stage.label);
      // Auto-set probability based on stage
      if (!form.getValues('probability')) {
        form.setValue('probability', stage.probability);
      }
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>
            {mode === 'create' ? 'สร้างโอกาสใหม่' : 'แก้ไขโอกาส'}
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
              <Label htmlFor="title">ชื่อโอกาส *</Label>
              <Input 
                id="title"
                placeholder="ระบุชื่อโอกาส" 
                {...form.register('title')} 
              />
              {form.formState.errors.title && (
                <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stageId">สเตจ *</Label>
              <Select 
                value={form.watch('stageId')} 
                onValueChange={handleStageChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสเตจ" />
                </SelectTrigger>
                <SelectContent>
                  {pipelineStageOptions.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.stageId && (
                <p className="text-red-500 text-sm">{form.formState.errors.stageId.message}</p>
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

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">มูลค่า *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-red-500 text-sm">{form.formState.errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">สกุลเงิน *</Label>
              <Select 
                value={form.watch('currency')} 
                onValueChange={(value) => form.setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสกุลเงิน" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.currency && (
                <p className="text-red-500 text-sm">{form.formState.errors.currency.message}</p>
              )}
            </div>
          </div>

          {/* Status and Probability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="probability">ความน่าจะเป็น (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                {...form.register('probability', { valueAsNumber: true })}
              />
              {form.formState.errors.probability && (
                <p className="text-red-500 text-sm">{form.formState.errors.probability.message}</p>
              )}
            </div>
          </div>

          {/* Expected Close Date and Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">วันที่คาดว่าจะปิดการขาย</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setShowExpectedCloseDatePicker(!showExpectedCloseDatePicker)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('expectedCloseDate') ? format(form.watch('expectedCloseDate') as Date, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                </Button>
                {showExpectedCloseDatePicker && (
                  <div className="absolute top-full left-0 z-50 mt-1 bg-white border rounded-md shadow-lg">
                    <Calendar
                      mode="single"
                      selected={form.watch('expectedCloseDate')}
                      onSelect={handleExpectedCloseDateSelect}
                      initialFocus
                    />
                  </div>
                )}
              </div>
              {form.formState.errors.expectedCloseDate && (
                <p className="text-red-500 text-sm">{form.formState.errors.expectedCloseDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">ทีม</Label>
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
                  <Plus className="h-4 w-4" />
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับโอกาส"
              className="min-h-[100px]"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
            )}
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
                mode === 'create' ? 'สร้างโอกาส' : 'บันทึกการแก้ไข'
              )}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}