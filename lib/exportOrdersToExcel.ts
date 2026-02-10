import * as XLSX from 'xlsx';
import type { OrderWithItems } from './api/orders';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 주문 목록을 엑셀 시트로 만들고 파일 다운로드
 */
export function exportOrdersToExcel(orders: OrderWithItems[]): void {
  const headers = [
    '주문번호',
    '주문일시',
    '상태',
    '수령인',
    '연락처',
    '배송국가',
    '배송주소',
    '상품내역',
    '상품금액',
    '배송비',
    '할인',
    '총결제액',
    '결제수단',
    '택배사',
    '송장번호',
    '관리자메모',
  ];

  const rows = orders.map((order) => {
    const items = order.order_items ?? [];
    const productSummary = items
      .map((i) => `${i.product_name} (${i.product_brand}) × ${i.quantity}`)
      .join(' / ');
    return [
      order.order_number,
      formatDate(order.created_at),
      order.status,
      order.recipient_name,
      order.recipient_phone ?? '',
      order.shipping_country ?? '',
      order.shipping_address ?? '',
      productSummary,
      order.subtotal ?? 0,
      order.shipping_fee ?? 0,
      order.discount_amount ?? 0,
      order.total_amount ?? 0,
      order.payment_method ?? '',
      order.courier_company ?? '',
      order.tracking_number ?? '',
      order.admin_memo ?? '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const colWidths = [
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 10 },
    { wch: 28 },
    { wch: 40 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '주문목록');

  const now = new Date();
  const filename = `orders_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, filename);
}
