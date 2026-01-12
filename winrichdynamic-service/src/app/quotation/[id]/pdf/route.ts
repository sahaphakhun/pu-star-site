import { NextRequest } from 'next/server';
import { buildQuotationPdfResponse } from '@/services/quotationPdfService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return buildQuotationPdfResponse(request, resolvedParams.id);
}
