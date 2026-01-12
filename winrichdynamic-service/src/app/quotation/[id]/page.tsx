export default function QuotationPdfViewer({
  params,
}: {
  params: { id: string };
}) {
  const pdfUrl = `/quotation/${params.id}/pdf?inline=1`;
  const downloadUrl = `/quotation/${params.id}/pdf?download=1`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">ใบเสนอราคา</h1>
            <p className="text-sm text-slate-500">ดูเอกสารฉบับจริงในรูปแบบ PDF</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={downloadUrl}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              ดาวน์โหลด PDF
            </a>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              เปิดในแท็บใหม่
            </a>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <object data={pdfUrl} type="application/pdf" className="h-[75vh] w-full">
            <div className="px-6 py-10 text-center">
              <p className="text-slate-700">ไม่สามารถแสดง PDF ในเบราว์เซอร์นี้</p>
              <p className="mt-1 text-sm text-slate-500">กรุณาดาวน์โหลดเอกสารแทน</p>
              <a
                href={downloadUrl}
                className="mt-4 inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                ดาวน์โหลด PDF
              </a>
            </div>
          </object>
        </div>
      </div>
    </div>
  );
}
