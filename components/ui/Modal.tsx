'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md', position = 'center' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  const positionClasses = {
    center: 'items-center justify-center p-4',
    top: 'items-start justify-center p-0',
    bottom: 'items-end justify-center p-0 sm:p-4',
  };

  const animationStyle = position === 'top' 
    ? { animation: 'slideInTop 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }
    : position === 'bottom'
    ? { animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }
    : { animation: 'scaleIn 0.15s ease' };

  return (
    <div
      className={`fixed inset-0 z-50 flex ${positionClasses[position]}`}
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidths[maxWidth]} bg-surface border-b border-x border-border shadow-2xl overflow-hidden 
          ${position === 'bottom' ? 'rounded-t-2xl sm:rounded-2xl' 
          : position === 'top' ? 'rounded-b-2xl sm:rounded-2xl border-t-0' 
          : 'rounded-2xl border-t'}`}
        style={animationStyle}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-primary font-heading">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-primary transition-all"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[85vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
