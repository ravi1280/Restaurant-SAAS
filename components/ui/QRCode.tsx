'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from './Button';

interface QRCodeDisplayProps {
  url: string;
  tableId: number | string;
  size?: number;
  showDownload?: boolean;
}

export function QRCodeDisplay({ url, tableId, size = 200, showDownload = true }: QRCodeDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = size + 40;
    canvas.height = size + 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0C0C0E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, 20, 20, size, size);
      const a = document.createElement('a');
      a.download = `table-${tableId}-qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgStr);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={ref} className="p-4 bg-white rounded-xl">
        <QRCodeSVG
          value={url}
          size={size}
          bgColor="#FFFFFF"
          fgColor="#0C0C0E"
          level="M"
        />
      </div>
      <p className="text-xs text-muted font-mono break-all text-center max-w-[200px]">{url}</p>
      {showDownload && (
        <Button variant="secondary" size="sm" onClick={downloadQR}>
          <Download size={14} />
          Download PNG
        </Button>
      )}
    </div>
  );
}
