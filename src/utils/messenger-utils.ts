// =============================
// Messenger Utilities สำหรับระบบ [cut] และ [SEND_IMAGE:...]
// =============================

import { callSendAPI, FBMessagePayload } from './messenger';
import { filterThaiReplyContent } from './openai-utils';

/**
 * ตรวจสอบว่า URL สามารถเข้าถึงได้หรือไม่
 */
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // timeout 5 วินาที
    });
    return response.ok;
  } catch (error) {
    console.warn(`[WARN] URL not accessible: ${url}`, error);
    return false;
  }
}

/**
 * ประมวลผลข้อความที่มี [cut] และ [SEND_IMAGE:...] 
 * แล้วส่งทีละส่วนไปยัง Facebook Messenger
 */
export async function sendTextMessageWithCutAndImages(
  recipientId: string, 
  response: string,
  includeMenu: boolean = false
): Promise<void> {
  console.log("[DEBUG] sendTextMessageWithCutAndImages => raw response:", response);

  // กรองข้อความให้เหลือเฉพาะในแท็ก THAI_REPLY ก่อน
  const filteredResponse = filterThaiReplyContent(response, false);
  console.log("[DEBUG] sendTextMessageWithCutAndImages => filtered response:", filteredResponse);

  // ทำความสะอาด [cut] ที่ซ้ำกัน
  const cleanResponse = filteredResponse.replace(/\[cut\]{2,}/g, "[cut]");
  
  // แบ่งข้อความเป็นส่วนๆ ตาม [cut]
  let segments = cleanResponse.split("[cut]")
    .map(s => s.trim())
    .filter(s => s);
  
  // จำกัดจำนวนส่วนไม่เกิน 10 ส่วน
  if (segments.length > 10) {
    segments = segments.slice(0, 10);
  }

  console.log(`[DEBUG] Processing ${segments.length} segments`);

  // ประมวลผลแต่ละส่วน
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    console.log(`[DEBUG] Processing segment ${i + 1}/${segments.length}:`, segment.substring(0, 100) + "...");

    // สแกนหา [SEND_IMAGE:...] และ [SEND_VIDEO:...]
    const imageRegex = /\[SEND_IMAGE:(https?:\/\/[^\s\]]+)\]/g;
    const videoRegex = /\[SEND_VIDEO:(https?:\/\/[^\s\]]+)\]/g;

    const images = [...segment.matchAll(imageRegex)];
    const videos = [...segment.matchAll(videoRegex)];

    // แยกข้อความออกจากรูปภาพและวิดีโอ
    let textPart = segment
      .replace(imageRegex, '')
      .replace(videoRegex, '')
      .trim();

    console.log(`[DEBUG] Segment ${i + 1}: ${images.length} images, ${videos.length} videos, text length: ${textPart.length}`);

    // ส่งรูปภาพก่อน
    for (const match of images) {
      const imageUrl = match[1];
      console.log(`[DEBUG] Sending image: ${imageUrl}`);
      try {
        await sendImageMessage(recipientId, imageUrl);
        // รอเล็กน้อยระหว่างการส่งรูปภาพ
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`[ERROR] Failed to send image ${imageUrl}:`, err);
      }
    }

    // ส่งวิดีโอ
    for (const match of videos) {
      const videoUrl = match[1];
      console.log(`[DEBUG] Sending video: ${videoUrl}`);
      try {
        await sendVideoMessage(recipientId, videoUrl);
        // รอเล็กน้อยระหว่างการส่งวิดีโอ
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`[ERROR] Failed to send video ${videoUrl}:`, err);
      }
    }

    // ส่งข้อความ (ถ้ามี) พร้อมเมนูถ้าเป็นส่วนสุดท้ายและต้องการเมนู
    if (textPart) {
      console.log(`[DEBUG] Sending text part: ${textPart.substring(0, 100)}...`);
      
      try {
        if (includeMenu && i === segments.length - 1) {
          // ส่งข้อความพร้อมเมนู
          await callSendAPI(recipientId, {
            text: textPart,
            quick_replies: [
              { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
              { content_type: 'text', title: 'ดูสินค้า', payload: 'SHOW_PRODUCTS' },
            ],
          });
        } else {
          await sendSimpleTextMessage(recipientId, textPart);
        }
        // รอเล็กน้อยระหว่างการส่งข้อความ
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`[ERROR] Failed to send text part:`, err);
      }
    }
  }

  console.log(`[DEBUG] Completed sending all ${segments.length} segments`);
}

