"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  User,
  MapPin,
  Instagram,
  Globe,
  CheckCircle2,
  Camera,
  ExternalLink,
  AtSign,
  Type,
  FileText,
  Link2,
  ShieldCheck,
  Star,
  Tag,
  Package,
  Eye,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { uploadUserImage } from "@/lib/api-users";
import { useTranslations } from "next-intl";

export default function ProfileEditPage() {
  const { user, updateProfile } = useAuth();
  const { sellerStats } = useDashboardData();
  const t = useTranslations("dashboardProfile");
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [instagram, setInstagram] = useState(user?.socialLinks?.instagram || "");
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter || "");
  const [website, setWebsite] = useState(user?.socialLinks?.website || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user?.banner || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (type: "avatar" | "banner", file: File) => {
    const token = localStorage.getItem("vendfinder-token");
    if (!token) return;

    const preview = URL.createObjectURL(file);
    if (type === "avatar") {
      setAvatarPreview(preview);
      setAvatarUploading(true);
    } else {
      setBannerPreview(preview);
      setBannerUploading(true);
    }

    const { url, error } = await uploadUserImage(type, file, token);
    if (type === "avatar") setAvatarUploading(false);
    else setBannerUploading(false);

    if (error) {
      setSaveError(error);
      return;
    }

    if (url) {
      if (type === "avatar") {
        setAvatarPreview(url);
        await updateProfile({ avatarUrl: url });
      } else {
        setBannerPreview(url);
        await updateProfile({ bannerUrl: url });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const result = await updateProfile({
      displayName: name,
      username,
      bio,
      location,
      socialInstagram: instagram,
      socialTwitter: twitter,
      socialWebsite: website,
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setSaveError(result.error || t("failedToSave"));
    }
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <User size={15} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          </div>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link
          href={`/profile/${user?.username || "me"}`}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all bg-surface/40 backdrop-blur-sm w-fit"
        >
          <Eye size={14} />
          {t("viewPublicProfile")}
        </Link>
      </motion.div>

      <form onSubmit={handleSave} className="max-w-2xl">
        <div className="space-y-6">
          {/* Profile Banner / Avatar Card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            {/* Banner area */}
            <div className="h-28 bg-gradient-to-r from-primary/20 via-violet-500/10 to-blue-500/15 relative overflow-hidden">
              {bannerPreview ? (
                <img src={bannerPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{
                  backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 20px, rgba(255,255,255,0.02) 20px, rgba(255,255,255,0.02) 21px)",
                }} />
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload("banner", file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5 hover:bg-black/40 transition-colors disabled:opacity-60"
              >
                {bannerUploading ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
                {bannerUploading ? t("uploading") : t("editBanner")}
              </button>
            </div>

            {/* Avatar + quick stats */}
            <div className="px-5 pb-5">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 border-4 border-card flex items-center justify-center text-primary font-bold text-2xl shadow-xl overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      name?.charAt(0) || "?"
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload("avatar", file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {avatarUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                  </button>
                  {user?.verified && (
                    <CheckCircle2
                      size={16}
                      className="absolute -top-1 -right-1 text-primary fill-primary bg-card rounded-full"
                    />
                  )}
                </div>
                <div className="pb-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{name || t("yourName")}</p>
                  <p className="text-[11px] text-muted">@{username || t("usernameDefault")}</p>
                </div>
              </div>

              {/* Mini stats row */}
              <div className="flex items-center gap-5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-foreground">{sellerStats.totalSales > 0 ? sellerStats.sellerRating : "—"}</span>
                  <span className="text-muted">{t("rating")}</span>
                </div>
                <div className="w-px h-3 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <Package size={11} className="text-muted/50" />
                  <span className="font-semibold text-foreground">{sellerStats.totalSales}</span>
                  <span className="text-muted">{t("sales")}</span>
                </div>
                <div className="w-px h-3 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <Tag size={11} className="text-muted/50" />
                  <span className="font-semibold text-foreground">{sellerStats.activeListings}</span>
                  <span className="text-muted">{t("listings")}</span>
                </div>
                <div className="w-px h-3 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-muted">{t("lvl")}</span>
                  <span className="font-semibold text-primary">{user?.sellerLevel || 1}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-5"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center">
                <FileText size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("basicInformation")}</p>
                <p className="text-[11px] text-muted">{t("basicInformationDesc")}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  {t("displayName")}
                </label>
                <div className="relative">
                  <Type size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder={t("displayNamePlaceholder")}
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  {t("username")}
                </label>
                <div className="relative">
                  <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder={t("usernamePlaceholder")}
                  />
                </div>
                <p className="text-[11px] text-muted mt-1.5 ml-1">vendfinder.com/profile/{username || t("usernameDefault")}</p>
              </div>

              {/* Bio */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  {t("bio")}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("bioPlaceholder")}
                  rows={3}
                  maxLength={160}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
                <div className="flex items-center justify-between mt-1.5 ml-1">
                  <p className="text-[11px] text-muted">{t("bioDescription")}</p>
                  <p className={`text-[11px] font-medium ${bio.length > 140 ? "text-amber-400" : "text-muted"}`}>
                    {bio.length}/160
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  {t("location")}
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder={t("locationPlaceholder")}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-card rounded-2xl border border-border p-5"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-400/10 text-violet-400 flex items-center justify-center">
                <Link2 size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("socialLinks")}</p>
                <p className="text-[11px] text-muted">{t("socialLinksDesc")}</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: t("socialInstagram"),
                  icon: Instagram,
                  value: instagram,
                  onChange: setInstagram,
                  placeholder: t("socialUsernamePlaceholder"),
                  color: "text-pink-400",
                  bgColor: "bg-pink-400/10",
                },
                {
                  label: t("socialTwitter"),
                  icon: AtSign,
                  value: twitter,
                  onChange: setTwitter,
                  placeholder: t("socialUsernamePlaceholder"),
                  color: "text-foreground",
                  bgColor: "bg-surface",
                  customIcon: <span className="text-[13px] font-bold">𝕏</span>,
                },
                {
                  label: t("socialWebsite"),
                  icon: Globe,
                  value: website,
                  onChange: setWebsite,
                  placeholder: t("socialWebsitePlaceholder"),
                  color: "text-blue-400",
                  bgColor: "bg-blue-400/10",
                },
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <div key={social.label}>
                    <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                      {social.label}
                    </label>
                    <div className="relative">
                      <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg ${social.bgColor} ${social.color} flex items-center justify-center`}>
                        {social.customIcon || <Icon size={13} />}
                      </div>
                      <input
                        value={social.value}
                        onChange={(e) => social.onChange(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                        placeholder={social.placeholder}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Verification Status */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`bg-card rounded-2xl border ${user?.verified ? "border-emerald-400/20" : "border-amber-400/20"} p-5`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${
                user?.verified ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
              } flex items-center justify-center shrink-0`}>
                <ShieldCheck size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.verified ? t("identityVerified") : t("verifyYourIdentity")}
                  </p>
                  {user?.verified && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400">
                      {t("verified")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted">
                  {user?.verified
                    ? t("identityVerifiedDesc")
                    : t("verifyYourIdentityDesc")}
                </p>
              </div>
              {!user?.verified && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-400/30 text-amber-400 text-xs font-semibold hover:bg-amber-400/10 transition-all shrink-0"
                >
                  {t("startVerification")}
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Error message */}
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm text-red-400"
            >
              {saveError}
            </motion.div>
          )}

          {/* Save bar */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex items-center gap-3 pt-2"
          >
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all disabled:opacity-60"
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} />
                    {t("saved")}
                  </motion.span>
                ) : saving ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    {t("saving")}
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    {t("saveChanges")}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-5 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-all"
            >
              {t("cancel")}
            </button>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
