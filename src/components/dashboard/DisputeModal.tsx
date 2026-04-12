'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  Package,
  Ban,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';

type DisputeReason =
  | 'not_as_described'
  | 'not_received'
  | 'counterfeit'
  | 'damaged'
  | 'wrong_item'
  | 'other';

type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';

type DisputeResolution =
  | 'buyer_refund'
  | 'seller_paid'
  | 'partial_refund'
  | 'cancelled';

interface DisputeEvent {
  id: string;
  event_type: string;
  actor_id: string;
  actor_role: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Dispute {
  id: string;
  order_id: string;
  initiated_by: string;
  reason: DisputeReason;
  description: string | null;
  status: DisputeStatus;
  resolution: DisputeResolution | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  order_number?: string;
  product_name?: string;
  product_image?: string;
  item_price?: string;
  buyer_id?: string;
  seller_id?: string;
  order_status?: string;
  escrow_status?: string;
  events?: DisputeEvent[];
}

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  productName?: string;
  existingDispute?: Dispute | null;
  onDisputeCreated?: (dispute: Dispute) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DisputeModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  productName,
  existingDispute,
  onDisputeCreated,
}: DisputeModalProps) {
  const { token } = useAuth();
  const t = useTranslations('disputes');
  const [reason, setReason] = useState<DisputeReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const REASON_OPTIONS: {
    value: DisputeReason;
    label: string;
    icon: typeof AlertTriangle;
    description: string;
  }[] = [
    {
      value: 'not_as_described',
      label: t('reasonLabels.notAsDescribed'),
      icon: ShieldAlert,
      description: t('reasonLabels.notAsDescribedDesc'),
    },
    {
      value: 'not_received',
      label: t('reasonLabels.notReceived'),
      icon: Package,
      description: t('reasonLabels.notReceivedDesc'),
    },
    {
      value: 'counterfeit',
      label: t('reasonLabels.counterfeit'),
      icon: Ban,
      description: t('reasonLabels.counterfeitDesc'),
    },
    {
      value: 'damaged',
      label: t('reasonLabels.damaged'),
      icon: AlertTriangle,
      description: t('reasonLabels.damagedDesc'),
    },
    {
      value: 'wrong_item',
      label: t('reasonLabels.wrongItem'),
      icon: Package,
      description: t('reasonLabels.wrongItemDesc'),
    },
    {
      value: 'other',
      label: t('reasonLabels.other'),
      icon: HelpCircle,
      description: t('reasonLabels.otherDesc'),
    },
  ];

  const STATUS_CONFIG: Record<
    DisputeStatus,
    { label: string; color: string; bgColor: string; icon: typeof Clock }
  > = {
    open: {
      label: t('statusLabels.open'),
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      icon: Clock,
    },
    under_review: {
      label: t('statusLabels.underReview'),
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      icon: MessageSquare,
    },
    resolved: {
      label: t('statusLabels.resolved'),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      icon: CheckCircle2,
    },
    closed: {
      label: t('statusLabels.closed'),
      color: 'text-muted',
      bgColor: 'bg-muted/10',
      icon: XCircle,
    },
  };

  const RESOLUTION_LABELS: Record<DisputeResolution, string> = {
    buyer_refund: t('resolutionLabels.buyerRefund'),
    seller_paid: t('resolutionLabels.sellerPaid'),
    partial_refund: t('resolutionLabels.partialRefund'),
    cancelled: t('resolutionLabels.cancelled'),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError(t('reasonLabels.selectReason'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('reasonLabels.failedToOpen'));
        return;
      }

      setSuccess(true);
      onDisputeCreated?.(data);
    } catch {
      setError(t('reasonLabels.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason('');
      setDescription('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  // Inner components need access to t, STATUS_CONFIG, RESOLUTION_LABELS, REASON_OPTIONS
  const renderExistingDispute = (dispute: Dispute) => {
    const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
    const StatusIcon = statusConfig.icon;
    const reasonOption = REASON_OPTIONS.find((r) => r.value === dispute.reason);

    return (
      <div className="space-y-5">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bgColor}`}
          >
            <StatusIcon size={13} className={statusConfig.color} />
            <span className={`text-xs font-bold ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <span className="text-[11px] text-muted">
            {t('timelineLabels.opened')} {formatDate(dispute.created_at)}
          </span>
        </div>

        {/* Reason */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-2">
            {t('timelineLabels.reason')}
          </p>
          <div className="flex items-center gap-2">
            {reasonOption && (
              <reasonOption.icon size={14} className="text-red-400" />
            )}
            <span className="text-sm font-semibold text-foreground">
              {reasonOption?.label || dispute.reason}
            </span>
          </div>
          {dispute.description && (
            <p className="text-sm text-muted mt-2 leading-relaxed">
              {dispute.description}
            </p>
          )}
        </div>

        {/* Resolution (if resolved) */}
        {dispute.resolution && (
          <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-xl p-4">
            <p className="text-[10px] text-emerald-400/60 uppercase tracking-[0.12em] font-bold mb-2">
              {t('timelineLabels.resolution')}
            </p>
            <p className="text-sm font-semibold text-emerald-400">
              {RESOLUTION_LABELS[dispute.resolution] || dispute.resolution}
            </p>
            {dispute.resolution_notes && (
              <p className="text-sm text-muted mt-2 leading-relaxed">
                {dispute.resolution_notes}
              </p>
            )}
            {dispute.resolved_at && (
              <p className="text-[11px] text-muted/60 mt-2">
                {t('timelineLabels.resolved')} {formatDate(dispute.resolved_at)}
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        {dispute.events && dispute.events.length > 0 && (
          <div>
            <p className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-3">
              {t('timelineLabels.timeline')}
            </p>
            <div className="space-y-0">
              {dispute.events.map((event, index) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  isLast={index === dispute.events!.length - 1}
                  t={t}
                  resolutionLabels={RESOLUTION_LABELS}
                />
              ))}
            </div>
          </div>
        )}

        {/* Escrow info */}
        {dispute.escrow_status && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-400" />
              <p className="text-xs font-semibold text-foreground">
                {t('escrowMessages.escrowStatus')}
              </p>
            </div>
            <p className="text-xs text-muted mt-1.5">
              {dispute.escrow_status === 'disputed' &&
                t('escrowMessages.disputed')}
              {dispute.escrow_status === 'released' &&
                t('escrowMessages.released')}
              {dispute.escrow_status === 'refunded' &&
                t('escrowMessages.refunded')}
              {dispute.escrow_status === 'held' && t('escrowMessages.held')}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={28} />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1.5">
        {t('disputeOpened')}
      </h3>
      <p className="text-sm text-muted mb-6 max-w-xs mx-auto">
        {t('successMessage')}
      </p>
      <button
        onClick={handleClose}
        className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors"
      >
        {t('timelineLabels.gotIt')}
      </button>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {existingDispute ? t('disputeDetails') : t('openDispute')}
                    </h2>
                    {orderNumber && (
                      <p className="text-[11px] text-muted mt-0.5">
                        {t('timelineLabels.order')} {orderNumber}
                        {productName && (
                          <span className="text-muted/60">
                            {' '}
                            &middot; {productName}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-surface text-muted hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {existingDispute ? (
                  renderExistingDispute(existingDispute)
                ) : success ? (
                  renderSuccess()
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Info banner */}
                    <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-4">
                      <p className="text-xs text-amber-300/80 leading-relaxed">
                        {t('escrowMessages.infoBanner')}
                      </p>
                    </div>

                    {/* Reason selector */}
                    <div>
                      <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-2.5 block">
                        {t('reasonLabels.reasonForDispute')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {REASON_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          const isSelected = reason === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setReason(option.value);
                                setError(null);
                              }}
                              className={`flex items-start gap-2.5 p-3 rounded-xl text-left transition-all border ${
                                isSelected
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                  : 'bg-surface border-border text-muted hover:text-foreground hover:border-border-hover'
                              }`}
                            >
                              <Icon size={14} className="mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold">
                                  {option.label}
                                </p>
                                <p
                                  className={`text-[10px] mt-0.5 leading-snug ${
                                    isSelected
                                      ? 'text-red-400/60'
                                      : 'text-muted/60'
                                  }`}
                                >
                                  {option.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                        {t('description')}
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('reasonLabels.descriptionPlaceholder')}
                        rows={4}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                      >
                        <p className="text-xs text-red-400">{error}</p>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm font-semibold text-muted hover:text-foreground hover:border-border-hover transition-all"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !reason}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        {t('openDisputeBtn')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TimelineItem({
  event,
  isLast,
  t,
  resolutionLabels,
}: {
  event: DisputeEvent;
  isLast: boolean;
  t: ReturnType<typeof useTranslations>;
  resolutionLabels: Record<string, string>;
}) {
  const eventLabels: Record<string, string> = {
    dispute_opened: t('timelineLabels.disputeOpened'),
    dispute_response: t('timelineLabels.sellerResponded'),
    dispute_resolved: t('timelineLabels.disputeResolved'),
  };

  const metadata = event.metadata || {};

  return (
    <div className="flex gap-3">
      {/* Dot and line */}
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-border mt-1.5 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      {/* Content */}
      <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">
            {eventLabels[event.event_type] || event.event_type}
          </p>
          <ChevronRight size={12} className="text-muted/30" />
          <span className="text-[10px] font-semibold uppercase text-muted/60">
            {event.actor_role}
          </span>
        </div>
        <p className="text-[11px] text-muted mt-0.5">
          {formatDate(event.created_at)}
        </p>
        {metadata.response ? (
          <p className="text-xs text-muted mt-1.5 bg-surface rounded-lg p-2.5 border border-border">
            {String(metadata.response)}
          </p>
        ) : null}
        {metadata.offer ? (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-400/10 text-blue-400 mt-1.5">
            {t('timelineLabels.offer')}:{' '}
            {String(metadata.offer).replace('_', ' ')}
          </span>
        ) : null}
        {metadata.resolution ? (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 mt-1.5">
            {resolutionLabels[metadata.resolution as string] ||
              String(metadata.resolution)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
