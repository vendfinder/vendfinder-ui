'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
  CreditCard,
  Lock,
  MapPin,
  Package,
  Shield,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Home,
  Loader2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useFormattedPrice } from '@/hooks/useFormattedPrice';
import { useTranslations } from 'next-intl';
import {
  createCheckout,
  createPayPalCheckout,
  capturePayPalPayment,
  type CheckoutData,
} from '@/lib/api-orders';

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

// Lazy load Stripe to avoid impure function during render
const getStripePromise = () => {
  if (typeof window !== 'undefined') {
    return loadStripe(stripeKey);
  }
  return Promise.resolve(null);
};

type PaymentMethod = 'card' | 'paypal';

function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const formatPrice = useFormattedPrice();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paymentMethod = 'card'; // Stripe only

  const [shipping, setShipping] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Package size={32} className="text-muted/30" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t('checkout.emptyTitle')}
        </h1>
        <p className="text-sm text-muted mb-6">{t('checkout.emptyDesc')}</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all"
        >
          {t('common.browseProducts')}
        </Link>
      </div>
    );
  }

  const shippingFee = 0; // No shipping charges - always free
  const tax = totalPrice * 0.08;
  const grandTotal = totalPrice + shippingFee + tax;

  function getCheckoutData(): CheckoutData {
    const item = items[0];
    return {
      product_id: item.product.id,
      product_name: item.product.name,
      product_image: item.product.images?.[0],
      product_category: item.product.category,
      size: item.size,
      item_price: item.product.price,
      seller_id:
        item.product.sellerId || '00000000-0000-0000-0000-000000000099',
      seller_name: item.product.sellerName || undefined,
      shipping_name: `${shipping.firstName} ${shipping.lastName}`,
      shipping_address_line1: shipping.address,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      shipping_zip: shipping.zip,
    };
  }

  function isShippingComplete() {
    return (
      shipping.firstName &&
      shipping.lastName &&
      shipping.address &&
      shipping.city &&
      shipping.state &&
      shipping.zip
    );
  }

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !user || !token) return;

    setLoading(true);
    setError(null);

    try {
      const { clientSecret } = await createCheckout(getCheckoutData(), token);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error(t('checkout.cardNotFound'));

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${shipping.firstName} ${shipping.lastName}`,
              email: user.email,
            },
          },
        });

      if (stripeError) {
        setError(stripeError.message || t('checkout.paymentFailed'));
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        clearCart();
        router.push('/checkout/success');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('checkout.checkoutError')
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    t('checkout.stepCart'),
    t('checkout.stepCheckout'),
    t('checkout.stepConfirmation'),
  ];

  const shippingFields = [
    {
      id: 'firstName',
      label: t('checkout.firstName'),
      placeholder: t('checkout.firstNamePlaceholder'),
      icon: User,
      span: false,
    },
    {
      id: 'lastName',
      label: t('checkout.lastName'),
      placeholder: t('checkout.lastNamePlaceholder'),
      icon: User,
      span: false,
    },
    {
      id: 'address',
      label: t('checkout.address'),
      placeholder: t('checkout.addressPlaceholder'),
      icon: Home,
      span: true,
    },
    {
      id: 'city',
      label: t('checkout.city'),
      placeholder: t('checkout.cityPlaceholder'),
      icon: MapPin,
      span: false,
    },
    {
      id: 'state',
      label: t('checkout.state'),
      placeholder: t('checkout.statePlaceholder'),
      icon: MapPin,
      span: false,
    },
    {
      id: 'zip',
      label: t('checkout.zipCode'),
      placeholder: t('checkout.zipPlaceholder'),
      icon: Mail,
      span: false,
    },
    {
      id: 'phone',
      label: t('checkout.phone'),
      placeholder: t('checkout.phonePlaceholder'),
      icon: Phone,
      span: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center">
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('checkout.title')}
          </h1>
        </div>
        <p className="text-sm text-muted">{t('checkout.subtitle')}</p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="flex items-center gap-3 mb-8"
      >
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-3 flex-1">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                i <= 1
                  ? i === 1
                    ? 'bg-primary text-white'
                    : 'bg-emerald-400/10 text-emerald-400'
                  : 'bg-surface text-muted border border-border'
              }`}
            >
              {i < 1 ? <CheckCircle2 size={12} /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{step}</span>
            </div>
            {i < 2 && (
              <div
                className={`flex-1 h-px ${
                  i < 1 ? 'bg-emerald-400/40' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </motion.div>

      <form onSubmit={handleStripeSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form */}
          <div className="flex-1 space-y-6">
            {/* Shipping */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center">
                  <MapPin size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('checkout.shippingTitle')}
                  </p>
                  <p className="text-[11px] text-muted">
                    {t('checkout.shippingSubtitle')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shippingFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div
                      key={field.id}
                      className={field.span ? 'sm:col-span-2' : ''}
                    >
                      <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                        {field.label}
                      </label>
                      <div className="relative">
                        <Icon
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40"
                        />
                        <input
                          required
                          value={
                            shipping[field.id as keyof typeof shipping] || ''
                          }
                          onChange={(e) =>
                            setShipping((s) => ({
                              ...s,
                              [field.id]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Payment Method Selection */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-violet-400/10 text-violet-400 flex items-center justify-center">
                  <CreditCard size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('checkout.paymentTitle')}
                  </p>
                  <p className="text-[11px] text-muted">
                    {t('checkout.paymentSubtitle')}
                  </p>
                </div>
              </div>

              {/* Stripe Credit Card Only */}
              <div className="mb-5">
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary bg-primary/10 text-primary text-sm font-semibold">
                  <CreditCard size={16} />
                  {t('checkout.creditCard')}
                </div>
              </div>

              {/* Stripe Credit Card Payment */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '14px',
                        color: '#e2e8f0',
                        '::placeholder': { color: '#64748b' },
                        iconColor: '#94a3b8',
                      },
                      invalid: { color: '#ef4444' },
                    },
                  }}
                />
              </div>
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

              <div className="flex items-center gap-1.5 mt-4 text-[11px] text-muted">
                <Lock size={11} className="text-emerald-400" />
                {t('checkout.securityNotice')}
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full lg:w-80"
          >
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                {t('checkout.orderSummary')}
              </h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
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
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-muted">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.06] pt-3 space-y-2.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>{t('cart.subtotal')}</span>
                  <span className="text-foreground font-medium">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{t('checkout.shipping')}</span>
                  <span
                    className={
                      shippingFee === 0
                        ? 'text-emerald-400 font-medium'
                        : 'text-foreground font-medium'
                    }
                  >
                    {shippingFee === 0
                      ? t('common.free')
                      : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{t('checkout.tax')}</span>
                  <span className="text-foreground font-medium">
                    {formatPrice(tax)}
                  </span>
                </div>
                <div className="border-t border-white/[0.06] pt-3 flex justify-between font-bold text-foreground text-base">
                  <span>{t('checkout.total')}</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={loading || !stripe}
                className="flex items-center justify-center gap-2 w-full mt-6 px-6 py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Lock size={14} />
                )}
                {loading ? t('checkout.processing') : t('checkout.placeOrder')}
              </button>

              <div className="flex items-center justify-center gap-3 mt-4 text-[10px] text-muted">
                <span className="flex items-center gap-1">
                  <Shield size={10} className="text-emerald-400" />
                  {t('common.sslEncrypted')}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-blue-400" />
                  {t('common.buyerProtection')}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={getStripePromise()}>
      <CheckoutForm />
    </Elements>
  );
}
