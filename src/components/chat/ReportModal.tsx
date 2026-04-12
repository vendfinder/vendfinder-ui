'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => void;
}

function useReasons() {
  const t = useTranslations('chat');
  return [
    { value: 'spam', label: t('spam') },
    { value: 'harassment', label: t('harassment') },
    { value: 'scam', label: t('scamFraud') },
    { value: 'inappropriate', label: t('inappropriateContent') },
    { value: 'other', label: t('other') },
  ];
}

export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
}: ReportModalProps) {
  const t = useTranslations('chat');
  const reasons = useReasons();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit(selectedReason, details || undefined);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedReason('');
      setDetails('');
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 mx-4"
          >
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-400/15 flex items-center justify-center mx-auto mb-3">
                  <Flag size={20} className="text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-foreground">
                  {t('reportSubmitted')}
                </p>
                <p className="text-[12px] text-muted mt-1">
                  {t('wellReviewMessage')}
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-foreground">
                    {t('reportMessage')}
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Reasons */}
                <div className="space-y-2 mb-4">
                  {reasons.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setSelectedReason(r.value)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        selectedReason === r.value
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-surface border border-border/50 text-foreground hover:border-border'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Details */}
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('additionalDetails')}
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm bg-surface border border-border/50 rounded-xl text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/40 resize-none mb-4"
                />

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors rounded-xl border border-border/50 hover:border-border"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedReason}
                    className="flex-1 px-4 py-2.5 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {t('submitReport')}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
