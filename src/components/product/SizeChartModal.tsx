'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

type SizeRow = { us: string; eu: string; uk: string; cm: string };

const mensSizes: SizeRow[] = [
  { us: '4', eu: '36', uk: '3.5', cm: '22' },
  { us: '4.5', eu: '36.5', uk: '4', cm: '22.5' },
  { us: '5', eu: '37.5', uk: '4.5', cm: '23' },
  { us: '5.5', eu: '38', uk: '5', cm: '23.5' },
  { us: '6', eu: '38.5', uk: '5.5', cm: '24' },
  { us: '6.5', eu: '39', uk: '6', cm: '24.5' },
  { us: '7', eu: '40', uk: '6', cm: '25' },
  { us: '7.5', eu: '40.5', uk: '6.5', cm: '25.5' },
  { us: '8', eu: '41', uk: '7', cm: '26' },
  { us: '8.5', eu: '42', uk: '7.5', cm: '26.5' },
  { us: '9', eu: '42.5', uk: '8', cm: '27' },
  { us: '9.5', eu: '43', uk: '8.5', cm: '27.5' },
  { us: '10', eu: '44', uk: '9', cm: '28' },
  { us: '10.5', eu: '44.5', uk: '9.5', cm: '28.5' },
  { us: '11', eu: '45', uk: '10', cm: '29' },
  { us: '11.5', eu: '45.5', uk: '10.5', cm: '29.5' },
  { us: '12', eu: '46', uk: '11', cm: '30' },
  { us: '13', eu: '47.5', uk: '12', cm: '31' },
  { us: '14', eu: '48.5', uk: '13', cm: '32' },
];

const womensSizes: SizeRow[] = [
  { us: '5', eu: '35.5', uk: '2.5', cm: '22' },
  { us: '5.5', eu: '36', uk: '3', cm: '22.5' },
  { us: '6', eu: '36.5', uk: '3.5', cm: '23' },
  { us: '6.5', eu: '37.5', uk: '4', cm: '23.5' },
  { us: '7', eu: '38', uk: '4.5', cm: '24' },
  { us: '7.5', eu: '38.5', uk: '5', cm: '24.5' },
  { us: '8', eu: '39', uk: '5.5', cm: '25' },
  { us: '8.5', eu: '40', uk: '6', cm: '25.5' },
  { us: '9', eu: '40.5', uk: '6.5', cm: '26' },
  { us: '9.5', eu: '41', uk: '7', cm: '26.5' },
  { us: '10', eu: '42', uk: '7.5', cm: '27' },
  { us: '10.5', eu: '42.5', uk: '8', cm: '27.5' },
  { us: '11', eu: '43', uk: '8.5', cm: '28' },
  { us: '11.5', eu: '44', uk: '9', cm: '28.5' },
  { us: '12', eu: '44.5', uk: '9.5', cm: '29' },
];

export default function SizeChartModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('product');
  const [tab, setTab] = useState<'men' | 'women'>('men');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted || !open) return null;

  const rows = tab === 'men' ? mensSizes : womensSizes;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-lg font-bold text-foreground">
            {t('sizeGuide')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-5 p-1 bg-surface/60 rounded-xl border border-border/60">
          {(['men', 'women'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                tab === tabKey
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(232,136,58,0.15)]'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tabKey === 'men' ? t('mens') : t('womens')}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="px-5 pt-4 pb-5 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                <th className="text-left py-2 pr-2">US</th>
                <th className="text-left py-2 pr-2">EU</th>
                <th className="text-left py-2 pr-2">UK</th>
                <th className="text-left py-2">CM</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.us}
                  className="border-t border-white/[0.04] text-foreground"
                >
                  <td className="py-2.5 pr-2 font-semibold">{row.us}</td>
                  <td className="py-2.5 pr-2">{row.eu}</td>
                  <td className="py-2.5 pr-2">{row.uk}</td>
                  <td className="py-2.5">{row.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body
  );
}
