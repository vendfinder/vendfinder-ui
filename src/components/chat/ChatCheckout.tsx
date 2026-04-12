'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  X,
  MapPin,
  Lock,
  Shield,
  CheckCircle2,
  Package,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Truck,
  CreditCard,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import {
  createCheckout,
  createPayPalCheckout,
  capturePayPalPayment,
} from '@/lib/api-orders';

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

// Lazy load Stripe to avoid impure function during render
const getStripePromise = () => {
  if (typeof window !== 'undefined') {
    return loadStripe(stripeKey);
  }
  return Promise.resolve(null);
};

interface ChatCheckoutProps {
  price: number;
  productId: string;
  productName: string;
  productImage: string;
  sellerId: string;
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'shipping' | 'payment';
type PaymentMethod = 'card' | 'paypal';

interface ShippingInfo {
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
}

function ChatCheckoutInner({
  price,
  productId,
  productName,
  productImage,
  sellerId,
  onComplete,
  onCancel,
}: ChatCheckoutProps) {
  const t = useTranslations('chat');
  const { token } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState<Step>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [shipping, setShipping] = useState<ShippingInfo>({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
  });

  // Fee calculations
  const shippingFee = 0; // No shipping charges - always free
  const tax = price * 0.08;
  const total = price + shippingFee + tax;

  function isShippingComplete() {
    return (
      shipping.name.trim() &&
      shipping.address_line1.trim() &&
      shipping.city.trim() &&
      shipping.state.trim() &&
      shipping.zip.trim()
    );
  }

  function handleContinueToPayment() {
    if (!isShippingComplete()) return;
    setStep('payment');
  }

  function getCheckoutData() {
    return {
      product_id: productId,
      product_name: productName,
      product_image: productImage,
      size: 'One Size',
      item_price: price,
      seller_id: sellerId,
      shipping_name: shipping.name,
      shipping_address_line1: shipping.address_line1,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      shipping_zip: shipping.zip,
    };
  }

  async function handleStripePayment() {
    if (!stripe || !elements || !token) return;

    setLoading(true);
    setError(null);

    try {
      const { clientSecret } = await createCheckout(getCheckoutData(), token);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: shipping.name },
          },
        });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        setOrderNumber(paymentIntent.id);
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-5 space-y-4 max-w-sm">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-400/15 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-foreground">
              {t('paymentSuccessful')}
            </h3>
            <p className="text-[12px] text-muted mt-1">{t('orderPlaced')}</p>
          </div>
          {orderNumber && (
            <div className="bg-surface/50 border border-border/40 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted uppercase tracking-wider">
                {t('orderNumber')}
              </p>
              <p className="text-[13px] font-bold text-foreground font-mono">
                {orderNumber}
              </p>
            </div>
          )}
          <div className="flex items-center gap-3 text-[11px] text-muted pt-1">
            <div className="flex items-center gap-1">
              <Package size={11} />
              <span>{productName}</span>
            </div>
            <span className="font-semibold text-foreground">
              {formatPrice(total)}
            </span>
          </div>
          <button
            onClick={onComplete}
            className="w-full mt-2 px-4 py-2.5 text-[13px] font-bold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer"
          >
            {t('done')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {step === 'payment' && (
            <button
              onClick={() => setStep('shipping')}
              className="p-1 -ml-1 rounded-lg hover:bg-surface transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} className="text-muted" />
            </button>
          )}
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
            {step === 'shipping' ? (
              <Truck size={12} className="text-primary" />
            ) : (
              <Lock size={12} className="text-primary" />
            )}
          </div>
          <span className="text-[12px] font-semibold text-foreground">
            {step === 'shipping' ? t('shippingDetails') : t('payment')}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-surface transition-colors cursor-pointer"
        >
          <X size={14} className="text-muted" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 justify-center">
        <div
          className={`h-1 flex-1 rounded-full ${
            step === 'shipping' ? 'bg-primary' : 'bg-emerald-400'
          }`}
        />
        <div
          className={`h-1 flex-1 rounded-full ${
            step === 'payment' ? 'bg-primary' : 'bg-border/40'
          }`}
        />
      </div>

      {/* Product summary */}
      <div className="flex items-center gap-3 bg-surface/50 border border-border/40 rounded-lg p-2.5">
        <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
          {productImage ? (
            <Image
              src={productImage}
              alt={productName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={14} className="text-muted/30" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-foreground truncate">
            {productName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-400">
              {t('agreedPrice')}
            </span>
            <span className="text-[13px] font-bold text-foreground">
              {formatPrice(price)}
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Shipping */}
      {step === 'shipping' && (
        <div className="space-y-3">
          {/* Shipping form */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1 block">
                {t('fullName')}
              </label>
              <input
                value={shipping.name}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, name: e.target.value }))
                }
                placeholder={t('johnDoe')}
                className="w-full bg-surface border border-border/60 rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1 block">
                {t('address')}
              </label>
              <input
                value={shipping.address_line1}
                onChange={(e) =>
                  setShipping((s) => ({
                    ...s,
                    address_line1: e.target.value,
                  }))
                }
                placeholder={t('mainStPlaceholder')}
                className="w-full bg-surface border border-border/60 rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1 block">
                {t('addressLine2')}{' '}
                <span className="text-muted/40 normal-case">
                  ({t('optional')})
                </span>
              </label>
              <input
                value={shipping.address_line2}
                onChange={(e) =>
                  setShipping((s) => ({
                    ...s,
                    address_line2: e.target.value,
                  }))
                }
                placeholder={t('aptPlaceholder')}
                className="w-full bg-surface border border-border/60 rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1 block">
                  {t('city')}
                </label>
                <input
                  value={shipping.city}
                  onChange={(e) =>
                    setShipping((s) => ({ ...s, city: e.target.value }))
                  }
                  placeholder={t('cityPlaceholder')}
                  className="w-full bg-surface border border-border/60 rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1 block">
                  {t('state')}
                </label>
                <input
                  value={shipping.state}
                  onChange={(e) =>
                    setShipping((s) => ({ ...s, state: e.target.value }))
                  }
                  placeholder={t('statePlaceholder')}
                  className="w-full bg-surface border border-border/60 rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1 block">
                  {t('zip')}
                </label>
                <input
                  value={shipping.zip}
                  onChange={(e) =>
                    setShipping((s) => ({ ...s, zip: e.target.value }))
                  }
                  placeholder={t('zipPlaceholder')}
                  className="w-full bg-surface border border-border/60 rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="border-t border-border/30 pt-2.5 space-y-1.5 text-[12px]">
            <div className="flex justify-between text-muted">
              <span>{t('itemPrice')}</span>
              <span className="text-foreground font-medium">
                {formatPrice(price)}
              </span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{t('shipping')}</span>
              <span
                className={
                  shippingFee === 0
                    ? 'text-emerald-400 font-medium'
                    : 'text-foreground font-medium'
                }
              >
                {shippingFee === 0 ? t('free') : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{t('taxLabel')}</span>
              <span className="text-foreground font-medium">
                {formatPrice(tax)}
              </span>
            </div>
            <div className="border-t border-border/30 pt-1.5 flex justify-between font-bold text-foreground text-[13px]">
              <span>{t('total')}</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinueToPayment}
            disabled={!isShippingComplete()}
            className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-[13px] font-bold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {t('continueToPayment')}
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 'payment' && (
        <div className="space-y-3">
          {/* Total callout */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">
              {t('totalDue')}
            </p>
            <p className="text-xl font-bold text-foreground">
              {formatPrice(total)}
            </p>
          </div>

          {/* Shipping summary */}
          <div className="flex items-start gap-2 bg-surface/50 border border-border/40 rounded-lg p-2.5 text-[11px]">
            <MapPin size={12} className="text-muted mt-0.5 shrink-0" />
            <div className="text-muted leading-relaxed">
              <span className="text-foreground font-medium">
                {shipping.name}
              </span>
              <br />
              {shipping.address_line1}
              {shipping.address_line2 && <>, {shipping.address_line2}</>}
              <br />
              {shipping.city}, {shipping.state} {shipping.zip}
            </div>
          </div>

          {/* Payment method tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all cursor-pointer ${
                paymentMethod === 'card'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-muted hover:border-border'
              }`}
            >
              <CreditCard size={13} />
              {t('card')}
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all cursor-pointer ${
                paymentMethod === 'paypal'
                  ? 'border-[#0070ba] bg-[#0070ba]/10 text-[#0070ba]'
                  : 'border-border bg-surface text-muted hover:border-border'
              }`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.22A.859.859 0 0 1 5.791 1.5h6.396c2.122 0 3.702.476 4.697 1.418.979.928 1.362 2.265 1.138 3.972-.035.262-.085.534-.148.813-.698 3.127-2.904 4.797-6.394 4.797H9.442a.857.857 0 0 0-.846.737l-.991 6.1z" />
                <path
                  d="M18.27 7.468c-.035.262-.085.534-.148.813-.698 3.127-2.904 4.797-6.394 4.797H9.442a.857.857 0 0 0-.846.737l-1.342 8.253a.534.534 0 0 0 .527.618h3.7a.753.753 0 0 0 .743-.648l.034-.175.59-3.736.038-.205a.752.752 0 0 1 .742-.648h.468c3.028 0 5.397-1.23 6.089-4.788.289-1.486.139-2.727-.624-3.6a3.08 3.08 0 0 0-.87-.618z"
                  opacity="0.7"
                />
              </svg>
              {t('paypal')}
            </button>
          </div>

          {/* Card payment */}
          {paymentMethod === 'card' && (
            <div className="space-y-3">
              {!token ? (
                <div className="bg-surface border border-border rounded-lg p-3 text-center">
                  <p className="text-[12px] text-muted">
                    {t('loginToComplete')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-surface border border-border/60 rounded-lg p-3">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '13px',
                            color: '#e2e8f0',
                            '::placeholder': { color: '#64748b' },
                            iconColor: '#94a3b8',
                          },
                          invalid: { color: '#ef4444' },
                        },
                      }}
                    />
                  </div>
                  <button
                    onClick={handleStripePayment}
                    disabled={loading || !stripe}
                    className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-[13px] font-bold bg-primary text-white rounded-xl hover:bg-primary-dark shadow-[0_0_15px_rgba(232,136,58,0.15)] hover:shadow-[0_0_25px_rgba(232,136,58,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Lock size={14} />
                    )}
                    {loading
                      ? t('processing')
                      : `${t('pay')} ${formatPrice(total)}`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* PayPal payment */}
          {paymentMethod === 'paypal' && (
            <>
              {!token ? (
                <div className="bg-surface border border-border rounded-lg p-3 text-center">
                  <p className="text-[12px] text-muted">
                    {t('loginToComplete')}
                  </p>
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-lg p-3">
                  <PayPalButtons
                    style={{
                      layout: 'vertical',
                      color: 'blue',
                      shape: 'rect',
                      label: 'pay',
                      height: 40,
                    }}
                    disabled={loading}
                    createOrder={async () => {
                      setError(null);
                      setLoading(true);
                      try {
                        const data = await createPayPalCheckout(
                          getCheckoutData(),
                          token
                        );
                        setLoading(false);
                        return data.paypalOrderId;
                      } catch (err) {
                        setLoading(false);
                        setError(
                          err instanceof Error
                            ? err.message
                            : 'Failed to create PayPal order'
                        );
                        throw err;
                      }
                    }}
                    onApprove={async (data) => {
                      setLoading(true);
                      setError(null);
                      try {
                        const result = await capturePayPalPayment(
                          data.orderID,
                          token
                        );
                        setOrderNumber(result.orderNumber || null);
                        setSuccess(true);
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : 'Payment capture failed'
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onError={() => {
                      setError(
                        'PayPal encountered an error. Please try again.'
                      );
                      setLoading(false);
                    }}
                    onCancel={() => {
                      setLoading(false);
                    }}
                  />
                </div>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-[12px] text-center">{error}</p>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-[12px] text-muted">{t('processing')}</span>
            </div>
          )}

          {/* Security */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-muted pt-1">
            <span className="flex items-center gap-1">
              <Shield size={10} className="text-emerald-400" />
              {t('sslEncrypted')}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-blue-400" />
              {t('buyerProtection')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatCheckout(props: ChatCheckoutProps) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId || 'test',
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <Elements stripe={getStripePromise()}>
        <ChatCheckoutInner {...props} />
      </Elements>
    </PayPalScriptProvider>
  );
}
