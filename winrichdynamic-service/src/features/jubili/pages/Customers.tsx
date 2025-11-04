"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Plus, Search, Star, CreditCard, Edit, Tag } from "lucide-react";
import Button from "@/components/ui/Button";
import CustomerFormNew from "@/components/CustomerFormNew";
import CreditApprovalForm from "@/components/CreditApprovalForm";
import ProductProposalForm from "@/components/sales-status/ProductProposalForm";
import QuotationForm from "@/components/sales-status/QuotationForm";
import SampleTestingForm from "@/components/sales-status/SampleTestingForm";
import PriceApprovalForm from "@/components/sales-status/PriceApprovalForm";
import CustomerTagManager from "@/components/CustomerTagManager";

interface CustomerRecord {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  taxId?: string;
  companyName?: string;
  companyAddress?: string;
  shippingAddress?: string;
  customerCode?: string;
  customerType?: "new" | "regular" | "target" | "inactive" | string;
  assignedTo?: string;
  paymentTerms?: string;
  notes?: string;
  tags?: string[];
  priorityStar?: number;
  status?: "planning" | "proposed" | "quoted" | "testing" | "approved" | "closed" | string;
  updatedAt?: string;
  createdAt?: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const renderStars = (importance: number) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < importance ? "fill-red-500 text-red-500" : "text-gray-300"}`}
      />
    ))}
  </div>
);

// ฟังก์ชันสำหรับแสดงสถานะ
const getStatusDisplay = (status?: string) => {
  switch (status) {
    case "planning":
      return { label: "วางแผน", color: "bg-gray-100 text-gray-800 border-gray-300" };
    case "proposed":
      return { label: "นำเสนอสินค้า", color: "bg-blue-100 text-blue-800 border-blue-300" };
    case "quoted":
      return { label: "เสนอราคา", color: "bg-orange-100 text-orange-800 border-orange-300" };
    case "testing":
      return { label: "ทดสอบตัวอย่างสินค้า", color: "bg-purple-100 text-purple-800 border-purple-300" };
    case "approved":
      return { label: "อนุมัติราคา", color: "bg-green-100 text-green-800 border-green-300" };
    case "closed":
      return { label: "ปิดใบเสนอราคา", color: "bg-red-100 text-red-800 border-red-300" };
    default:
      return { label: "วางแผน", color: "bg-gray-100 text-gray-800 border-gray-300" };
  }
};

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [creditCustomer, setCreditCustomer] = useState<CustomerRecord | null>(null);
  
  // สถานะการขาย
  const [showProductProposalForm, setShowProductProposalForm] = useState(false);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [showSampleTestingForm, setShowSampleTestingForm] = useState(false);
  const [showPriceApprovalForm, setShowPriceApprovalForm] = useState(false);
  const [statusCustomer, setStatusCustomer] = useState<CustomerRecord | null>(null);
  
  // จัดการแท็ก
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagCustomer, setTagCustomer] = useState<CustomerRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "pipeline">("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/customers", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "ไม่สามารถโหลดข้อมูลลูกค้าได้");
      }
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setCustomers(list);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const stats = useMemo(() => {
    const total = customers.length;
    const target = customers.filter((c) => c.customerType === "target").length;
    const newly = customers.filter((c) => c.customerType === "new").length;
    const regular = customers.filter((c) => c.customerType === "regular").length;
    const inactive = customers.filter((c) => c.customerType === "inactive").length;
    return { total, target, new: newly, regular, inactive };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return customers.filter((customer) => {
      // Filter by search term
      const fields = [
        customer.name,
        customer.companyName,
        customer.phoneNumber,
        customer.email,
        customer.taxId,
        customer.customerCode,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      
      const matchesSearch = !term || fields.some((value) => value.includes(term));
      
      // Filter by status
      const matchesStatus = !statusFilter || customer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const handleSubmitCustomer = useCallback(
    async (payload: any, options: { customerId?: string }) => {
      const { customerId } = options;
      const url = customerId ? `/api/customers/${customerId}` : "/api/customers";
      const method = customerId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "ไม่สามารถบันทึกลูกค้าได้");
      }

      toast.success(
        customerId ? "อัปเดตข้อมูลลูกค้าเรียบร้อย" : "สร้างลูกค้าใหม่เรียบร้อย"
      );
      setShowForm(false);
      setEditingCustomer(null);
      await loadCustomers();
    },
    [loadCustomers]
  );

  const handleSubmitCreditApproval = useCallback(
    async (payload: any) => {
      try {
        const res = await fetch("/api/credit-approvals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "ไม่สามารถส่งคำขออนุมัติเครดิตได้");
        }

        toast.success("ส่งคำขออนุมัติเครดิตเรียบร้อย");
        setShowCreditForm(false);
        setCreditCustomer(null);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("เกิดข้อผิดพลาดในการส่งคำขออนุมัติเครดิต");
        }
        throw error;
      }
    },
    []
  );

  const handleStatusAction = (customer: CustomerRecord, action: string) => {
    setStatusCustomer(customer);
    
    switch (action) {
      case 'product-proposal':
        setShowProductProposalForm(true);
        break;
      case 'quotation':
        setShowQuotationForm(true);
        break;
      case 'sample-testing':
        setShowSampleTestingForm(true);
        break;
      case 'price-approval':
        setShowPriceApprovalForm(true);
        break;
      default:
        break;
    }
  };

  const handleSubmitStatusAction = async (payload: any) => {
    try {
      const url = `/api/customers/${statusCustomer?._id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'ไม่สามารถอัปเดตข้อมูลลูกค้าได้');
      }

      toast.success('อัปเดตข้อมูลลูกค้าเรียบร้อย');
      
      // ปิดฟอร์มทั้งหมด
      setShowProductProposalForm(false);
      setShowQuotationForm(false);
      setShowSampleTestingForm(false);
      setShowPriceApprovalForm(false);
      setStatusCustomer(null);
      
      await loadCustomers();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า');
      }
      throw error;
    }
  };

  const handleTagManager = (customer: CustomerRecord) => {
    setTagCustomer(customer);
    setShowTagManager(true);
  };

  const handleSubmitTagManager = async (payload: any) => {
    try {
      const url = `/api/customers/${tagCustomer?._id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'ไม่สามารถอัปเดตข้อมูลลูกค้าได้');
      }

      toast.success('อัปเดตแท็กลูกค้าเรียบร้อย');
      setShowTagManager(false);
      setTagCustomer(null);
      await loadCustomers();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า');
      }
      throw error;
    }
  };

  const getRowColor = (index: number) => {
    const colors = [
      "bg-blue-50",
      "bg-purple-50",
      "bg-green-50",
      "bg-orange-50",
      "bg-pink-50",
      "bg-cyan-50",
    ];
    return colors[index % colors.length];
  };

  const getLeftBorderColor = (index: number) => {
    const colors = [
      "border-l-blue-500",
      "border-l-purple-500",
      "border-l-green-500",
      "border-l-orange-500",
      "border-l-pink-500",
      "border-l-cyan-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-3 font-medium ${
              activeTab === "list"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            ≡ รายการลูกค้า
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-6 py-3 font-medium ${
              activeTab === "pipeline"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            ⚙ สายลูกค้า
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-white shadow px-6 py-4">
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="text-center border-r">
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">ลูกค้าทั้งหมด</div>
          </div>
          <div className="text-center border-r">
            <div className="text-3xl font-bold text-gray-800">{stats.target}</div>
            <div className="text-sm text-gray-600">ลูกค้าเป้าหมาย</div>
          </div>
          <div className="text-center border-r">
            <div className="text-3xl font-bold text-gray-800">{stats.new}</div>
            <div className="text-sm text-gray-600">ลูกค้าใหม่</div>
          </div>
          <div className="text-center border-r">
            <div className="text-3xl font-bold text-gray-800">{stats.regular}</div>
            <div className="text-sm text-gray-600">ลูกค้าประจำ</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">{stats.inactive}</div>
            <div className="text-sm text-gray-600">ลูกค้าที่ไม่เคลื่อนไหว</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-4 text-sm text-blue-600 mb-4">
          <a href="#" className="hover:underline">
            ลูกค้าที่ติดต่อกับเรา ({stats.total})
          </a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">
            ลูกค้าที่ไม่ติดต่อกับเรา ({stats.inactive})
          </a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:underline">
            ลูกค้าทั้งหมด ({stats.total})
          </a>
        </div>

        {/* Filter Buttons and Search */}
        <div className="flex gap-3 items-center flex-wrap">
          <button className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200">
            ทีม - กำหนดเอง
          </button>
          <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200">
            ผู้รับผิดชอบ - กำหนดเอง
          </button>
          <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">
            คำลูกค้า - กำหนดเอง
          </button>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกสถานะ</option>
            <option value="planning">วางแผน</option>
            <option value="proposed">นำเสนอสินค้า</option>
            <option value="quoted">เสนอราคา</option>
            <option value="testing">ทดสอบตัวอย่างสินค้า</option>
            <option value="approved">อนุมัติราคา</option>
            <option value="closed">ปิดใบเสนอราคา</option>
          </select>

          <div className="flex-1 relative min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาจาก ชื่อลูกค้า อีเมล เบอร์โทร หรือ เลขประจำตัวผู้เสียภาษี"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">
            ค้นหาเพิ่มเติม
          </button>

          <Button
            onClick={() => {
              setEditingCustomer(null);
              setShowForm(true);
            }}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            สร้าง
          </Button>

          <Button
            onClick={() => {
              setCreditCustomer(null);
              setShowCreditForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            ขออนุมัติเครดิต
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-b-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">สถานะ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ชื่อลูกค้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium">รหัสลูกค้าอ้างอิง</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ข้อมูลติดต่อ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ความสำคัญ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">ผู้รับผิดชอบ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">อัปเดตล่าสุด</th>
                <th className="px-4 py-3 text-left text-sm font-medium">สร้างเมื่อ</th>
                <th className="px-4 py-3 text-left text-sm font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                    ไม่พบลูกค้าตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer._id || index}
                    className={`border-b border-l-4 ${getLeftBorderColor(index)} ${getRowColor(index)} hover:bg-gray-100`}
                  >
                    <td className="px-4 py-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusDisplay(customer.status).color}`}>
                        {getStatusDisplay(customer.status).label}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-600">
                        {customer.companyName || "ไม่ระบุประเภทธุรกิจ"}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(customer.tags || []).slice(0, 3).map((tag, i) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 text-xs rounded ${
                              i === 0
                                ? "bg-cyan-500 text-white"
                                : i === 1
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                        {(customer.tags || []).length > 3 && (
                          <span className="px-2 py-0.5 text-xs rounded bg-gray-300 text-gray-700">
                            +{(customer.tags || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.customerCode || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">
                        {customer.email || "-"}
                      </div>
                      <div>โทร : {customer.phoneNumber || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {renderStars(customer.priorityStar ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {customer.assignedTo || "ไม่ระบุ"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {customer.customerType || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{formatDate(customer.updatedAt)}</div>
                      <div className="text-sm text-gray-600">
                        {customer.notes ? customer.notes.slice(0, 40) : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{formatDate(customer.createdAt)}</div>
                      <div className="text-sm text-gray-600">
                        {customer.customerType === "target"
                          ? "ลูกค้าเป้าหมาย"
                          : customer.customerType === "regular"
                          ? "ลูกค้าประจำ"
                          : customer.customerType === "inactive"
                          ? "ไม่เคลื่อนไหว"
                          : "ลูกค้าใหม่"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {/* แสดงปุ่มตามสถานะปัจจุบัน */}
                        {customer.status === 'planning' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusAction(customer, 'product-proposal')}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Edit size={14} className="mr-1" />
                            นำเสนอสินค้า
                          </Button>
                        )}
                        
                        {customer.status === 'proposed' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusAction(customer, 'quotation')}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <Edit size={14} className="mr-1" />
                            เสนอราคา
                          </Button>
                        )}
                        
                        {customer.status === 'quoted' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusAction(customer, 'sample-testing')}
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            <Edit size={14} className="mr-1" />
                            ทดสอบตัวอย่าง
                          </Button>
                        )}
                        
                        {customer.status === 'testing' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusAction(customer, 'price-approval')}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Edit size={14} className="mr-1" />
                            อนุมัติราคา
                          </Button>
                        )}
                        
                        {/* แสดงปุ่มสำหรับทุกสถานะ */}
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setShowForm(true);
                          }}
                          className="bg-gray-500 hover:bg-gray-600 text-white"
                        >
                          <Edit size={14} className="mr-1" />
                          แก้ไข
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <CustomerFormNew
          customer={editingCustomer}
          onClose={() => {
            setEditingCustomer(null);
            setShowForm(false);
          }}
          onSubmit={handleSubmitCustomer}
        />
      )}

      {showCreditForm && (
        <CreditApprovalForm
          customer={creditCustomer}
          onClose={() => {
            setCreditCustomer(null);
            setShowCreditForm(false);
          }}
          onSubmit={handleSubmitCreditApproval}
        />
      )}
    </div>
  );
}
