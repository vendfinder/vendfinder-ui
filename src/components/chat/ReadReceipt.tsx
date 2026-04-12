'use client';

import { Check, CheckCheck } from 'lucide-react';

interface ReadReceiptProps {
  sent: boolean;
  read: boolean;
}

export default function ReadReceipt({ sent, read }: ReadReceiptProps) {
  if (!sent) return null;

  return (
    <span className="inline-flex items-center ml-1">
      {read ? (
        <CheckCheck size={12} className="text-primary/60" />
      ) : (
        <Check size={12} className="text-muted/40" />
      )}
    </span>
  );
}
