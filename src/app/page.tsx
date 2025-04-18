import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-10 p-8 max-w-5xl mx-auto">
      {/* แถวที่ 1: แบนเนอร์สโลแกน */}
      <section className="flex flex-col items-center justify-center text-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="text-accent">PU STAR</span> <span className="text-primary">THAILAND</span>
        </h1>
        <p className="text-lg text-gray-700 max-w-xl">ผู้นำด้านผลิตภัณฑ์ซีลแลนท์และกาวสำหรับงานก่อสร้างและตกแต่งภายใน</p>
      </section>

      {/* แถวที่ 2: อ่านบล็อก */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-primary">บทความล่าสุด</h2>
          <Link href="/blog" className="text-accent hover:underline">ดูทั้งหมด</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* ตัวอย่างบทความ 1 */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 border border-primary/10">
            <div className="relative w-full h-40 mb-2">
              <Image 
                src="/blog-sealant.jpg" 
                alt="วิธีเลือกซีลแลนท์" 
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="font-bold text-primary">วิธีเลือกซีลแลนท์ให้เหมาะกับงาน</h3>
            <p className="text-gray-600 text-sm">แนะนำการเลือกใช้ซีลแลนท์แต่ละประเภทให้เหมาะกับงานก่อสร้างและตกแต่งบ้าน...</p>
            <Link href="/blog/1" className="text-accent text-sm hover:underline">อ่านต่อ</Link>
          </div>
          
          {/* ตัวอย่างบทความ 2 */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 border border-primary/10">
            <div className="relative w-full h-40 mb-2">
              <Image 
                src="/blog-adhesive.jpg" 
                alt="เทคนิคการใช้งานกาว PU" 
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="font-bold text-primary">เทคนิคการใช้งานกาว PU อย่างมืออาชีพ</h3>
            <p className="text-gray-600 text-sm">เผยเคล็ดลับการใช้งานกาว PU ให้ได้ประสิทธิภาพสูงสุดและปลอดภัย...</p>
            <Link href="/blog/2" className="text-accent text-sm hover:underline">อ่านต่อ</Link>
          </div>
          
          {/* ตัวอย่างบทความ 3 */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 border border-primary/10">
            <div className="relative w-full h-40 mb-2">
              <Image 
                src="/blog-construction.jpg" 
                alt="เทคนิคงานก่อสร้าง" 
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="font-bold text-primary">5 เทคนิคงานก่อสร้างที่ช่างมืออาชีพใช้</h3>
            <p className="text-gray-600 text-sm">เคล็ดลับและวิธีการทำงานก่อสร้างให้มีประสิทธิภาพและคุณภาพสูงจากช่างมืออาชีพ...</p>
            <Link href="/blog/3" className="text-accent text-sm hover:underline">อ่านต่อ</Link>
          </div>
          
          {/* ตัวอย่างบทความ 4 */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 border border-primary/10">
            <div className="relative w-full h-40 mb-2">
              <Image 
                src="/blog-innovation.jpg" 
                alt="นวัตกรรมใหม่" 
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="font-bold text-primary">นวัตกรรมใหม่ในวงการซีลแลนท์ปี 2023</h3>
            <p className="text-gray-600 text-sm">ติดตามความก้าวหน้าและนวัตกรรมล่าสุดในวงการผลิตภัณฑ์ซีลแลนท์และกาว...</p>
            <Link href="/blog/4" className="text-accent text-sm hover:underline">อ่านต่อ</Link>
          </div>
        </div>
      </section>

      {/* แถวที่ 3: รายละเอียดบริษัท */}
      <section className="bg-primary/5 rounded-lg p-6 flex flex-col gap-3 border border-primary/20">
        <h2 className="text-2xl font-semibold text-primary mb-2">เกี่ยวกับบริษัท</h2>
        <p className="text-gray-700">Guangdong Pustar Adhesives & Sealants Co. Ltd. เป็นองค์กรไฮเทคที่มีความสามารถในการวิจัยและพัฒนานวัตกรรมด้วยตนเองในด้านผลิตภัณฑ์ซีลแลนท์และกาว บริษัทก่อตั้งขึ้นในปี 2003 ด้วยทุนจดทะเบียน 133 ล้านหยวน</p>
        
        <p className="text-gray-700">ฐานการผลิต Pustar ที่ Dongguan ครอบคลุมพื้นที่ 40,000 ตารางเมตร มีกำลังการผลิตประจำปี 40,000 ตัน ส่วนฐานการผลิตที่ Huizhou มีแผนครอบคลุมพื้นที่ 60,000 ตารางเมตร ด้วยกำลังการผลิตที่ออกแบบไว้ 200,000 ตัน</p>
        
        <p className="text-gray-700">Pustar มีทีมวิจัยและพัฒนาที่มีประสบการณ์ประกอบด้วยบุคลากรกว่า 100 คนที่มีวุฒิการศึกษาระดับปริญญาเอก ปริญญาโท และปริญญาตรี ปัจจุบัน Pustar มีสิทธิบัตรที่ได้รับอนุญาต 49 รายการ รวมถึงสิทธิบัตรการประดิษฐ์ 35 รายการ มาตรฐานระดับชาติและอุตสาหกรรม 17 รายการ และบทความทางวิทยาศาสตร์และเทคโนโลยี 53 รายการ</p>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-primary mb-2">ติดต่อสำหรับภูมิภาคเอเชียและยุโรป</h3>
            <p className="text-sm text-gray-700">โทร: +86-15322878819</p>
            <p className="text-sm text-gray-700">แฟกซ์: +86-0769-82010651</p>
            <p className="text-sm text-gray-700">อีเมล: zj@pustar.com</p>
          </div>
          
          <div>
            <h3 className="font-bold text-primary mb-2">ติดต่อสำหรับอเมริกาเหนือและใต้</h3>
            <p className="text-sm text-gray-700">โทร: +86-13826970996</p>
            <p className="text-sm text-gray-700">แฟกซ์: +86-0769-81289105</p>
            <p className="text-sm text-gray-700">อีเมล: ljh@pustar.com</p>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="font-bold text-primary mb-2">ที่อยู่บริษัท</h3>
          <p className="text-sm text-gray-700">Dongfeng East Road, Qingxi Town, Dongguan City, Guangdong Province, China</p>
          <p className="text-sm text-gray-700">โทรศัพท์: 0769-82010650, 0769-81289105</p>
          <p className="text-sm text-gray-700">อีเมล: ccy@pustar.com, hjq@pustar.com</p>
        </div>
      </section>
    </div>
  );
}
