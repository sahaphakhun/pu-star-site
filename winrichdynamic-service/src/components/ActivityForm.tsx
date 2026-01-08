"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { activitiesApi, customersApi, opportunitiesApi, quotationsApi, Activity, Customer, Opportunity, Quotation } from '@/features/jubili/services/apiService';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Calendar, Clock, User, Target, FileText, AlertCircle } from 'lucide-react';

const CLEAR_SELECT_VALUE = '__clear__';

// Form validation schema based on activity schema
const activityFormSchema = z.object({
  type: z.enum(['call', 'meeting', 'email', 'task']),
  subject: z.string().min(1, 'กรุณาระบุหัวข้อกิจกรรม').max(200, 'หัวข้อต้องไม่เกิน 200 ตัวอักษร'),
  notes: z.string().max(2000, 'โน้ตต้องไม่เกิน 2000 ตัวอักษร').optional(),
  customerId: z.string().optional(),
  dealId: z.string().optional(),
  quotationId: z.string().optional(),
  ownerId: z.string().optional(),
  scheduledAt: z.string().optional(),
  remindBeforeMinutes: z.number().min(0).max(43200).optional(),
  status: z.enum(['planned', 'done', 'cancelled', 'postponed']),
  postponeReason: z.string().max(500, 'เหตุผลต้องไม่เกิน 500 ตัวอักษร').optional(),
  cancelReason: z.string().max(500, 'เหตุผลต้องไม่เกิน 500 ตัวอักษร').optional(),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

interface ActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activity | null;
  onSuccess?: (activity: Activity) => void;
  mode?: 'create' | 'edit' | 'view';
}

const ActivityForm: React.FC<ActivityFormProps> = ({
  isOpen,
  onClose,
  activity = null,
  onSuccess,
  mode = 'create' // 'create', 'edit', or 'view'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  // Initialize form with default values or existing activity data
  const form = useForm({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: activity?.type || 'call',
      subject: activity?.subject || '',
      notes: activity?.notes || '',
      customerId: activity?.customerId || '',
      dealId: activity?.dealId || '',
      quotationId: activity?.quotationId || '',
      ownerId: activity?.ownerId || '',
      scheduledAt: activity?.scheduledAt
        ? new Date(activity.scheduledAt).toISOString().slice(0, 16)
        : '',
      remindBeforeMinutes: activity?.remindBeforeMinutes || 0,
      status: activity?.status || 'planned',
      postponeReason: activity?.postponeReason || '',
      cancelReason: activity?.cancelReason || '',
    },
  });

  // Watch status field to show/hide reason fields
  const status = form.watch('status');

  // Fetch related data
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        setLoadingCustomers(true);
        const customersResponse = await customersApi.getCustomers({ limit: 100 });
        setCustomers(customersResponse.data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoadingCustomers(false);
      }

      try {
        setLoadingOpportunities(true);
        const opportunitiesResponse = await opportunitiesApi.getOpportunities({ limit: 100 });
        setOpportunities(opportunitiesResponse.data || []);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoadingOpportunities(false);
      }

      try {
        setLoadingQuotations(true);
        const quotationsResponse = await quotationsApi.getQuotations({ limit: 100 });
        setQuotations(quotationsResponse.data || []);
      } catch (error) {
        console.error('Error fetching quotations:', error);
      } finally {
        setLoadingQuotations(false);
      }
    };

    if (isOpen) {
      fetchRelatedData();
    }
  }, [isOpen]);

  // Reset form when activity prop changes
  useEffect(() => {
    if (activity) {
      form.reset({
        type: activity.type || 'call',
        subject: activity.subject || '',
        notes: activity.notes || '',
        customerId: activity.customerId || '',
        dealId: activity.dealId || '',
        quotationId: activity.quotationId || '',
        ownerId: activity.ownerId || '',
        scheduledAt: activity.scheduledAt 
          ? new Date(activity.scheduledAt).toISOString().slice(0, 16) 
          : '',
        remindBeforeMinutes: activity.remindBeforeMinutes || 0,
        status: activity.status || 'planned',
        postponeReason: activity.postponeReason || '',
        cancelReason: activity.cancelReason || '',
      });
    } else {
      form.reset({
        type: 'call',
        subject: '',
        notes: '',
        customerId: '',
        dealId: '',
        quotationId: '',
        ownerId: '',
        scheduledAt: '',
        remindBeforeMinutes: 0,
        status: 'planned',
        postponeReason: '',
        cancelReason: '',
      });
    }
  }, [activity, form]);

  const onSubmit = async (data: ActivityFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Format data for API
      const formattedData = {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
      };

      let response;
      if (mode === 'edit' && activity?._id) {
        response = await activitiesApi.updateActivity(activity._id, formattedData);
      } else {
        response = await activitiesApi.createActivity(formattedData);
      }

      if (onSuccess) {
        onSuccess(response);
      }

      onClose();
    } catch (error) {
      console.error('Error saving activity:', error);
      setError((error as Error).message || 'ไม่สามารถบันทึกกิจกรรมได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // Activity type options
  const activityTypes = [
    { value: 'call', label: 'โทร' },
    { value: 'email', label: 'อีเมล' },
    { value: 'meeting', label: 'นัดหมาย' },
    { value: 'task', label: 'งาน' },
  ];

  // Status options
  const statusOptions = [
    { value: 'planned', label: 'วางแผน' },
    { value: 'done', label: 'เสร็จสิ้น' },
    { value: 'cancelled', label: 'ยกเลิก' },
    { value: 'postponed', label: 'เลื่อน' },
  ];

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {mode === 'edit' ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}
          </ModalTitle>
        </ModalHeader>

        <form onSubmit={mode === 'view' ? (e) => { e.preventDefault(); } : form.handleSubmit(onSubmit as any)} className="space-y-4">
          {/* Activity Type */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Target className="w-4 h-4" />
              ประเภทกิจกรรม
            </label>
            <Select
              value={form.watch('type')}
              onValueChange={(value) => form.setValue('type', value as any)}
              disabled={mode === 'view'}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภทกิจกรรม" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">หัวข้อกิจกรรม</label>
            <Input
              placeholder="ระบุหัวข้อกิจกรรม"
              {...form.register('subject')}
              disabled={mode === 'view'}
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500">{form.formState.errors.subject.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">โน้ต</label>
            <Textarea
              placeholder="ระบุรายละเอียดเพิ่มเติม"
              className="min-h-[100px]"
              {...form.register('notes')}
              disabled={mode === 'view'}
            />
            {form.formState.errors.notes && (
              <p className="text-sm text-red-500">{form.formState.errors.notes.message}</p>
            )}
          </div>

          {/* Related Entities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4" />
                ลูกค้า
              </label>
              <Select
                value={form.watch('customerId')}
                onValueChange={(value) =>
                  form.setValue('customerId', value === CLEAR_SELECT_VALUE ? '' : (value as any))
                }
                disabled={loadingCustomers || mode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CLEAR_SELECT_VALUE}>ไม่เลือก</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customerId && (
                <p className="text-sm text-red-500">{form.formState.errors.customerId.message}</p>
              )}
            </div>

            {/* Opportunity/Deal */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4" />
                โอกาส
              </label>
              <Select
                value={form.watch('dealId')}
                onValueChange={(value) =>
                  form.setValue('dealId', value === CLEAR_SELECT_VALUE ? '' : (value as any))
                }
                disabled={loadingOpportunities || mode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกโอกาส" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CLEAR_SELECT_VALUE}>ไม่เลือก</SelectItem>
                  {opportunities.map((opportunity) => (
                    <SelectItem key={opportunity._id} value={opportunity._id}>
                      {opportunity.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.dealId && (
                <p className="text-sm text-red-500">{form.formState.errors.dealId.message}</p>
              )}
            </div>

            {/* Quotation */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" />
                ใบเสนอราคา
              </label>
              <Select
                value={form.watch('quotationId')}
                onValueChange={(value) =>
                  form.setValue('quotationId', value === CLEAR_SELECT_VALUE ? '' : (value as any))
                }
                disabled={loadingQuotations || mode === 'view'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกใบเสนอราคา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CLEAR_SELECT_VALUE}>ไม่เลือก</SelectItem>
                  {quotations.map((quotation) => (
                    <SelectItem key={quotation._id} value={quotation._id}>
                      {quotation.quotationNumber} - {quotation.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.quotationId && (
                <p className="text-sm text-red-500">{form.formState.errors.quotationId.message}</p>
              )}
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <label className="text-sm font-medium">ผู้รับผิดชอบ</label>
            <Input
              placeholder="ระบุ ID ผู้รับผิดชอบ"
              {...form.register('ownerId')}
              disabled={mode === 'view'}
            />
            {form.formState.errors.ownerId && (
              <p className="text-sm text-red-500">{form.formState.errors.ownerId.message}</p>
            )}
          </div>

          {/* Scheduled Date and Time */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              วันที่และเวลานัดหมาย
            </label>
            <Input
              type="datetime-local"
              {...form.register('scheduledAt')}
              disabled={mode === 'view'}
            />
            {form.formState.errors.scheduledAt && (
              <p className="text-sm text-red-500">{form.formState.errors.scheduledAt.message}</p>
            )}
          </div>

          {/* Reminder */}
          <div className="space-y-2">
            <label className="text-sm font-medium">เตือนล่วงหน้า (นาที)</label>
            <Input
              type="number"
              min="0"
              max="43200"
              placeholder="0"
              {...form.register('remindBeforeMinutes', {
                valueAsNumber: true,
                onChange: (e) => form.setValue('remindBeforeMinutes', parseInt(e.target.value) || 0)
              })}
              disabled={mode === 'view'}
            />
            {form.formState.errors.remindBeforeMinutes && (
              <p className="text-sm text-red-500">{form.formState.errors.remindBeforeMinutes.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">สถานะ</label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => form.setValue('status', value as any)}
              disabled={mode === 'view'}
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
              <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
            )}
          </div>

          {/* Postpone Reason - shown only when status is postponed */}
          {status === 'postponed' && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                เหตุผลในการเลื่อน
              </label>
              <Textarea
                placeholder="ระบุเหตุผลในการเลื่อนกิจกรรม"
                {...form.register('postponeReason')}
                disabled={mode === 'view'}
              />
              {form.formState.errors.postponeReason && (
                <p className="text-sm text-red-500">{form.formState.errors.postponeReason.message}</p>
              )}
            </div>
          )}

          {/* Cancel Reason - shown only when status is cancelled */}
          {status === 'cancelled' && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                เหตุผลในการยกเลิก
              </label>
              <Textarea
                placeholder="ระบุเหตุผลในการยกเลิกกิจกรรม"
                {...form.register('cancelReason')}
                disabled={mode === 'view'}
              />
              {form.formState.errors.cancelReason && (
                <p className="text-sm text-red-500">{form.formState.errors.cancelReason.message}</p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <ModalFooter>
            {mode === 'view' ? (
              <Button
                type="button"
                onClick={onClose}
                className="min-w-[120px]"
              >
                ปิด
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>กำลังบันทึก...</span>
                    </div>
                  ) : (
                    mode === 'edit' ? 'อัปเดตกิจกรรม' : 'สร้างกิจกรรม'
                  )}
                </Button>
              </>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ActivityForm;
