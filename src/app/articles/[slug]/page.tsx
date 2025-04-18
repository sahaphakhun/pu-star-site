import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// สมมติข้อมูลบทความ (ในอนาคตสามารถดึงจาก API หรือ CMS)
const articlesData = [
  {
    id: "1",
    title: "วิธีเลือกซีลแลนท์ให้เหมาะกับงาน",
    slug: "how-to-choose-sealant",
    category: "คู่มือการใช้งาน",
    imageSrc: "/blog-sealant.jpg",
    excerpt: "แนะนำการเลือกใช้ซีลแลนท์แต่ละประเภทให้เหมาะกับงานก่อสร้างและตกแต่งบ้าน...",
    publishDate: "25 มิถุนายน 2023",
    author: "ทีมงาน PU STAR",
    authorImage: "/author-profile.jpg",
    content: `
      <p class="mb-4">ซีลแลนท์เป็นวัสดุสำคัญในงานก่อสร้างและตกแต่งบ้าน ที่ช่วยป้องกันการรั่วซึมของน้ำและอากาศ รวมถึงช่วยในการยึดติด แต่ซีลแลนท์มีหลายประเภทที่มีคุณสมบัติแตกต่างกัน การเลือกใช้ให้เหมาะกับงานจึงเป็นสิ่งสำคัญ</p>
      
      <h2 class="text-2xl font-bold text-primary mt-8 mb-4">ประเภทของซีลแลนท์</h2>
      
      <h3 class="text-xl font-bold text-primary mt-6 mb-3">1. ซิลิโคนซีลแลนท์ (Silicone Sealant)</h3>
      <p class="mb-4">เป็นซีลแลนท์ที่มีความยืดหยุ่นสูง ทนต่อความร้อนและรังสี UV ได้ดี ไม่เป็นพิษเมื่อแห้งตัว นิยมใช้ในงานต่อไปนี้:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>งานยาแนวกระจก อลูมิเนียม และวัสดุที่ไม่มีรูพรุน</li>
        <li>ห้องน้ำ ห้องครัว เนื่องจากทนความชื้นได้ดี</li>
        <li>งานภายนอกอาคารที่สัมผัสแสงแดดโดยตรง</li>
      </ul>
      
      <h3 class="text-xl font-bold text-primary mt-6 mb-3">2. อะคริลิคซีลแลนท์ (Acrylic Sealant)</h3>
      <p class="mb-4">เป็นซีลแลนท์ที่มีราคาถูก ทาสีทับได้ แต่ความยืดหยุ่นน้อยกว่าซิลิโคน เหมาะกับ:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>งานยาแนวรอยต่อภายในที่มีการขยับตัวน้อย</li>
        <li>รอยแตกร้าวบนผนัง ฝ้าเพดาน</li>
        <li>งานที่ต้องทาสีทับ</li>
      </ul>
      
      <h3 class="text-xl font-bold text-primary mt-6 mb-3">3. โพลียูรีเทนซีลแลนท์ (Polyurethane Sealant)</h3>
      <p class="mb-4">มีความแข็งแรงสูง ยึดเกาะวัสดุได้หลากหลาย ทาสีทับได้ แต่ไม่ทนต่อรังสี UV เท่าซิลิโคน เหมาะกับ:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>งานโครงสร้างอาคารที่ต้องการความแข็งแรง</li>
        <li>รอยต่อพื้น ผนัง ที่มีการขยับตัวสูง</li>
        <li>งานยาแนวคอนกรีต ไม้ โลหะ</li>
      </ul>
      
      <h3 class="text-xl font-bold text-primary mt-6 mb-3">4. ซีลแลนท์ผสม (Hybrid Sealant)</h3>
      <p class="mb-4">เป็นซีลแลนท์รุ่นใหม่ที่ผสมคุณสมบัติของซิลิโคนและโพลียูรีเทน มีความยืดหยุ่นดี ทาสีทับได้ และทนรังสี UV ได้ดี เหมาะกับ:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>งานที่ต้องการคุณสมบัติรอบด้าน</li>
        <li>งานภายนอกที่ต้องทาสีทับ</li>
      </ul>
      
      <h2 class="text-2xl font-bold text-primary mt-8 mb-4">ปัจจัยในการเลือกซีลแลนท์</h2>
      
      <h3 class="text-xl font-bold text-primary mt-6 mb-3">1. วัสดุที่ต้องการยึดติด</h3>
      <p class="mb-4">ตรวจสอบว่าซีลแลนท์นั้นๆ เหมาะกับวัสดุที่จะใช้งานหรือไม่ เช่น ซิลิโคนไม่เหมาะกับการยึดติดกับคอนกรีต</p>
      
      <h3 class="text-xl font-bold text-primary mt-6 mb-3">2. สภาพแวดล้อมการใช้งาน</h3>
      <p class="mb-4">พิจารณาว่าเป็นงานภายในหรือภายนอก สัมผัสความชื้นหรือไม่ เช่น งานภายนอกควรใช้ซีลแลนท์ที่ทน UV</p>
      
      <h3 class="text-xl font-bold text-primary mt-6 mb-3">3. การขยายตัวของรอยต่อ</h3>
      <p class="mb-4">หากรอยต่อมีการขยับตัวมาก ควรเลือกซีลแลนท์ที่มีความยืดหยุ่นสูง เช่น ซิลิโคนหรือโพลียูรีเทน</p>
      
      <h3 class="text-xl font-bold text-primary mt-6 mb-3">4. ความต้องการในการทาสีทับ</h3>
      <p class="mb-4">หากต้องการทาสีทับซีลแลนท์ ควรเลือกอะคริลิคหรือโพลียูรีเทน เพราะซิลิโคนไม่สามารถทาสีทับได้</p>
      
      <div class="bg-primary/5 p-4 rounded-lg my-8">
        <h3 class="text-xl font-bold text-primary mb-3">คำแนะนำจากผู้เชี่ยวชาญ</h3>
        <p>การเลือกใช้ซีลแลนท์ที่เหมาะสมจะช่วยยืดอายุการใช้งานและเพิ่มประสิทธิภาพของงาน หากไม่แน่ใจว่าควรเลือกใช้ประเภทใด สามารถปรึกษาทีมงาน PU STAR เพื่อขอคำแนะนำเพิ่มเติมได้</p>
      </div>
      
      <p class="mb-4">นอกจากการเลือกประเภทซีลแลนท์ที่เหมาะสมแล้ว วิธีการใช้งานที่ถูกต้องก็มีความสำคัญไม่แพ้กัน ติดตามบทความต่อไปของเราเพื่อเรียนรู้เทคนิคการใช้งานซีลแลนท์อย่างมืออาชีพ</p>
    `,
    relatedArticles: ["2", "3", "4"]
  },
  {
    id: "2",
    title: "เทคนิคการใช้งานกาว PU อย่างมืออาชีพ",
    slug: "pu-adhesive-professional-techniques",
    category: "เทคนิคการใช้งาน",
    imageSrc: "/blog-adhesive.jpg",
    excerpt: "เผยเคล็ดลับการใช้งานกาว PU ให้ได้ประสิทธิภาพสูงสุดและปลอดภัย...",
    publishDate: "18 มิถุนายน 2023",
    author: "ทีมงาน PU STAR",
    authorImage: "/author-profile.jpg",
    content: `
      <p class="mb-4">กาว PU หรือ Polyurethane Adhesive เป็นกาวที่มีความแข็งแรงสูง ทนทานต่อแรงกระแทก และสามารถใช้ได้กับวัสดุหลากหลาย ไม่ว่าจะเป็นไม้ โลหะ พลาสติก หรือเซรามิค ในบทความนี้เราจะแนะนำเทคนิคการใช้งานกาว PU อย่างมืออาชีพ</p>
      
      <h2 class="text-2xl font-bold text-primary mt-8 mb-4">เทคนิคการใช้งานกาว PU</h2>
      
      <h3 class="text-xl font-bold text-primary mt-6 mb-3">1. การเตรียมพื้นผิว</h3>
      <p class="mb-4">พื้นผิวที่สะอาดและแห้งเป็นสิ่งสำคัญในการยึดติดที่ดี:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>ทำความสะอาดพื้นผิวให้ปราศจากฝุ่น น้ำมัน และสิ่งสกปรก</li>
        <li>ขัดพื้นผิวเรียบด้วยกระดาษทรายละเอียดเพื่อเพิ่มการยึดเกาะ</li>
        <li>เช็ดด้วยแอลกอฮอล์หรือสารทำความสะอาดที่เหมาะสม</li>
        <li>รอให้พื้นผิวแห้งสนิทก่อนทากาว</li>
      </ul>
      
      <p class="mb-4">โปรดเพิ่มเนื้อหาเกี่ยวกับเทคนิคการใช้งานกาว PU ต่อไป...</p>
    `,
    relatedArticles: ["1", "3", "5"]
  }
];

