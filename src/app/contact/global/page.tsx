import React from "react";
import Image from "next/image";

export default function GlobalContactsPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto">
      {/* หัวข้อหน้า */}
      <section className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">สาขาทั่วโลก</h1>
        <p className="text-gray-600 mt-2">
          Guangdong Pustar Adhesives & Sealants Co. Ltd. มีเครือข่ายทั่วโลก
          พร้อมให้บริการคุณในทุกภูมิภาค
        </p>
      </section>

      {/* แผนที่โลก */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-4">เครือข่ายทั่วโลกของเรา</h2>
        <div className="relative w-full h-96 bg-gray-100 rounded-md mb-4 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16 text-primary/20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {/* แสดงรูปแผนที่โลกพร้อมจุดตำแหน่งของบริษัท */}
          <Image 
            src="/globe.svg" 
            alt="แผนที่เครือข่ายทั่วโลก" 
            fill
            className="object-contain p-4"
          />
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <span className="bg-primary/10 px-3 py-1 rounded-full text-primary text-sm">เอเชีย 12 ประเทศ</span>
          <span className="bg-primary/10 px-3 py-1 rounded-full text-primary text-sm">ยุโรป 8 ประเทศ</span>
          <span className="bg-primary/10 px-3 py-1 rounded-full text-primary text-sm">อเมริกา 3 ประเทศ</span>
          <span className="bg-primary/10 px-3 py-1 rounded-full text-primary text-sm">ตะวันออกกลาง 5 ประเทศ</span>
          <span className="bg-primary/10 px-3 py-1 rounded-full text-primary text-sm">แอฟริกา 2 ประเทศ</span>
        </div>
      </section>

      {/* เอเซีย */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          เอเชีย
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* จีน (สำนักงานใหญ่) */}
          <div className="border-b pb-4 md:border-b-0 md:pb-0">
            <h3 className="font-bold text-primary mb-2">จีน (สำนักงานใหญ่)</h3>
            <p className="text-gray-700 mb-2">Guangdong Pustar Adhesives & Sealants Co. Ltd.</p>
            <p className="text-gray-700">Dongfeng East Road, Qingxi Town, Dongguan City, Guangdong Province, China</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: 0769-82010650, 0769-81289105</p>
              <p>อีเมล: ccy@pustar.com, hjq@pustar.com</p>
              <p>เว็บไซต์: www.pustar.com</p>
            </div>
          </div>

          {/* ไทย */}
          <div>
            <h3 className="font-bold text-primary mb-2">ไทย</h3>
            <p className="text-gray-700 mb-2">บริษัท พูสตาร์ (ประเทศไทย) จำกัด</p>
            <p className="text-gray-700">123/456 อาคารพูสตาร์ ชั้น 15, ถนนสุขุมวิท, กรุงเทพฯ 10110, ประเทศไทย</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: 02-123-4567</p>
              <p>อีเมล: info@pustar-thailand.com</p>
              <p>เว็บไซต์: www.pustar-thailand.com</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* ญี่ปุ่น */}
          <div className="border-b pb-4 md:border-b-0 md:pb-0">
            <h3 className="font-bold text-primary mb-2">ญี่ปุ่น</h3>
            <p className="text-gray-700 mb-2">Pustar Japan Co., Ltd.</p>
            <p className="text-gray-700">1-2-3 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +81-3-1234-5678</p>
              <p>อีเมล: info@pustar-japan.com</p>
            </div>
          </div>

          {/* เกาหลีใต้ */}
          <div>
            <h3 className="font-bold text-primary mb-2">เกาหลีใต้</h3>
            <p className="text-gray-700 mb-2">Pustar Korea Corp.</p>
            <p className="text-gray-700">123 Teheran-ro, Gangnam-gu, Seoul, 06123, South Korea</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +82-2-1234-5678</p>
              <p>อีเมล: info@pustar-korea.com</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* มาเลเซีย */}
          <div className="border-b pb-4 md:border-b-0 md:pb-0">
            <h3 className="font-bold text-primary mb-2">มาเลเซีย</h3>
            <p className="text-gray-700 mb-2">Pustar Malaysia Sdn. Bhd.</p>
            <p className="text-gray-700">Level 16, Menara LGB, 1 Jalan Wan Kadir, Taman Tun Dr. Ismail, 60000 Kuala Lumpur, Malaysia</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +60-3-7712-3456</p>
              <p>อีเมล: info@pustar-malaysia.com</p>
            </div>
          </div>

          {/* สิงคโปร์ */}
          <div>
            <h3 className="font-bold text-primary mb-2">สิงคโปร์</h3>
            <p className="text-gray-700 mb-2">Pustar Singapore Pte. Ltd.</p>
            <p className="text-gray-700">1 Raffles Place, #44-01 One Raffles Place, Singapore 048616</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +65-6123-4567</p>
              <p>อีเมล: info@pustar-singapore.com</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button className="text-accent hover:underline font-medium">ดูสาขาในเอเชียทั้งหมด</button>
        </div>
      </section>

      {/* ยุโรป */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          ยุโรป
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* เยอรมนี */}
          <div className="border-b pb-4 md:border-b-0 md:pb-0">
            <h3 className="font-bold text-primary mb-2">เยอรมนี</h3>
            <p className="text-gray-700 mb-2">Pustar Deutschland GmbH</p>
            <p className="text-gray-700">Musterstraße 123, 10115 Berlin, Germany</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +49-30-1234-5678</p>
              <p>อีเมล: info@pustar-deutschland.de</p>
            </div>
          </div>

          {/* สหราชอาณาจักร */}
          <div>
            <h3 className="font-bold text-primary mb-2">สหราชอาณาจักร</h3>
            <p className="text-gray-700 mb-2">Pustar UK Ltd.</p>
            <p className="text-gray-700">123 High Street, London, SW1A 1AA, United Kingdom</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +44-20-1234-5678</p>
              <p>อีเมล: info@pustar-uk.co.uk</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* ฝรั่งเศส */}
          <div className="border-b pb-4 md:border-b-0 md:pb-0">
            <h3 className="font-bold text-primary mb-2">ฝรั่งเศส</h3>
            <p className="text-gray-700 mb-2">Pustar France S.A.S.</p>
            <p className="text-gray-700">123 Avenue des Champs-Élysées, 75008 Paris, France</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +33-1-2345-6789</p>
              <p>อีเมล: info@pustar-france.fr</p>
            </div>
          </div>

          {/* อิตาลี */}
          <div>
            <h3 className="font-bold text-primary mb-2">อิตาลี</h3>
            <p className="text-gray-700 mb-2">Pustar Italia S.r.l.</p>
            <p className="text-gray-700">Via Roma 123, 20121 Milano MI, Italy</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +39-02-1234-5678</p>
              <p>อีเมล: info@pustar-italia.it</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button className="text-accent hover:underline font-medium">ดูสาขาในยุโรปทั้งหมด</button>
        </div>
      </section>

      {/* อเมริกา */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          อเมริกา
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* สหรัฐอเมริกา */}
          <div className="border-b pb-4 md:border-b-0 md:pb-0">
            <h3 className="font-bold text-primary mb-2">สหรัฐอเมริกา</h3>
            <p className="text-gray-700 mb-2">Pustar USA Inc.</p>
            <p className="text-gray-700">123 Main Street, Suite 456, New York, NY 10001, USA</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +1-212-123-4567</p>
              <p>อีเมล: info@pustar-usa.com</p>
            </div>
          </div>

          {/* แคนาดา */}
          <div>
            <h3 className="font-bold text-primary mb-2">แคนาดา</h3>
            <p className="text-gray-700 mb-2">Pustar Canada Ltd.</p>
            <p className="text-gray-700">123 Bay Street, Toronto, ON M5J 2T3, Canada</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +1-416-123-4567</p>
              <p>อีเมล: info@pustar-canada.ca</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* บราซิล */}
          <div>
            <h3 className="font-bold text-primary mb-2">บราซิล</h3>
            <p className="text-gray-700 mb-2">Pustar Brasil Ltda.</p>
            <p className="text-gray-700">Av. Paulista, 123 - Bela Vista, São Paulo - SP, 01311-000, Brazil</p>
            <div className="mt-3 text-sm text-gray-700">
              <p>โทรศัพท์: +55-11-1234-5678</p>
              <p>อีเมล: info@pustar-brasil.com.br</p>
            </div>
          </div>
        </div>
      </section>

      {/* ติดต่อสำหรับภูมิภาคอื่นๆ */}
      <section className="bg-white rounded-lg shadow-md p-6 border border-primary/10">
        <h2 className="text-2xl font-semibold text-primary mb-4">ติดต่อสำหรับภูมิภาคอื่นๆ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-primary mb-2">ตะวันออกกลางและแอฟริกา</h3>
            <p className="text-gray-700">ติดต่อ: คุณ Mohammed Al-Zahrani (Middle East & Africa Regional Manager)</p>
            <p className="text-gray-700">โทรศัพท์: +971-4-123-4567</p>
            <p className="text-gray-700">อีเมล: mea@pustar.com</p>
          </div>
          <div>
            <h3 className="font-bold text-primary mb-2">การขยายธุรกิจระหว่างประเทศ</h3>
            <p className="text-gray-700">ติดต่อ: คุณ Sarah Johnson (International Business Development Director)</p>
            <p className="text-gray-700">โทรศัพท์: +86-755-1234-5678</p>
            <p className="text-gray-700">อีเมล: international@pustar.com</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/10 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-primary mb-3">สนใจเป็นพันธมิตรทางธุรกิจกับ PU STAR?</h2>
        <p className="text-gray-700 mb-4">เรายินดีต้อนรับพันธมิตรทางธุรกิจจากทั่วโลก หากคุณสนใจเป็นตัวแทนจำหน่ายในพื้นที่ที่เรายังไม่มีสาขา</p>
        <a 
          href="/contact/distributors" 
          className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          ติดต่อเพื่อเป็นตัวแทนจำหน่าย
        </a>
      </section>
    </div>
  );
} 