/**
 * รวมศูนย์การส่ง SMS ให้เรียกใช้ implementation เดียวจาก `src/app/notification/sms.ts`
 */

import { sendSMS as smsSend } from '@/app/notification/sms';

// เรียกใช้ฟังก์ชัน sendSMS จาก notification/sms (implementation กลาง)
export const sendSMS = smsSend;
