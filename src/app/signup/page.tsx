'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Check,
  ShieldCheck,
  Package,
  Star,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signupSchema } from '@/lib/validators';
import { useTranslations } from 'next-intl';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  const passwordChecks = [
    { label: t('auth.passwordMinChars'), met: password.length >= 8 },
    { label: t('auth.passwordNumber'), met: /\d/.test(password) },
    { label: t('auth.passwordUppercase'), met: /[A-Z]/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const res = await signup(name, email, password);
    setIsLoading(false);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrors({ email: res.error || t('auth.registrationFailed') });
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left Panel — Brand / Decorative */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        {/* Layered gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f05] via-[#0f0b15] to-[#0B0B0F]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(232,136,58,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(139,92,246,0.08),transparent_50%)]" />

        {/* Animated orbs */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-primary/[0.07] blur-[120px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '10%', left: '-10%' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] blur-[100px]"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ bottom: '5%', right: '-5%' }}
        />

        {/* Diagonal line pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              rgba(232,136,58,0.5) 40px,
              rgba(232,136,58,0.5) 41px
            )`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div>
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logo.png"
                alt={t('common.appName')}
                width={44}
                height={44}
                className="rounded-lg transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-bold text-foreground tracking-tight">
                {t('common.appName')}
              </span>
            </Link>
          </div>

          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-display text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-4"
            >
              {t('auth.startYour')}
              <br />
              <span className="text-primary">{t('auth.journeyAccent')}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-muted text-lg max-w-sm leading-relaxed"
            >
              {t('auth.joinThousands')}
            </motion.p>

            {/* What you get */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-10 space-y-4"
            >
              {[
                {
                  icon: Package,
                  text: t('auth.benefitListItems'),
                  accent: 'text-success',
                },
                {
                  icon: ShieldCheck,
                  text: t('auth.benefitVerifiedBadge'),
                  accent: 'text-primary',
                },
                {
                  icon: Star,
                  text: t('auth.benefitReputation'),
                  accent: 'text-violet-400',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg bg-surface/80 border border-border/50 flex items-center justify-center ${item.accent}`}
                  >
                    <item.icon size={16} />
                  </div>
                  <span className="text-sm text-foreground/70">
                    {item.text}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          <div />
        </div>
      </div>

      {/* Right Panel — Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 relative">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt={t('common.appName')}
                width={36}
                height={36}
                className="rounded-md"
              />
              <span className="text-lg font-bold text-foreground">
                {t('common.appName')}
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('auth.createAccount')}
            </h1>
            <p className="mt-2 text-muted">{t('auth.startBuying')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('auth.fullName')}
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className={`w-full pl-11 pr-4 py-3 bg-surface border rounded-xl text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    errors.name ? 'border-error' : 'border-border'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-error">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={`w-full pl-11 pr-4 py-3 bg-surface border rounded-xl text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    errors.email ? 'border-error' : 'border-border'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-error">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.createPasswordPlaceholder')}
                  className={`w-full pl-11 pr-12 py-3 bg-surface border rounded-xl text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    errors.password ? 'border-error' : 'border-border'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-error">{errors.password}</p>
              )}
              {/* Password strength indicators */}
              {password.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {passwordChecks.map((check) => (
                    <span
                      key={check.label}
                      className={`flex items-center gap-1 text-[11px] transition-colors ${
                        check.met ? 'text-success' : 'text-muted/50'
                      }`}
                    >
                      <Check
                        size={10}
                        className={check.met ? 'opacity-100' : 'opacity-30'}
                      />
                      {check.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.reenterPassword')}
                  className={`w-full pl-11 pr-4 py-3 bg-surface border rounded-xl text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    errors.confirmPassword ? 'border-error' : 'border-border'
                  }`}
                />
                {confirmPassword && confirmPassword === password && (
                  <Check
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-success"
                  />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-error">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-[18px] h-[18px] rounded-[5px] border border-border bg-surface peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-muted group-hover:text-foreground/80 transition-colors leading-snug">
                {t('auth.agreeToTerms')}{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  {t('common.termsOfService')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  {t('common.privacyPolicy')}
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ) : (
                <>
                  {t('auth.createAccountBtn')}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary-dark font-semibold transition-colors"
            >
              {t('auth.signInLink')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
