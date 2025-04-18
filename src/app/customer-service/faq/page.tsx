"use client";
import { useState } from "react";

// ข้อมูลคำถามที่พบบ่อย แบ่งตามหมวดหมู่
const faqData = [
  {
    category: "ผลิตภัณฑ์และการใช้งาน",
    faqs: [
      {
        question: "ต้องการคำแนะนำในการเลือกซีลแลนท์หรือกาวสำหรับงานเฉพาะทางได้อย่างไร?",
        answer: "คุณสามารถติดต่อฝ่ายเทคนิคของเราโดยตรงที่ support@pustar-thailand.com หรือโทร 02-123-4569 ทีมงานผู้เชี่ยวชาญของเราพร้อมให้คำแนะนำเฉพาะทางตามความต้องการของคุณ"
      },
      {
        question: "ผลิตภัณฑ์ PU STAR มีการรับประกันหรือไม่?",
        answer: "ผลิตภัณฑ์ทุกชิ้นของ PU STAR ได้รับการรับประกันคุณภาพตามที่ระบุไว้ในเอกสารผลิตภัณฑ์ หากพบปัญหาใดๆ กรุณาติดต่อฝ่ายบริการลูกค้าของเราทันทีที่ support@pustar-thailand.com"
      },
      {
        question: "ซีลแลนท์และกาวของ PU STAR เก็บรักษาได้นานเท่าไร?",
        answer: "ผลิตภัณฑ์ซีลแลนท์และกาวของ PU STAR มีอายุการใช้งานประมาณ 12-18 เดือนหลังจากวันที่ผลิต เมื่อเก็บในที่แห้งและเย็น อุณหภูมิระหว่าง 5-25°C วันหมดอายุจะระบุไว้บนบรรจุภัณฑ์"
      },
      {
        question: "ผลิตภัณฑ์ PU STAR มีใบรับรองคุณภาพหรือไม่?",
        answer: "ผลิตภัณฑ์ของ PU STAR ได้รับการรับรองมาตรฐานสากลหลายรายการ รวมถึง ISO 9001, ISO 14001 และได้รับการทดสอบตามมาตรฐาน ASTM และ JIS สำหรับใบรับรองเฉพาะผลิตภัณฑ์ สามารถดาวน์โหลดได้จากหน้าผลิตภัณฑ์หรือติดต่อฝ่ายขาย"
      },
      {
        question: "มีเอกสารข้อมูลความปลอดภัย (SDS) ให้ดาวน์โหลดหรือไม่?",
        answer: "เรามีเอกสารข้อมูลความปลอดภัย (SDS) สำหรับผลิตภัณฑ์ทุกรายการ คุณสามารถดาวน์โหลดได้จากหน้าผลิตภัณฑ์แต่ละรายการ หรือติดต่อที่ info@pustar-thailand.com เพื่อขอรับเอกสาร"
      }
    ]
  },
  {
    category: "การสั่งซื้อและจัดส่ง",
    faqs: [
      {
        question: "ฉันจะสั่งซื้อผลิตภัณฑ์ในปริมาณมากได้อย่างไร?",
        answer: "สำหรับการสั่งซื้อจำนวนมาก โปรดติดต่อฝ่ายขายของเราที่ sales@pustar-thailand.com หรือโทร 02-123-4568 เพื่อรับข้อเสนอราคาพิเศษและบริการที่เหมาะกับความต้องการของคุณ"
      },
      {
        question: "ระยะเวลาในการจัดส่งสินค้าใช้เวลานานเท่าไร?",
        answer: "โดยทั่วไป เราจัดส่งสินค้าภายใน 3-5 วันทำการสำหรับพื้นที่ในกรุงเทพฯ และปริมณฑล และ 5-7 วันทำการสำหรับต่างจังหวัด สำหรับการสั่งซื้อจำนวนมากหรือสินค้าตามสั่ง อาจใช้เวลานานขึ้น ซึ่งจะแจ้งให้ทราบเป็นรายกรณี"
      },
      {
        question: "มีค่าจัดส่งสินค้าหรือไม่?",
        answer: "เรามีบริการจัดส่งฟรีสำหรับการสั่งซื้อมูลค่าตั้งแต่ 3,000 บาทขึ้นไป สำหรับการสั่งซื้อที่มีมูลค่าน้อยกว่า จะมีค่าจัดส่งเริ่มต้นที่ 100 บาท ขึ้นอยู่กับน้ำหนักและปลายทาง"
      },
      {
        question: "สามารถติดตามสถานะการจัดส่งได้อย่างไร?",
        answer: "เมื่อสินค้าถูกจัดส่ง เราจะส่งอีเมลแจ้งหมายเลขพัสดุและลิงก์สำหรับติดตามสถานะให้กับคุณ หากไม่ได้รับข้อมูลดังกล่าว สามารถติดต่อฝ่ายลูกค้าสัมพันธ์ได้ที่ support@pustar-thailand.com"
      }
    ]
  },
  {
    category: "บริการหลังการขาย",
    faqs: [
      {
        question: "ฉันจะสมัครเป็นตัวแทนจำหน่ายได้อย่างไร?",
        answer: "หากคุณสนใจเป็นตัวแทนจำหน่ายผลิตภัณฑ์ PU STAR ในประเทศไทย โปรดส่งอีเมลมาที่ partnership@pustar-thailand.com พร้อมแนบประวัติบริษัท และแผนธุรกิจ ทีมงานของเราจะติดต่อกลับภายใน 3 วันทำการ"
      },
      {
        question: "หากผลิตภัณฑ์มีปัญหา ฉันสามารถคืนสินค้าได้หรือไม่?",
        answer: "เรารับประกันคุณภาพของผลิตภัณฑ์ทุกชิ้น หากพบว่าผลิตภัณฑ์มีปัญหาจากการผลิต คุณสามารถส่งคืนภายใน 30 วันพร้อมใบเสร็จ โดยติดต่อที่ support@pustar-thailand.com เพื่อขอคำแนะนำในการส่งคืนสินค้า"
      },
      {
        question: "มีบริการให้คำปรึกษาด้านเทคนิคหลังการขายหรือไม่?",
        answer: "เรามีทีมผู้เชี่ยวชาญด้านเทคนิคพร้อมให้คำปรึกษาและแก้ไขปัญหาตลอดอายุการใช้งานผลิตภัณฑ์ ติดต่อได้ที่ technical@pustar-thailand.com หรือโทร 02-123-4570 ในวันและเวลาทำการ"
      }
    ]
  },
  {
    category: "ข้อมูลทั่วไป",
    faqs: [
      {
        question: "PU STAR เป็นบริษัทของประเทศอะไร?",
        answer: "PU STAR เป็นแบรนด์จากประเทศเยอรมนี ก่อตั้งในปี ค.ศ. 1995 มีฐานการผลิตในทวีปยุโรปและเอเชีย โดยมีสำนักงานใหญ่สำหรับภูมิภาคเอเชียตะวันออกเฉียงใต้ตั้งอยู่ที่ประเทศไทย"
      },
      {
        question: "ผลิตภัณฑ์ของ PU STAR เป็นมิตรกับสิ่งแวดล้อมหรือไม่?",
        answer: "เรามุ่งมั่นในการพัฒนาผลิตภัณฑ์ที่เป็นมิตรกับสิ่งแวดล้อม ผลิตภัณฑ์หลายรายการของเราได้รับการรับรอง Green Label และมีปริมาณสารระเหย (VOC) ต่ำ นอกจากนี้ เรายังมีนโยบายการผลิตที่รับผิดชอบต่อสิ่งแวดล้อมตามมาตรฐาน ISO 14001"
      },
      {
        question: "มีบริการทดสอบผลิตภัณฑ์ก่อนการใช้งานจริงหรือไม่?",
        answer: "เรามีบริการทดสอบผลิตภัณฑ์สำหรับโครงการขนาดใหญ่หรือการใช้งานเฉพาะทาง โดยทีมวิศวกรของเราจะทำงานร่วมกับคุณเพื่อทดสอบและรับรองประสิทธิภาพของผลิตภัณฑ์ในสภาพแวดล้อมการใช้งานจริง ติดต่อฝ่ายเทคนิคที่ technical@pustar-thailand.com เพื่อขอข้อมูลเพิ่มเติม"
      }
    ]
  }
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(faqData[0].category);
  const [expandedQuestions, setExpandedQuestions] = useState<{ [key: string]: boolean }>({});

  const toggleQuestion = (question: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [question]: !prev[question]
    }));
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-primary mb-2">คำถามที่พบบ่อย</h1>
      <p className="text-gray-600 mb-8">ค้นหาคำตอบสำหรับคำถามที่พบบ่อยเกี่ยวกับผลิตภัณฑ์และบริการของ PU STAR</p>
      
      {/* หมวดหมู่ FAQ */}
      <div className="mb-8 flex flex-wrap gap-2">
        {faqData.map((category) => (
          <button
            key={category.category}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeCategory === category.category
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveCategory(category.category)}
          >
            {category.category}
          </button>
        ))}
      </div>

      {/* คำถามและคำตอบ */}
      <div className="space-y-6">
        {faqData
          .find((category) => category.category === activeCategory)
          ?.faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
            >
              <button
                className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition flex justify-between items-center focus:outline-none"
                onClick={() => toggleQuestion(faq.question)}
              >
                <h3 className="font-semibold text-primary">{faq.question}</h3>
                <span className={`transition-transform duration-200 ${expandedQuestions[faq.question] ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedQuestions[faq.question] ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
      </div>
      
      <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-primary mb-4">ไม่พบคำตอบที่คุณต้องการ?</h2>
        <p className="text-gray-700 mb-4">
          หากคุณมีคำถามอื่นที่ไม่ได้อยู่ในรายการนี้ กรุณาติดต่อทีมงานของเราโดยตรง
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <a href="/contact" className="bg-primary text-white px-6 py-3 rounded-lg text-center font-medium hover:bg-primary/90 transition">
            ติดต่อเรา
          </a>
          <a href="mailto:info@pustar-thailand.com" className="bg-white text-primary border border-primary px-6 py-3 rounded-lg text-center font-medium hover:bg-gray-50 transition">
            ส่งอีเมลถึงเรา
          </a>
        </div>
      </div>
    </div>
  );
} 