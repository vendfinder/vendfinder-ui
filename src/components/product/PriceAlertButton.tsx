'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, BellRing, X, Loader2, Check, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';

interface PriceAlert {
  id: string;
  productId: string;
  targetPrice: number;
  size: string | null;
  status: string;
  createdAt: string;
}

interface PriceAlertButtonProps {
  productId: string;
  currentPrice: number;
  sizes?: string[];
  selectedSize?: string | null;
}

export default function PriceAlertButton({
  productId,
  currentPrice,
  sizes,
  selectedSize,
}: PriceAlertButtonProps) {
  const t = useTranslations('product');
  const { isAuthenticated, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertSize, setAlertSize] = useState<string>('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const hasActiveAlert = alerts.some((a) => a.status === 'active');

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/products/price-alerts?status=active', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const productAlerts = (data.alerts || []).filter(
          (a: PriceAlert) => a.productId === productId
        );
        setAlerts(productAlerts);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, productId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts();
    }
  }, [isAuthenticated, fetchAlerts]);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setError('');
        setSuccess(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Pre-fill target price at 10% below current price
  useEffect(() => {
    if (open && !targetPrice) {
      const suggested = Math.floor(currentPrice * 0.9 * 100) / 100;
      setTargetPrice(suggested.toFixed(2));
    }
  }, [open, currentPrice, targetPrice]);

  // Sync selectedSize from parent
  useEffect(() => {
    if (selectedSize) {
      setAlertSize(selectedSize);
    }
  }, [selectedSize]);

  const handleOpen = () => {
    if (!isAuthenticated) return;
    setOpen(!open);
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!token) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/products/${productId}/price-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_price: price,
          size: alertSize || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create alert');
        return;
      }

      setSuccess(true);
      await fetchAlerts();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setTargetPrice('');
      }, 1500);
    } catch {
      setError('Failed to create alert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!token) return;
    setDeleting(alertId);
    try {
      const res = await fetch('/api/products/price-alerts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alertId }),
      });

      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className={`
          inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer
          ${
            hasActiveAlert
              ? 'bg-primary/[0.08] text-primary border-primary/40 shadow-[0_0_12px_rgba(232,136,58,0.15)]'
              : 'bg-surface border-border text-foreground hover:border-border-hover hover:text-primary'
          }
        `}
        title={hasActiveAlert ? t('alertActive') : t('setPriceAlert')}
      >
        {hasActiveAlert ? (
          <>
            <BellRing size={15} className="shrink-0" />
            <span>{t('alertSet')}</span>
          </>
        ) : (
          <>
            <Bell size={15} className="shrink-0" />
            <span>{t('priceAlert')}</span>
          </>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-2xl border border-border shadow-[0_8px_40px_rgba(0,0,0,0.4)] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bell size={14} className="text-primary" />
              {t('priceDropAlert')}
            </h3>
            <button
              onClick={() => {
                setOpen(false);
                setError('');
                setSuccess(false);
              }}
              className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Existing alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted font-semibold uppercase tracking-wider">
                  {t('activeAlerts')}
                </p>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between bg-surface rounded-xl px-3 py-2.5 border border-border"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatPrice(alert.targetPrice)}
                      </p>
                      {alert.size && (
                        <p className="text-[11px] text-muted">
                          {t('size')}: {alert.size}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      disabled={deleting === alert.id}
                      className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer disabled:opacity-50"
                      title={t('removeAlert')}
                    >
                      {deleting === alert.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Success state */}
            {success ? (
              <div className="flex items-center justify-center gap-2 py-3 text-emerald-400">
                <Check size={16} />
                <span className="text-sm font-semibold">{t('alertSaved')}</span>
              </div>
            ) : (
              <>
                {/* Target price input */}
                <div>
                  <label className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1.5">
                    {t('notifyWhenDrops')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-4 py-2.5 bg-surface border border-border rounded-xl text-foreground text-sm font-semibold placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-muted/60 mt-1">
                    {t('currentPrice')}: {formatPrice(currentPrice)}
                  </p>
                </div>

                {/* Size selector */}
                {sizes && sizes.length > 0 && (
                  <div>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-1.5">
                      {t('sizeOptional')}
                    </label>
                    <select
                      value={alertSize}
                      onChange={(e) => setAlertSize(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="">{t('anySize')}</option>
                      {sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="text-xs text-red-400 font-medium">{error}</p>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-[0_0_16px_rgba(232,136,58,0.15)] hover:shadow-[0_0_24px_rgba(232,136,58,0.25)] transition-all cursor-pointer text-sm disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <BellRing size={14} />
                  )}
                  {alerts.length > 0
                    ? t('addAnotherAlert')
                    : t('setPriceAlert')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
