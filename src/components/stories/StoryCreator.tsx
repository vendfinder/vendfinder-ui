"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ImagePlus,
  Type,
  Loader2,
  Send,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStoryStore } from "@/stores/stories";
import { uploadStoryMedia } from "@/lib/api-stories";

const textPositionDefs = [
  { value: "top" as const, icon: AlignVerticalJustifyStart, key: "positionTop" },
  { value: "center" as const, icon: AlignVerticalJustifyCenter, key: "positionCenter" },
  { value: "bottom" as const, icon: AlignVerticalJustifyEnd, key: "positionBottom" },
];

export default function StoryCreator() {
  const t = useTranslations("stories");
  const { token } = useAuth();
  const { creatorOpen, closeCreator, createStory } = useStoryStore();

  const [mounted, setMounted] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [textOverlay, setTextOverlay] = useState("");
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("center");
  const [showTextInput, setShowTextInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Lock body scroll
  useEffect(() => {
    if (!creatorOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [creatorOpen]);

  // Reset on close
  useEffect(() => {
    if (!creatorOpen) {
      setPreview(null);
      setFile(null);
      setTextOverlay("");
      setShowTextInput(false);
      setError(null);
    }
  }, [creatorOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError(t("onlyImageFiles"));
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError(t("fileTooLarge"));
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file || !token || uploading) return;
    setUploading(true);
    setError(null);

    try {
      // Upload media
      const { url, error: uploadError } = await uploadStoryMedia(file, token);
      if (uploadError || !url) {
        setError(uploadError || "Upload failed");
        setUploading(false);
        return;
      }

      // Create story
      const ok = await createStory(
        {
          mediaUrl: url,
          textOverlay: textOverlay.trim() || undefined,
          textPosition: textOverlay.trim() ? textPosition : undefined,
        },
        token
      );

      if (ok) {
        closeCreator();
      } else {
        setError(t("failedToCreate"));
      }
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setUploading(false);
    }
  };

  if (!mounted || !creatorOpen) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={closeCreator}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[400px] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-foreground">{t("newStory")}</h2>
          <button
            onClick={closeCreator}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!preview ? (
            /* Upload zone */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-[400px] rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/[0.03] hover:bg-primary/[0.06] flex flex-col items-center justify-center gap-3 text-primary transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center transition-colors">
                <ImagePlus size={28} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{t("choosePhoto")}</p>
                <p className="text-[11px] text-muted mt-1">
                  {t("photoFormats")}
                </p>
              </div>
            </button>
          ) : (
            /* Preview */
            <div className="space-y-4">
              <div className="relative aspect-[9/16] max-h-[400px] rounded-2xl overflow-hidden bg-black">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_50%,rgba(0,0,0,0.3)_100%)]" />

                {/* Text overlay preview */}
                {textOverlay && (
                  <div
                    className={`absolute left-0 right-0 px-4 text-center ${
                      textPosition === "top"
                        ? "top-8"
                        : textPosition === "bottom"
                          ? "bottom-8"
                          : "top-1/2 -translate-y-1/2"
                    }`}
                  >
                    <span className="inline-block bg-black/50 backdrop-blur-md text-white text-sm font-bold px-4 py-2.5 rounded-xl border border-white/10">
                      {textOverlay}
                    </span>
                  </div>
                )}

                {/* Change photo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/70 hover:text-white border border-white/10 transition-colors"
                >
                  <ImagePlus size={16} />
                </button>
              </div>

              {/* Text controls */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowTextInput(!showTextInput)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all w-full ${
                    showTextInput
                      ? "border-primary/40 bg-primary/[0.06] text-primary"
                      : "border-border bg-surface text-foreground hover:border-border-hover"
                  }`}
                >
                  <Type size={15} />
                  {showTextInput ? t("hideTextOverlay") : t("addTextOverlay")}
                </button>

                <AnimatePresence>
                  {showTextInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3"
                    >
                      <input
                        value={textOverlay}
                        onChange={(e) => setTextOverlay(e.target.value)}
                        placeholder={t("captionPlaceholder")}
                        maxLength={120}
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-foreground text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                          {t("position")}
                        </span>
                        <div className="flex gap-1 ml-1">
                          {textPositionDefs.map((pos) => {
                            const Icon = pos.icon;
                            return (
                              <button
                                key={pos.value}
                                type="button"
                                onClick={() => setTextPosition(pos.value)}
                                className={`p-2 rounded-lg transition-all ${
                                  textPosition === pos.value
                                    ? "bg-primary/15 text-primary"
                                    : "text-muted hover:text-foreground hover:bg-surface"
                                }`}
                                title={t(pos.key)}
                              >
                                <Icon size={14} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="px-5 pb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={closeCreator}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-all"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-[0_0_20px_rgba(232,136,58,0.15)] hover:shadow-[0_0_30px_rgba(232,136,58,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {t("posting")}
                </>
              ) : (
                <>
                  <Send size={15} />
                  {t("shareStory")}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}
