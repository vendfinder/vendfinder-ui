"use client";

import { useState } from "react";
import { X, Flag, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const REASONS = [
  { id: "counterfeit", label: "Counterfeit or fake item" },
  { id: "spam", label: "Spam or misleading" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "scam", label: "Scam or fraud" },
  { id: "other", label: "Other" },
];

interface ReportDialogProps {
  targetType: "product" | "user" | "review";
  targetId: string;
  targetLabel?: string;
  onClose: () => void;
}

export default function ReportDialog({ targetType, targetId, targetLabel, onClose }: ReportDialogProps) {
  const { token } = useAuth();
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!token || loading || !reason) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit report");
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <Flag size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Report {targetType}</h3>
              {targetLabel && (
                <p className="text-[11px] text-muted truncate max-w-[240px]">{targetLabel}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">Report submitted</p>
              <p className="text-[12px] text-muted text-center">
                Thanks for helping keep VendFinder safe. We&apos;ll review your report within 48 hours.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-muted mb-4">Tell us what&apos;s wrong with this {targetType}:</p>

              <div className="space-y-2 mb-4">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      reason === r.id
                        ? "border-red-500/30 bg-red-500/[0.06]"
                        : "border-border bg-surface hover:border-border-hover"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={(e) => setReason(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        reason === r.id ? "border-red-400" : "border-border"
                      }`}
                    >
                      {reason === r.id && <div className="w-2 h-2 rounded-full bg-red-400" />}
                    </div>
                    <span className={`text-[13px] ${reason === r.id ? "text-foreground font-medium" : "text-muted"}`}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1.5 block">
                  Additional details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Provide any additional context..."
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-red-400/40 resize-none"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !reason}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag size={16} />
                    Submit Report
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