export default function ArticlePage({ params }: { params: { slug: string } }) {
  // ค้นหาบทความจาก slug
  const article = articlesData.find((article) => article.slug === params.slug);
  
  // ถ้าไม่พบบทความให้แสดงหน้า 404
  if (!article) {
    notFound();
  }
  
  // ดึงบทความที่เกี่ยวข้อง
  const relatedArticles = article.relatedArticles
    ? articlesData.filter((a) => article.relatedArticles.includes(a.id))
    : [];

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      <div className="mb-4">
        <Link href="/articles" className="text-accent hover:underline flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          กลับไปยังบทความทั้งหมด
        </Link>
      </div>

      <article>
        {/* ส่วนหัวบทความ */}
        <header className="mb-8">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {article.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image 
                  src={article.authorImage} 
                  alt={article.author} 
                  fill
                  className="object-cover"
                />
              </div>
              <span>{article.author}</span>
            </div>
            <span>|</span>
            <span>{article.publishDate}</span>
          </div>
          <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden">
            <Image
              src={article.imageSrc}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </header>
        
        {/* เนื้อหาบทความ */}
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        
        {/* แชร์บทความ */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">แชร์บทความนี้</h3>
          <div className="flex gap-3">
            <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600" aria-label="Share on Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
              </svg>
            </button>
            <button className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500" aria-label="Share on Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </button>
            <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600" aria-label="Share on Line">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
            </button>
            <button className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300" aria-label="Copy Link">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
          </div>
        </div>
      </article>
      
      {/* บทความที่เกี่ยวข้อง */}
      {relatedArticles.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-primary mb-6">บทความที่เกี่ยวข้อง</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <div
                key={relatedArticle.id}
                className="bg-white rounded-lg overflow-hidden shadow border border-gray-100 hover:shadow-md transition-shadow"
              >
                <Link href={`/articles/${relatedArticle.slug}`}>
                  <div className="relative h-40 w-full">
                    <Image
                      src={relatedArticle.imageSrc}
                      alt={relatedArticle.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {relatedArticle.category}
                    </span>
                  </div>
                  <Link href={`/articles/${relatedArticle.slug}`}>
                    <h3 className="font-bold text-primary mb-2 hover:text-accent transition-colors">
                      {relatedArticle.title}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm">{relatedArticle.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
} 