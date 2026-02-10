/**
 * 택배사별 배송 조회 URL (송장번호 포함 가능한 경우 포함)
 */
export function getTrackingUrl(
  courierCompany: string | null | undefined,
  trackingNumber: string | null | undefined
): string | null {
  const courier = (courierCompany ?? '').trim().toUpperCase();
  const number = (trackingNumber ?? '').trim();
  if (!courier && !number) return null;

  const enc = encodeURIComponent(number);

  if (number) {
    if (courier.includes('CJ') || courier.includes('대한통운')) return `https://dvrk.cjlogistics.com/tracking?invNo=${enc}`;
    if (courier.includes('한진')) return `https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?wblnum=${enc}`;
    if (courier.includes('롯데')) return `https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=${enc}`;
    if (courier.includes('DHL')) return `https://www.dhl.com/kr-ko/home/tracking.html?tracking-id=${enc}`;
    if (courier.includes('FEDEX') || courier.includes('FedEx')) return `https://www.fedex.com/ko-kr/tracking.html?tracknumbers=${enc}`;
    if (courier.includes('UPS')) return `https://www.ups.com/track?tracknum=${enc}`;
    if (courier.includes('EMS') || courier.includes('우체국') || courier.includes('우편')) return `https://service.epost.go.kr/trace.RetrieveDomRi.postal?sid1=${enc}`;
  }

  if (courier) {
    if (courier.includes('CJ') || courier.includes('대한통운')) return 'https://cjlogistics.com/ko/tool/parcel/tracking';
    if (courier.includes('한진')) return 'https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do';
    if (courier.includes('DHL')) return 'https://www.dhl.com/kr-ko/home/tracking.html';
    if (courier.includes('FEDEX') || courier.includes('FedEx')) return 'https://www.fedex.com/ko-kr/tracking.html';
    if (courier.includes('UPS')) return 'https://www.ups.com/track';
  }

  return null;
}
