# UI Real Data Migration Progress

Goal: Replace mock/localStorage UI data with real API-backed data across WMS, adminb2b, and jubili reports; add missing APIs where needed.

## Done
- Initial audit of mock/localStorage usage and missing API endpoints.
- Added WMS and reports API scaffolding (WMS stats/products/outbound/inbound, report endpoints, admin role/admin update endpoints).
- Added WMS data models for purchase orders and ASN; expanded product inventory fields.
- Wired WMS outbound/inbound to real APIs and removed mock data.
- Converted admin permissions management to API-backed CRUD (no localStorage).
- Replaced admin dashboard mock charts with API-driven data.
- Updated jubili reports CSV export to use live report data.
- Converted payment test page to pull real orders from API.
- Compatibility review and final verification across updated UI + API flows.
- Fixed admin update calls to use PATCH to match API (`src/app/adminb2b/admins/page.tsx`).
- Replaced localStorage token usage with cookie-based token manager in orders page (`src/app/adminb2b/orders/page.tsx`).
- Replaced localStorage token usage in quotations page and added credentials to API calls (`src/app/adminb2b/quotations/page.tsx`).
- Quotation form now pulls projects/opportunities from API and avoids nested modal overlays.
- Quotation shipping address now persists province/district/subdistrict/zipcode and is rendered in PDF/view.
- Quotation view pulls company info from settings and shows assignee signature from admin profile.
- Normalized empty delivery zipcode before saving quotations to avoid validation errors.
- Normalized empty optional customer fields (taxId/phones/zip/email) to avoid validation failures.
- Added sales order view/print page with PDF download and admin signature.
- Sales order form now supports ship-to-customer + address autocomplete (province/district/subdistrict/zipcode).
- Sales order conversion from quotation now carries customer/address/owner fields.
- Added auto migration runner for adminId normalization on deploy.
- Removed legacy DataContext/mockData/AdminSidebar and localStorage-based saved filters.
- Added migrations for customerCode backfill and order linkage fields (ownerId/customerId/delivery/salesOrderNumber).

## Remaining
- None required for core real-data migration. Optional: replace hardcoded team options with API-backed team data.