/**
 * ส่งข้อความธรรมดา
 */
async function sendSimpleTextMessage(recipientId: string, text: string): Promise<void> {
  console.log(`[DEBUG] Sending text message to ${recipientId}: "${text.substring(0, 100)}..."`);
  
  const message: FBMessagePayload = { text };
  
  try {
    await callSendAPI(recipientId, message);
    console.log("[DEBUG] Text message sent successfully");
  } catch (err) {
    console.error("[ERROR] Failed to send text message:", err);
  }
}

/**
 * ส่งรูปภาพ (ปรับปรุงให้ทำงานได้เหมือนโค้ดตัวอย่าง)
 */
async function sendImageMessage(recipientId: string, imageUrl: string): Promise<void> {
  console.log(`[DEBUG] Sending image to ${recipientId}: ${imageUrl}`);
  
  // ตรวจสอบว่า URL ถูกต้องหรือไม่ (แบบง่ายๆ)
  if (!imageUrl || !imageUrl.startsWith('http')) {
    console.error(`[ERROR] Invalid image URL: ${imageUrl}`);
    return;
  }

  const message: FBMessagePayload = {
    attachment: {
      type: 'image',
      payload: { 
        url: imageUrl, 
        is_reusable: true 
      }
    }
  };
  
  try {
    await callSendAPI(recipientId, message);
    console.log("[DEBUG] Image sent successfully");
  } catch (err: any) {
    console.error("[ERROR] Failed to send image:", err);
    
    // ถ้าส่งรูปภาพไม่สำเร็จ ให้ส่งข้อความแจ้งเตือนแทน
    try {
      const fallbackMessage: FBMessagePayload = {
        text: `ขออภัยค่ะ ไม่สามารถแสดงรูปภาพได้ (${imageUrl})`
      };
      await callSendAPI(recipientId, fallbackMessage);
    } catch (fallbackErr) {
      console.error("[ERROR] Failed to send fallback message:", fallbackErr);
    }
  }
}

/**
 * ส่งวิดีโอ
 */
async function sendVideoMessage(recipientId: string, videoUrl: string): Promise<void> {
  console.log(`[DEBUG] Sending video to ${recipientId}: ${videoUrl}`);
  
  // ตรวจสอบว่า URL ถูกต้องหรือไม่
  if (!videoUrl || !videoUrl.startsWith('http')) {
    console.error(`[ERROR] Invalid video URL: ${videoUrl}`);
    return;
  }
  
  // ตรวจสอบว่า URL สามารถเข้าถึงได้หรือไม่
  const isAccessible = await isUrlAccessible(videoUrl);
  if (!isAccessible) {
    console.warn(`[WARN] Video URL not accessible: ${videoUrl}`);
    // ส่งข้อความแจ้งเตือนแทน
    try {
      const fallbackMessage: FBMessagePayload = {
        text: `ขออภัยค่ะ ไม่สามารถเข้าถึงวิดีโอได้ (${videoUrl})`
      };
      await callSendAPI(recipientId, fallbackMessage);
    } catch (fallbackErr) {
      console.error("[ERROR] Failed to send fallback message:", fallbackErr);
    }
    return;
  }
  
  const message: FBMessagePayload = {
    attachment: {
      type: 'video',
      payload: { 
        url: videoUrl, 
        is_reusable: true 
      }
    }
  };
  
  try {
    await callSendAPI(recipientId, message);
    console.log("[DEBUG] Video sent successfully");
  } catch (err) {
    console.error("[ERROR] Failed to send video:", err);
    
    // ถ้าส่งวิดีโอไม่สำเร็จ ให้ส่งข้อความแจ้งเตือนแทน
    try {
      const fallbackMessage: FBMessagePayload = {
        text: `ขออภัยค่ะ ไม่สามารถแสดงวิดีโอได้ (${videoUrl})`
      };
      await callSendAPI(recipientId, fallbackMessage);
    } catch (fallbackErr) {
      console.error("[ERROR] Failed to send fallback message:", fallbackErr);
    }
  }
}

