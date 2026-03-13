import type { Product } from '../types';

/** 현재 언어에 맞는 상품명 (대만어 있으면 zh-TW에서 사용, 없으면 기본) */
export function getProductDisplayName(product: Product, lang: string): string {
  if (lang === 'zh-TW' && product.nameZh?.trim()) return product.nameZh.trim();
  return product.name;
}

/** 현재 언어에 맞는 상품 상세 HTML */
export function getProductDisplayDetailHtml(product: Product, lang: string): string | null | undefined {
  if (lang === 'zh-TW' && product.detailHtmlZh?.trim()) return product.detailHtmlZh.trim();
  return product.detailHtml;
}

/** TWD 환율: 1 TWD = twdRatePerKrw 원 (예: 40 이면 1 TWD = 40 KRW). 없으면 null */
export function getProductDisplayPrice(
  product: Product,
  lang: string,
  twdRatePerKrw: number | null
): { amount: number; currency: string; suffix: string } {
  if (lang === 'zh-TW') {
    if (product.priceTwd != null && product.priceTwd >= 0) {
      return { amount: product.priceTwd, currency: 'TWD', suffix: '元' };
    }
    if (twdRatePerKrw != null && twdRatePerKrw > 0) {
      const amount = Math.round(product.price / twdRatePerKrw);
      return { amount, currency: 'TWD', suffix: '元' };
    }
  }
  return { amount: product.price, currency: 'KRW', suffix: '원' };
}

/** 상품 원화 가격 (주문/결제는 항상 원화 기준이면 그대로 사용) */
export function getProductPriceKr(product: Product): number {
  return product.price;
}
