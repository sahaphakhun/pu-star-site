'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  title?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-4xl',
  maxHeight = 'max-h-[90vh]',
  className = '',
  title,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 md:ml-56 ${className}`}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`bg-white rounded-lg border shadow-xl ${maxWidth} w-full ${maxHeight} overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminModal;
