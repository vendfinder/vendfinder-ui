import { localeToCurrency, defaultLocale, type Locale } from '@/i18n/config';

export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(' ');
}

export function formatPrice(price: number, locale?: Locale): string {
  const effectiveLocale = locale || defaultLocale;
  const currency = localeToCurrency[effectiveLocale] || 'USD';
  return new Intl.NumberFormat(effectiveLocale, {
    style: 'currency',
    currency,
  }).format(price);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getTrackingUrl(
  carrier: string | undefined,
  trackingNumber: string | undefined
): string | null {
  if (!carrier || !trackingNumber) return null;
  const num = encodeURIComponent(trackingNumber.trim());
  switch (carrier.toLowerCase()) {
    case 'usps':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
    case 'ups':
      return `https://www.ups.com/track?tracknum=${num}`;
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
    case 'dhl':
      return `https://www.dhl.com/en/express/tracking.html?AWB=${num}`;
    case 'china_post':
      return `https://track.chinapost.com.cn/result.html?mailNum=${num}`;
    case 'sf_express':
      return `https://www.sf-express.com/we/ow/chn/sc/waybill/waybill/list/${num}`;
    case 'yunexpress':
      return `https://www.yuntrack.com/Track/Detail/${num}`;
    case '4px':
      return `https://track.4px.com/#/detail/${num}`;
    case 'yanwen':
      return `https://track.yw56.com.cn/en/querydel?nums=${num}`;
    default:
      return `https://parcelsapp.com/en/tracking/${num}`;
  }
}

export function formatCarrierName(carrier: string | undefined): string {
  if (!carrier) return '';
  const map: Record<string, string> = {
    usps: 'USPS',
    ups: 'UPS',
    fedex: 'FedEx',
    dhl: 'DHL',
    china_post: 'China Post / EMS',
    sf_express: 'SF Express',
    yunexpress: 'YunExpress',
    '4px': '4PX',
    yanwen: 'Yanwen',
    other: 'Other',
  };
  return map[carrier.toLowerCase()] || carrier.toUpperCase();
}
