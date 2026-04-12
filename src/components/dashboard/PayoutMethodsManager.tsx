'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  CreditCard,
  MessageCircle,
  Plus,
  Trash2,
  Star,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { usePayoutMethods } from '@/hooks/usePayoutMethods';
import { useTranslations } from 'next-intl';
import type { PayoutMethodType } from '@/types';

interface Props {
  variant?: 'standard' | 'compact';
}

export default function PayoutMethodsManager({ variant = 'standard' }: Props) {
  const { methods, loading, addMethod, setPrimary, removeMethod } =
    usePayoutMethods();
  const t = useTranslations('dashboardPayouts');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<PayoutMethodType>('paypal');
  const [formAccountId, setFormAccountId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formAccountName, setFormAccountName] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formDateOfBirth, setFormDateOfBirth] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const needsWiseFields = formType === 'alipay' || formType === 'wechat';

  const METHOD_CONFIG: Record<
    PayoutMethodType,
    {
      label: string;
      icon: typeof Wallet;
      color: string;
      bgColor: string;
      borderColor: string;
      fieldLabel: string;
      placeholder: string;
    }
  > = {
    alipay: {
      label: t('alipay'),
      icon: Wallet,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
      borderColor: 'border-sky-400/15',
      fieldLabel: t('alipayId'),
      placeholder: t('alipayPlaceholder'),
    },
    paypal: {
      label: t('paypalLabel'),
      icon: CreditCard,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/15',
      fieldLabel: t('paypalEmail'),
      placeholder: t('paypalPlaceholder'),
    },
    wechat: {
      label: t('wechat'),
      icon: MessageCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/15',
      fieldLabel: t('wechatId'),
      placeholder: t('wechatPlaceholder'),
    },
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formAccountId.trim()) return;

    // CNY payouts (Alipay/WeChat) require full legal name, Chinese national ID, DOB, and address
    if (needsWiseFields) {
      if (!formAccountName.trim()) {
        setFormError(t('accountNameRequired'));
        return;
      }
      const idNormalized = formNationalId.trim().toUpperCase();
      if (!/^\d{17}[\dX]$/.test(idNormalized)) {
        setFormError(t('nationalIdInvalid'));
        return;
      }
      if (!formDateOfBirth.trim()) {
        setFormError(t('dateOfBirthRequired'));
        return;
      }
      if (!formAddress.trim()) {
        setFormError(t('addressRequired'));
        return;
      }
    }

    setSubmitting(true);
    try {
      await addMethod({
        method_type: formType,
        account_id: formAccountId.trim(),
        label: formLabel.trim() || undefined,
        account_name: formAccountName.trim() || undefined,
        national_id: needsWiseFields
          ? formNationalId.trim().toUpperCase()
          : undefined,
        date_of_birth: needsWiseFields ? formDateOfBirth.trim() : undefined,
        address: needsWiseFields ? formAddress.trim() : undefined,
      });
      setFormAccountId('');
      setFormLabel('');
      setFormAccountName('');
      setFormNationalId('');
      setFormDateOfBirth('');
      setFormAddress('');
      setShowAddForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('addMethodError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    setActionId(id);
    try {
      await setPrimary(id);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionId(id);
    try {
      await removeMethod(id);
    } finally {
      setActionId(null);
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div className={isCompact ? 'space-y-4' : ''}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isCompact && (
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          )}
          <div>
            {!isCompact && (
              <p className="text-[10px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-3">
                {t('payoutMethods')}
              </p>
            )}
            {isCompact && (
              <>
                <p className="text-sm font-semibold text-foreground">
                  {t('payoutMethods')}
                </p>
                <p className="text-[11px] text-muted">{t('managePayouts')}</p>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            isCompact
              ? 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/15'
              : 'bg-primary/10 text-primary hover:bg-primary/15'
          }`}
        >
          <Plus size={12} />
          {t('addMethod')}
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleAdd}
              className="bg-card rounded-2xl border border-border p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {t('addPayoutMethod')}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Method type selector */}
              <div className="flex gap-2">
                {(Object.keys(METHOD_CONFIG) as PayoutMethodType[]).map(
                  (type) => {
                    const cfg = METHOD_CONFIG[type];
                    const Icon = cfg.icon;
                    const isSelected = formType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormType(type)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`
                            : 'bg-surface border-border text-muted hover:text-foreground hover:border-border-hover'
                        }`}
                      >
                        <Icon size={14} />
                        {cfg.label}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Account ID */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  {METHOD_CONFIG[formType].fieldLabel}
                </label>
                <input
                  type="text"
                  value={formAccountId}
                  onChange={(e) => setFormAccountId(e.target.value)}
                  placeholder={METHOD_CONFIG[formType].placeholder}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              {/* Wise-required fields for Alipay/WeChat payouts to mainland China */}
              {needsWiseFields && (
                <>
                  <div className="rounded-xl border border-sky-400/20 bg-sky-400/[0.04] p-3">
                    <p className="text-[11px] text-sky-300/90 leading-relaxed">
                      {t('wiseInfoBanner')}
                    </p>
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                      {t('accountHolderName')}
                    </label>
                    <input
                      type="text"
                      value={formAccountName}
                      onChange={(e) => setFormAccountName(e.target.value)}
                      placeholder={t('accountHolderNamePlaceholder')}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                      required
                    />
                    <p className="text-[10px] text-muted/70 mt-1">
                      {t('accountHolderNameHint')}
                    </p>
                  </div>

                  {/* National ID (身份证号) */}
                  <div>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                      {t('nationalId')}
                    </label>
                    <input
                      type="text"
                      value={formNationalId}
                      onChange={(e) =>
                        setFormNationalId(e.target.value.toUpperCase())
                      }
                      placeholder={t('nationalIdPlaceholder')}
                      maxLength={18}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                      required
                    />
                    <p className="text-[10px] text-muted/70 mt-1">
                      {t('nationalIdHint')}
                    </p>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                      {t('dateOfBirth')}
                    </label>
                    <input
                      type="date"
                      value={formDateOfBirth}
                      onChange={(e) => setFormDateOfBirth(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                      required
                    />
                    <p className="text-[10px] text-muted/70 mt-1">
                      {t('dateOfBirthHint')}
                    </p>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                      {t('address')}
                    </label>
                    <textarea
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder={t('addressPlaceholder')}
                      rows={3}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                      required
                    />
                    <p className="text-[10px] text-muted/70 mt-1">
                      {t('addressHint')}
                    </p>
                  </div>
                </>
              )}

              {/* Label (optional) */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  {t('label')}
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder={t('labelPlaceholder')}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2">
                  <p className="text-[11px] text-red-400">{formError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !formAccountId.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {t('addMethod')}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Methods List */}
      {loading ? (
        <div className="py-8 text-center">
          <Loader2 size={20} className="animate-spin text-muted mx-auto" />
        </div>
      ) : methods.length === 0 && !showAddForm ? (
        <div
          className={`bg-card rounded-2xl border border-border py-10 text-center ${isCompact ? '' : 'mt-0'}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-3">
            <Wallet size={22} className="text-muted/30" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {t('noPayoutMethods')}
          </p>
          <p className="text-[12px] text-muted mt-1">{t('addMethodDesc')}</p>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 ${isCompact ? '' : 'sm:grid-cols-2'} gap-3`}
        >
          <AnimatePresence>
            {methods.map((method, i) => {
              const cfg = METHOD_CONFIG[method.methodType];
              const Icon = cfg.icon;
              const isActing = actionId === method.id;
              return (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className={`bg-card rounded-2xl border ${
                    method.isPrimary ? cfg.borderColor : 'border-border'
                  } p-4 flex items-center gap-4 group hover:border-primary/20 transition-all`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${cfg.bgColor} ${cfg.color} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {method.label || cfg.label}
                      </p>
                      {method.isPrimary && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400">
                          {t('primary')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted truncate">
                      {method.accountId}
                    </p>
                    {method.accountName && (
                      <p className="text-[10px] text-muted/80 truncate mt-0.5">
                        {method.accountName}
                      </p>
                    )}
                    {method.nationalId && (
                      <p className="text-[10px] text-muted/60 truncate font-mono mt-0.5">
                        {method.nationalId.slice(0, 6)}••••••••
                        {method.nationalId.slice(-2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!method.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(method.id)}
                        disabled={isActing}
                        title={t('setAsPrimary')}
                        className="p-1.5 rounded-lg hover:bg-amber-400/10 text-muted hover:text-amber-400 transition-colors disabled:opacity-50"
                      >
                        <Star size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(method.id)}
                      disabled={isActing}
                      title={t('remove')}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                    {!isCompact && (
                      <ChevronRight
                        size={14}
                        className="text-muted/30 group-hover:text-primary/60 transition-colors"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