/**
 * ตรวจสอบว่าข้อความมี [cut] หรือ [SEND_IMAGE:...] หรือไม่
 */
export function hasCutOrImageCommands(text: string): boolean {
  return /\[cut\]|\[SEND_IMAGE:|\[SEND_VIDEO:/i.test(text);
}

/**
 * นับจำนวนรูปภาพและวิดีโอในข้อความ
 */
export function countMediaInText(text: string): { images: number; videos: number } {
  const imageMatches = text.match(/\[SEND_IMAGE:/g) || [];
  const videoMatches = text.match(/\[SEND_VIDEO:/g) || [];
  
  return {
    images: imageMatches.length,
    videos: videoMatches.length
  };
}

/**
 * แยกข้อความเป็นส่วนๆ ตาม [cut] โดยไม่ส่ง
 */
export function parseCutSegments(text: string): {
  segments: string[];
  totalImages: number;
  totalVideos: number;
} {
  // ทำความสะอาด [cut] ที่ซ้ำกัน
  const cleanedText = text.replace(/\[cut\]{2,}/g, "[cut]");
  
  // แบ่งข้อความเป็นส่วนๆ
  const segments = cleanedText
    .split("[cut]")
    .map(s => s.trim())
    .filter(s => s);
  
  // นับจำนวนรูปภาพและวิดีโอทั้งหมด
  const { images, videos } = countMediaInText(text);
  
  return {
    segments,
    totalImages: images,
    totalVideos: videos
  };
}

/**
 * ส่งข้อความแบบ batch (หลายส่วนพร้อมกัน)
 */
export async function sendBatchMessage(
  recipientId: string, 
  segments: string[]
): Promise<void> {
  console.log(`[DEBUG] Sending batch message with ${segments.length} segments`);
  
  // ส่งทุกส่วนพร้อมกัน
  const promises = segments.map(async (segment, index) => {
    console.log(`[DEBUG] Processing batch segment ${index + 1}/${segments.length}`);
    
    // สแกนหา media
    const imageRegex = /\[SEND_IMAGE:(https?:\/\/[^\s\]]+)\]/g;
    const videoRegex = /\[SEND_VIDEO:(https?:\/\/[^\s\]]+)\]/g;
    
    const images = [...segment.matchAll(imageRegex)];
    const videos = [...segment.matchAll(videoRegex)];
    
    let textPart = segment
      .replace(imageRegex, '')
      .replace(videoRegex, '')
      .trim();
    
    const results = [];
    
    // ส่งรูปภาพ
    for (const match of images) {
      const imageUrl = match[1];
      results.push(sendImageMessage(recipientId, imageUrl));
    }
    
    // ส่งวิดีโอ
    for (const match of videos) {
      const videoUrl = match[1];
      results.push(sendVideoMessage(recipientId, videoUrl));
    }
    
    // ส่งข้อความ
    if (textPart) {
      results.push(sendSimpleTextMessage(recipientId, textPart));
    }
    
    return Promise.allSettled(results);
  });
  
  // รอให้ทุกส่วนเสร็จ
  const results = await Promise.allSettled(promises);
  
  // ตรวจสอบผลลัพธ์
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount++;
    } else {
      errorCount++;
      console.error(`[ERROR] Batch segment ${index + 1} failed:`, result.reason);
    }
  });
  
  console.log(`[DEBUG] Batch message completed: ${successCount} successful, ${errorCount} failed`);
}

/**
 * ส่งข้อความแบบ smart (เลือกวิธีที่เหมาะสม)
 */
