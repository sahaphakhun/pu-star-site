/**
 * Script สำหรับแปลงข้อมูล Excel เป็น TypeScript
 * รัน: node src/data/convertExcelToTs.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ThepExcel-Thailand-Tambon.xlsx');
const outputPath = path.join(__dirname, 'thaiAddressData.ts');

const workbook = XLSX.readFile(filePath);
const data = XLSX.utils.sheet_to_json(workbook.Sheets['TambonDatabase']);

// Extract unique provinces
const provincesMap = new Map();
const districtsMap = new Map();
const subdistrictsArr = [];

data.forEach(row => {
    // Province
    const provinceId = Number(row.ProvinceID);
    if (!provincesMap.has(provinceId)) {
        provincesMap.set(provinceId, {
            id: provinceId,
            name: row.ProvinceThai,
            nameEn: row.ProvinceEng,
        });
    }

    // District
    const districtId = Number(row.DistrictID);
    if (!districtsMap.has(districtId)) {
        districtsMap.set(districtId, {
            id: districtId,
            provinceId: provinceId,
            name: row.DistrictThaiShort,
            nameEn: row.DistrictEngShort,
        });
    }

    // Subdistrict
    subdistrictsArr.push({
        id: Number(row.TambonID),
        districtId: districtId,
        name: row.TambonThaiShort,
        nameEn: row.TambonEngShort,
        zipcode: String(row.PostCodeMain),
    });
});

// Sort arrays
const provinces = Array.from(provincesMap.values()).sort((a, b) => a.id - b.id);
const districts = Array.from(districtsMap.values()).sort((a, b) => a.id - b.id);
const subdistricts = subdistrictsArr.sort((a, b) => a.id - b.id);

console.log(`Provinces: ${provinces.length}`);
console.log(`Districts: ${districts.length}`);
console.log(`Subdistricts: ${subdistricts.length}`);

// Generate TypeScript file
const tsContent = `/**
 * ข้อมูลที่อยู่ประเทศไทย ${provinces.length} จังหวัด พร้อมอำเภอ/เขต และตำบล/แขวง
 * แปลงจาก ThepExcel-Thailand-Tambon.xlsx
 */

export interface Province {
  id: number;
  name: string;
  nameEn: string;
}

export interface District {
  id: number;
  provinceId: number;
  name: string;
  nameEn: string;
}

export interface Subdistrict {
  id: number;
  districtId: number;
  name: string;
  nameEn: string;
  zipcode: string;
}

// ข้อมูล ${provinces.length} จังหวัด
export const provinces: Province[] = ${JSON.stringify(provinces, null, 2)};

// ข้อมูล ${districts.length} อำเภอ/เขต
export const districts: District[] = ${JSON.stringify(districts, null, 2)};

// ข้อมูล ${subdistricts.length} ตำบล/แขวง
export const subdistricts: Subdistrict[] = ${JSON.stringify(subdistricts, null, 2)};

// ฟังก์ชันค้นหาจังหวัด
export function searchProvinces(keyword: string): Province[] {
  const lowerKeyword = keyword.toLowerCase().trim();
  if (!lowerKeyword) return provinces;
  return provinces.filter(p => 
    p.name.includes(lowerKeyword) || 
    p.nameEn.toLowerCase().includes(lowerKeyword)
  );
}

// ฟังก์ชันดึงอำเภอตามจังหวัด
export function getDistrictsByProvince(provinceId: number): District[] {
  return districts.filter(d => d.provinceId === provinceId);
}

// ฟังก์ชันค้นหาอำเภอ
export function searchDistricts(keyword: string, provinceId?: number): District[] {
  const lowerKeyword = keyword.toLowerCase().trim();
  let result = provinceId ? districts.filter(d => d.provinceId === provinceId) : districts;
  if (!lowerKeyword) return result;
  return result.filter(d => 
    d.name.includes(lowerKeyword) || 
    d.nameEn.toLowerCase().includes(lowerKeyword)
  );
}

// ฟังก์ชันดึงตำบลตามอำเภอ
export function getSubdistrictsByDistrict(districtId: number): Subdistrict[] {
  return subdistricts.filter(s => s.districtId === districtId);
}

// ฟังก์ชันค้นหาตำบล
export function searchSubdistricts(keyword: string, districtId?: number): Subdistrict[] {
  const lowerKeyword = keyword.toLowerCase().trim();
  let result = districtId ? subdistricts.filter(s => s.districtId === districtId) : subdistricts;
  if (!lowerKeyword) return result;
  return result.filter(s => 
    s.name.includes(lowerKeyword) || 
    s.nameEn.toLowerCase().includes(lowerKeyword) ||
    s.zipcode.includes(lowerKeyword)
  );
}

// ฟังก์ชันดึงจังหวัดตาม ID
export function getProvinceById(id: number): Province | undefined {
  return provinces.find(p => p.id === id);
}

// ฟังก์ชันดึงอำเภอตาม ID
export function getDistrictById(id: number): District | undefined {
  return districts.find(d => d.id === id);
}

// ฟังก์ชันดึงจังหวัดตามชื่อ
export function getProvinceByName(name: string): Province | undefined {
  return provinces.find(p => p.name === name || p.nameEn.toLowerCase() === name.toLowerCase());
}

// ฟังก์ชันดึงอำเภอตามชื่อ
export function getDistrictByName(name: string, provinceId?: number): District | undefined {
  const filtered = provinceId ? districts.filter(d => d.provinceId === provinceId) : districts;
  return filtered.find(d => d.name === name || d.nameEn.toLowerCase() === name.toLowerCase());
}
`;

fs.writeFileSync(outputPath, tsContent, 'utf-8');
console.log('Generated:', outputPath);
