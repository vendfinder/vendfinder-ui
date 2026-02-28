"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { sellerStats } from "@/data/seller";

export default function ProfileEditPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [instagram, setInstagram] = useState(user?.socialLinks?.instagram || "");
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter || "");
  const [website, setWebsite] = useState(user?.socialLinks?.website || "");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      username,
      bio,
      location,
      socialLinks: { instagram, twitter, website },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
            <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
          </div>
          <p className="text-sm text-muted">Manage how others see you on VendFinder</p>
        </div>
        <Link
          href={`/profile/${user?.username || "me"}`}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all bg-surface/40 backdrop-blur-sm w-fit"
        >
          <Eye size={14} />
          View Public Profile
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
            <div className="h-28 bg-gradient-to-r from-primary/20 via-violet-500/10 to-blue-500/15 relative">
              <div className="absolute inset-0" style={{
                backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 20px, rgba(255,255,255,0.02) 20px, rgba(255,255,255,0.02) 21px)",
              }} />
              <button
                type="button"
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5 hover:bg-black/40 transition-colors"
              >
                <Camera size={11} />
                Edit Banner
              </button>
            </div>

            {/* Avatar + quick stats */}
            <div className="px-5 pb-5">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 border-4 border-card flex items-center justify-center text-primary font-bold text-2xl shadow-xl">
                    {name?.charAt(0) || "?"}
                  </div>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
                  >
                    <Camera size={12} />
                  </button>
                  {user?.verified && (
                    <CheckCircle2
                      size={16}
                      className="absolute -top-1 -right-1 text-primary fill-primary bg-card rounded-full"
                    />
                  )}
                </div>
                <div className="pb-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{name || "Your Name"}</p>
                  <p className="text-[11px] text-muted">@{username || "username"}</p>
                </div>
              </div>

              {/* Mini stats row */}
              <div className="flex items-center gap-5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-foreground">{sellerStats.sellerRating}</span>
                  <span className="text-muted">rating</span>
                </div>
                <div className="w-px h-3 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <Package size={11} className="text-muted/50" />
                  <span className="font-semibold text-foreground">{sellerStats.totalSales}</span>
                  <span className="text-muted">sales</span>
                </div>
                <div className="w-px h-3 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <Tag size={11} className="text-muted/50" />
                  <span className="font-semibold text-foreground">{sellerStats.activeListings}</span>
                  <span className="text-muted">listings</span>
                </div>
                <div className="w-px h-3 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-muted">Lvl</span>
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
                <p className="text-sm font-semibold text-foreground">Basic Information</p>
                <p className="text-[11px] text-muted">Your public profile details</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  Display Name
                </label>
                <div className="relative">
                  <Type size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder="Your name"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  Username
                </label>
                <div className="relative">
                  <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder="username"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1.5 ml-1">vendfinder.com/profile/{username || "username"}</p>
              </div>

              {/* Bio */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={3}
                  maxLength={160}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
                <div className="flex items-center justify-between mt-1.5 ml-1">
                  <p className="text-[11px] text-muted">Brief description for your profile</p>
                  <p className={`text-[11px] font-medium ${bio.length > 140 ? "text-amber-400" : "text-muted"}`}>
                    {bio.length}/160
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1.5 block">
                  Location
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder="City, State"
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
                <p className="text-sm font-semibold text-foreground">Social Links</p>
                <p className="text-[11px] text-muted">Connect your social profiles</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: "Instagram",
                  icon: Instagram,
                  value: instagram,
                  onChange: setInstagram,
                  placeholder: "username",
                  color: "text-pink-400",
                  bgColor: "bg-pink-400/10",
                },
                {
                  label: "X (Twitter)",
                  icon: AtSign,
                  value: twitter,
                  onChange: setTwitter,
                  placeholder: "username",
                  color: "text-foreground",
                  bgColor: "bg-surface",
                  customIcon: <span className="text-[13px] font-bold">𝕏</span>,
                },
                {
                  label: "Website",
                  icon: Globe,
                  value: website,
                  onChange: setWebsite,
                  placeholder: "https://yoursite.com",
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
                    {user?.verified ? "Identity Verified" : "Verify Your Identity"}
                  </p>
                  {user?.verified && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted">
                  {user?.verified
                    ? "Your identity has been verified. This badge appears on your public profile."
                    : "Verify your identity to build trust with buyers and unlock higher selling limits."}
                </p>
              </div>
              {!user?.verified && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-400/30 text-amber-400 text-xs font-semibold hover:bg-amber-400/10 transition-all shrink-0"
                >
                  Start Verification
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Save bar */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex items-center gap-3 pt-2"
          >
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all"
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
                    Saved!
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    Save Changes
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-5 py-3 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-all"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
