'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, X } from 'lucide-react';
import UserSearch from './UserSearch';

interface UserSearchModalProps {
  trigger?: React.ReactNode;
  className?: string;
}

export default function UserSearchModal({
  trigger,
  className = "p-2 text-muted hover:text-primary transition-colors"
}: UserSearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultTrigger = (
    <button
      onClick={() => setIsOpen(true)}
      className={className}
      title="Search users"
    >
      <Users size={20} />
    </button>
  );

  return (
    <>
      {/* Trigger */}
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="relative z-10 w-full max-w-2xl"
            >
              <UserSearch
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                autoFocus
                placeholder="Search for creators, sellers, and collectors..."
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}