'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, RotateCw, ZoomIn, Info, QrCode, Smartphone, Sparkles, HelpCircle } from 'lucide-react';

// Declare types for <model-viewer> custom element so TypeScript compiles cleanly in React/Next.js
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: boolean;
          'ar-modes'?: string;
          'ar-scale'?: string;
          'camera-controls'?: boolean;
          'touch-action'?: string;
          'shadow-intensity'?: string;
          'auto-rotate'?: boolean;
          'ios-src'?: string;
          'xr-environment'?: boolean;
          exposure?: string;
          loading?: string;
          reveal?: string;
          poster?: string;
          'ar-placement'?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface ARFoodPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  modelUrl: string;
  emoji: string;
  price: number;
}

export function ARFoodPreview({ isOpen, onClose, itemName, modelUrl, emoji, price }: ARFoodPreviewProps) {
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isArSupported, setIsArSupported] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const modelViewerRef = useRef<any>(null);

  // Dynamic import of @google/model-viewer to bypass Next.js SSR (Server-Side Rendering)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      
      // Load the web component
      import('@google/model-viewer')
        .then(() => setModelViewerLoaded(true))
        .catch((err) => console.error('Failed to load @google/model-viewer', err));
    }
  }, []);

  // Listen to model-viewer events to manage state and detect AR support
  useEffect(() => {
    const el = modelViewerRef.current;
    if (!el) return;

    const handleLoad = () => {
      setIsLoading(false);
    };

    const handleARStatus = (event: any) => {
      // If AR fails or status is not supported
      if (event.detail.status === 'failed') {
        setIsArSupported(false);
      }
    };

    el.addEventListener('load', handleLoad);
    el.addEventListener('ar-status', handleARStatus);

    // Initial check: if model-viewer checks AR capabilities
    if (el.canActivateAR === false) {
      setIsArSupported(false);
    }

    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('ar-status', handleARStatus);
    };
  }, [modelViewerLoaded, isOpen]);

  // Prevent scroll propagation when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-lg animate-fade-in">
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-lg md:max-w-2xl bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-elevated/40">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce-subtle">{emoji}</span>
            <div>
              <h3 className="font-heading font-bold text-lg text-primary">{itemName}</h3>
              <p className="text-xs text-muted">Rs. {price.toLocaleString()} · 3D Interactive Preview</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:text-primary hover:bg-elevated rounded-full transition-all"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Main 3D Viewport */}
          <div className="flex-1 relative bg-elevated/25 min-h-[300px] md:min-h-[400px] flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-surface/50 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-semibold text-primary">Preparing dish ingredients...</p>
                <p className="text-xs text-muted mt-1">Downloading 3D assets</p>
              </div>
            )}

            {/* Model Viewer Custom Element */}
            {modelViewerLoaded ? (
              <model-viewer
                ref={modelViewerRef}
                src={modelUrl}
                alt={`3D model of ${itemName}`}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                touch-action="none"
                shadow-intensity="1.5"
                shadow-softness="1"
                auto-rotate
                ar-scale="fixed" // Food items are rendered 1:1 real size
                ar-placement="table" // Targets table-top surfaces
                exposure="1.2"
                style={{ width: '100%', height: '100%', outline: 'none' }}
              >
                {/* Custom AR Button */}
                <button
                  slot="ar-button"
                  className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-6 py-3.5 bg-accent text-white font-semibold rounded-full shadow-lg shadow-accent/30 hover:bg-accent/90 active:scale-95 transition-all z-20 whitespace-nowrap border border-white/20"
                >
                  <Sparkles size={18} />
                  View on Table (AR)
                </button>

                {/* Loading state poster */}
                <div slot="poster" className="hidden"></div>
              </model-viewer>
            ) : (
              <p className="text-sm text-muted">Initializing graphics engine...</p>
            )}

            {/* Gestures Info overlay */}
            <div className="absolute top-4 left-4 p-2.5 bg-surface/70 backdrop-blur-md border border-border/60 rounded-2xl max-w-[200px] pointer-events-none text-[10px] text-muted space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Info size={12} className="text-accent" />
                <span>3D Interaction Tips</span>
              </div>
              <p>👆 <strong>Rotate:</strong> Drag with 1 finger</p>
              <p>✌️ <strong>Zoom/Move:</strong> Pinch / Drag with 2 fingers</p>
            </div>
          </div>

          {/* Desktop QR & Mobile Assist Panel */}
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border bg-elevated/10 p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-semibold text-sm text-primary flex items-center gap-1.5">
                  <Smartphone size={16} className="text-accent" />
                  <span>AR Experience Guide</span>
                </h4>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="p-1.5 bg-surface border border-border text-muted hover:text-primary rounded-lg transition-colors md:hidden"
                  title="Toggle QR Code"
                >
                  <QrCode size={16} />
                </button>
              </div>

              {/* Show QR code if Desktop OR toggled on mobile */}
              <div className={`${showQR ? 'block' : 'hidden md:block'} space-y-3 bg-surface p-3 rounded-2xl border border-border`}>
                <p className="text-[11px] text-muted text-center leading-tight">
                  Scan QR code on your mobile device to view this dish directly on your table!
                </p>
                <div className="flex justify-center p-2 bg-white rounded-xl border border-border/40">
                  {currentUrl ? (
                    <QRCodeSVG value={currentUrl} size={130} />
                  ) : (
                    <div className="w-[130px] h-[130px] bg-muted/20 animate-pulse rounded-lg" />
                  )}
                </div>
                <div className="text-center font-bold text-[10px] text-accent tracking-wider uppercase">
                  Mobile Recommended
                </div>
              </div>

              {/* Instruction Steps */}
              <div className={`space-y-3 ${!showQR ? 'block' : 'hidden md:block'}`}>
                <div className="text-xs space-y-2">
                  <div className="flex gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent font-bold shrink-0">1</span>
                    <p className="text-muted text-[11px] leading-relaxed">
                      Tap <strong>"View on Table"</strong> to open your device camera.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent font-bold shrink-0">2</span>
                    <p className="text-muted text-[11px] leading-relaxed">
                      Aim at a flat surface (table or plate) and wave slowly side-to-side.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent font-bold shrink-0">3</span>
                    <p className="text-muted text-[11px] leading-relaxed">
                      Once placed, pinch to adjust distance and rotate to view fine details!
                    </p>
                  </div>
                </div>

                {/* Compatibility alerts */}
                {!isArSupported && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-[11px] text-danger leading-relaxed">
                    <strong>Note:</strong> AR Core / WebXR might not be supported on this browser. Try opening in Chrome (Android) or Safari (iOS).
                  </div>
                )}
              </div>
            </div>

            {/* Troubleshooting info */}
            <div className="pt-4 border-t border-border mt-4 flex items-start gap-1.5 text-[10px] text-muted">
              <HelpCircle size={14} className="shrink-0 text-accent/80" />
              <div>
                <p className="font-semibold text-primary mb-0.5">Need help?</p>
                <p className="leading-snug">Ensure you allow camera permissions when prompted. iOS requires Safari and Android requires Chrome for optimal AR performance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
