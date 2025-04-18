import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// สมมติข้อมูลหมวดหมู่และบทความ (ในอนาคตสามารถดึงจาก API หรือ CMS)
const categories = [
  { name: "ทั้งหมด", slug: "" },
  { name: "คู่มือการใช้งาน", slug: "manuals" },
  { name: "เทคนิคการใช้งาน", slug: "techniques" },
  { name: "นวัตกรรมใหม่", slug: "innovations" },
  { name: "ข่าวสารอุตสาหกรรม", slug: "industry-news" },
  { name: "ข่าวกิจกรรมบริษัท", slug: "company-news" },
];

const articles = [
  {
    id: "1",
    title: "วิธีเลือกซีลแลนท์ให้เหมาะกับงาน",
    slug: "how-to-choose-sealant",
    category: "manuals",
    categoryThai: "คู่มือการใช้งาน",
    imageSrc: "/blog-sealant.jpg",
    excerpt: "แนะนำการเลือกใช้ซีลแลนท์แต่ละประเภทให้เหมาะกับงานก่อสร้างและตกแต่งบ้าน...",
    publishDate: "25 มิถุนายน 2023"
  },
  {
    id: "2",
    title: "เทคนิคการใช้งานกาว PU อย่างมืออาชีพ",
    slug: "pu-adhesive-professional-techniques",
    category: "techniques",
    categoryThai: "เทคนิคการใช้งาน",
    imageSrc: "/blog-adhesive.jpg",
    excerpt: "เผยเคล็ดลับการใช้งานกาว PU ให้ได้ประสิทธิภาพสูงสุดและปลอดภัย...",
    publishDate: "18 มิถุนายน 2023"
  },
  {
    id: "3",
    title: "5 เทคนิคงานก่อสร้างที่ช่างมืออาชีพใช้",
    slug: "5-professional-construction-techniques",
    category: "techniques",
    categoryThai: "เทคนิคการใช้งาน",
    imageSrc: "/blog-construction.jpg",
    excerpt: "เคล็ดลับและวิธีการทำงานก่อสร้างให้มีประสิทธิภาพและคุณภาพสูงจากช่างมืออาชีพ...",
    publishDate: "10 มิถุนายน 2023"
  },
  {
    id: "4",
    title: "นวัตกรรมใหม่ในวงการซีลแลนท์ปี 2023",
    slug: "new-sealant-innovations-2023",
    category: "innovations",
    categoryThai: "นวัตกรรมใหม่",
    imageSrc: "/blog-innovation.jpg",
    excerpt: "ติดตามความก้าวหน้าและนวัตกรรมล่าสุดในวงการผลิตภัณฑ์ซีลแลนท์และกาว...",
    publishDate: "3 มิถุนายน 2023"
  },
  {
    id: "5",
    title: "การจัดการฉนวนในงานคอนโดมิเนียม",
    slug: "insulation-management-condominium",
    category: "manuals",
    categoryThai: "คู่มือการใช้งาน",
    imageSrc: "/blog-insulation.jpg",
    excerpt: "เรียนรู้วิธีการจัดการฉนวนกันความร้อนและเสียงในโครงการคอนโดมิเนียมใหญ่...",
    publishDate: "25 พฤษภาคม 2023"
  },
  {
    id: "6",
    title: "งานเอ็กซ์โปวัสดุก่อสร้างครั้งที่ 35 Pustar พร้อมให้บริการ",
    slug: "construction-expo-35-pustar",
    category: "company-news",
    categoryThai: "ข่าวกิจกรรมบริษัท",
    imageSrc: "/blog-expo.jpg",
    excerpt: "Pustar เข้าร่วมงานเอ็กซ์โปวัสดุก่อสร้างครั้งที่ 35 พร้อมนำเสนอผลิตภัณฑ์ใหม่ล่าสุด...",
    publishDate: "15 พฤษภาคม 2023"
  },
  {
    id: "7",
    title: "แนวโน้มอุตสาหกรรมก่อสร้างปี 2023",
    slug: "construction-industry-trends-2023",
    category: "industry-news",
    categoryThai: "ข่าวสารอุตสาหกรรม",
    imageSrc: "/blog-industry.jpg",
    excerpt: "รวบรวมแนวโน้มและทิศทางของอุตสาหกรรมก่อสร้างในปี 2023 ที่ผู้ประกอบการควรติดตาม...",
    publishDate: "5 พฤษภาคม 2023"
  },
];

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  // ตรวจสอบว่าหมวดหมู่มีอยู่จริงหรือไม่
  const validCategory = categories.find(cat => cat.slug === params.category);
  
  if (!validCategory && params.category !== "all") {
    notFound();
  }
  
  // กรองบทความตามหมวดหมู่
  const filteredArticles = params.category === "all" 
    ? articles 
    : articles.filter(article => article.category === params.category);
  
  // ชื่อหมวดหมู่ภาษาไทย
  const categoryName = validCategory ? validCategory.name : "บทความทั้งหมด";

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          {categoryName}
        </h1>
        <p className="text-gray-600">บทความและข้อมูลเกี่ยวกับ {categoryName.toLowerCase()} จาก PU STAR Thailand</p>
      </div>

      {/* หมวดหมู่บทความ */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 md:space-x-4 min-w-max">
          <Link
            href="/articles"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${params.category === undefined ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            ทั้งหมด
          </Link>
          {categories.filter(cat => cat.slug !== "").map((category) => (
            <Link
              key={category.name}
              href={`/articles/${category.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${params.category === category.slug ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* กล่องค้นหา */}
      <div className="mb-8">
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <input
            type="text"
            placeholder="ค้นหาบทความ..."
            className="flex-1 px-4 py-2 focus:outline-none"
          />
          <button className="bg-primary text-white px-6 py-2 font-medium hover:bg-primary/90 transition-colors">
            ค้นหา
          </button>
        </div>
      </div>

      {/* รายการบทความ */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <Link href={`/articles/${article.slug}`}>
                <div className="relative h-48 w-full">
                  <Image
                    src={article.imageSrc}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {article.categoryThai}
                  </span>
                  <span className="text-xs text-gray-500">{article.publishDate}</span>
                </div>
                <Link href={`/articles/${article.slug}`}>
                  <h2 className="text-xl font-bold text-primary mb-2 hover:text-accent transition-colors">
                    {article.title}
                  </h2>
                </Link>
                <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
                <Link
                  href={`/articles/${article.slug}`}
                  className="text-accent font-medium text-sm hover:underline"
                >
                  อ่านต่อ
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">ไม่พบบทความในหมวดหมู่นี้</h2>
          <p className="text-gray-500 mb-6">ขออภัย ยังไม่มีบทความในหมวดหมู่ที่คุณกำลังค้นหา</p>
          <Link
            href="/articles"
            className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            ดูบทความทั้งหมด
          </Link>
        </div>
      )}

      {/* ปุ่มโหลดเพิ่มเติม */}
      {filteredArticles.length > 6 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-2 bg-white border border-primary text-primary rounded-md font-medium hover:bg-primary/5 transition-colors">
            โหลดบทความเพิ่มเติม
          </button>
        </div>
      )}
    </div>
  );
} 