export async function sendSmartMessage(
  recipientId: string, 
  response: string,
  includeMenu: boolean = false
): Promise<void> {
  // ตรวจสอบว่าต้องใช้ระบบ [cut] หรือไม่
  if (hasCutOrImageCommands(response)) {
    console.log("[DEBUG] Using cut/image system for message - will split into multiple parts");
    return sendTextMessageWithCutAndImages(recipientId, response, includeMenu);
  } else {
    // ข้อความธรรมดา
    console.log("[DEBUG] Using simple text message");
    if (includeMenu) {
      // ส่งข้อความพร้อมเมนู
      return callSendAPI(recipientId, {
        text: response,
        quick_replies: [
          { content_type: 'text', title: 'เมนูหลัก', payload: 'SHOW_MENU' },
          { content_type: 'text', title: 'ดูสินค้า', payload: 'SHOW_PRODUCTS' },
        ],
      });
    } else {
      return sendSimpleTextMessage(recipientId, response);
    }
  }
}

/**
 * ส่งข้อความแบบเรียบง่ายเหมือนโค้ดตัวอย่าง
 * ใช้สำหรับระบบ [SEND_IMAGE:...] และ [SEND_VIDEO:...]
 */
export async function sendTextMessage(
  recipientId: string, 
  response: string
): Promise<void> {
  console.log("[DEBUG] sendTextMessage => raw response:", response);

  // กรองข้อความให้เหลือเฉพาะในแท็ก THAI_REPLY ก่อน
  const filteredResponse = filterThaiReplyContent(response, false);
  console.log("[DEBUG] sendTextMessage => filtered response:", filteredResponse);

  // ทำความสะอาด [cut] ที่ซ้ำกัน
  const cleanResponse = filteredResponse.replace(/\[cut\]{2,}/g, "[cut]");
  
  // แบ่งข้อความเป็นส่วนๆ ตาม [cut]
  let segments = cleanResponse.split("[cut]")
    .map(s => s.trim())
    .filter(s => s);
  
  // จำกัดจำนวนส่วนไม่เกิน 10 ส่วน
  if (segments.length > 10) {
    segments = segments.slice(0, 10);
  }

  console.log(`[DEBUG] Processing ${segments.length} segments`);

  // ประมวลผลแต่ละส่วน
  for (let segment of segments) {
    // สแกนหา [SEND_IMAGE:...] และ [SEND_VIDEO:...]
    const imageRegex = /\[SEND_IMAGE:(https?:\/\/[^\s\]]+)\]/g;
    const videoRegex = /\[SEND_VIDEO:(https?:\/\/[^\s\]]+)\]/g;

    const images = [...segment.matchAll(imageRegex)];
    const videos = [...segment.matchAll(videoRegex)];

    // แยกข้อความออกจากรูปภาพและวิดีโอ
    let textPart = segment
      .replace(imageRegex, '')
      .replace(videoRegex, '')
      .trim();

    // ส่งรูปภาพก่อน
    for (const match of images) {
      const imageUrl = match[1];
      console.log(`[DEBUG] Sending image: ${imageUrl}`);
      try {
        await sendImageMessage(recipientId, imageUrl);
        // รอเล็กน้อยระหว่างการส่งรูปภาพ
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`[ERROR] Failed to send image ${imageUrl}:`, err);
      }
    }

    // ส่งวิดีโอ
    for (const match of videos) {
      const videoUrl = match[1];
      console.log(`[DEBUG] Sending video: ${videoUrl}`);
      try {
        await sendVideoMessage(recipientId, videoUrl);
        // รอเล็กน้อยระหว่างการส่งวิดีโอ
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`[ERROR] Failed to send video ${videoUrl}:`, err);
      }
    }

    // ส่งข้อความ (ถ้ามี)
    if (textPart) {
      console.log(`[DEBUG] Sending text part: ${textPart.substring(0, 100)}...`);
      try {
        await sendSimpleTextMessage(recipientId, textPart);
        // รอเล็กน้อยระหว่างการส่งข้อความ
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`[ERROR] Failed to send text part:`, err);
      }
    }
  }

  console.log(`[DEBUG] Completed sending all ${segments.length} segments`);
}
