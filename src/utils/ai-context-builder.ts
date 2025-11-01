/**
 * AI Context Builder
 * สร้างข้อความบริบทจาก source เพื่อแทรกใน conversation
 */

class AIContextBuilder {
  /**
   * สร้างข้อความบริบทจาก source
   * ข้อความนี้จะถูกแทรกเป็น user message ก่อนข้อความอัตโนมัติ
   */
  static buildContextMessage(source: any): string {
    if (!source) return '';

    const parts: string[] = [];

    parts.push('=== บริบทการสนทนา ===');
    parts.push('');

    // Post context
    parts.push('📝 โพสต์ที่ลูกค้าสนใจ:');
    parts.push(`"${this.truncate(source.postContext.message, 300)}"`);

    if (source.postContext.type === 'photo') {
      parts.push('(โพสต์มีรูปภาพประกอบ)');
    } else if (source.postContext.type === 'video') {
      parts.push('(โพสต์มีวิดีโอประกอบ)');
    }
    parts.push('');

    // Comment context
    parts.push('💬 คอมเมนต์ของลูกค้า:');
    parts.push(`"${source.commentText}"`);
    parts.push('');

    // AI Instructions
    if (source.aiInstructions) {
      parts.push('📋 คำสั่งพิเศษสำหรับการตอบ:');
      parts.push(source.aiInstructions);
      parts.push('');
    }

    // AI Context
    if (source.aiContext) {
      parts.push('ℹ️ ข้อมูลเพิ่มเติม:');
      parts.push(source.aiContext);
      parts.push('');
    }

    parts.push('=========================');

    return parts.join('\n');
  }

  /**
   * Truncate text
   */
  static truncate(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * หา message ล่าสุดที่มี source (auto reply)
   */
  static findLatestSourceMessage(messages: any[]): any | null {
    // หาจากหลังมาหน้า
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].source && messages[i].isAutoReply) {
        return messages[i];
      }
    }
    return null;
  }

  /**
   * Extract product info from post (optional)
   */
  static extractProductInfo(postMessage: string): {
    name?: string;
    price?: string;
  } {
    const info: any = {};

    // Extract price
    const priceMatch = postMessage.match(/(\d+)\s*(บาท|฿|.-)/);
    if (priceMatch) {
      info.price = priceMatch[1] + ' บาท';
    }

    // Extract product name (first line)
    const lines = postMessage.split('\n');
    if (lines.length > 0) {
      info.name = lines[0].substring(0, 100);
    }

    return info;
  }
}

export default AIContextBuilder;

