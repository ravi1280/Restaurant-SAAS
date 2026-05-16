'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { QRCodeDisplay } from '@/components/ui/QRCode';
import { Button } from '@/components/ui/Button';
import { VenueSettings } from '@/lib/types';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings } = useRestaurant();
  const { showToast } = useToast();
  const [form, setForm] = useState<VenueSettings>(settings);
  const [qrTable, setQrTable] = useState(1);
  const [saving, setSaving] = useState(false);
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      updateSettings(form);
      showToast('Settings saved!', 'success');
      setSaving(false);
    }, 400);
  };

  const qrUrl = `${baseUrl}/table/${qrTable}`;

  const field = (key: keyof VenueSettings, label: string, type = 'text') => (
    <div>
      <label className="block text-sm text-muted mb-1">{label}</label>
      <input
        type={type}
        value={String(form[key])}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
        className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary text-sm focus:border-accent focus:outline-none"
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-heading">Settings & QR Codes</h1>
          <p className="text-sm text-muted mt-1">Configure your venue and generate table QR codes</p>
        </div>
        <Button variant="accent" loading={saving} onClick={handleSave}>
          <Save size={15} />
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Venue Info */}
        <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-primary">Venue Information</h2>
          {field('restaurantName', 'Restaurant Name')}
          {field('tagline', 'Tagline')}
          {field('address', 'Address')}
          {field('phone', 'Phone Number')}
          {field('gstNumber', 'GST Number')}
          {field('currency', 'Currency Symbol')}
        </section>

        {/* QR Generator */}
        <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-primary">QR Code Generator</h2>
          <div>
            <label className="block text-sm text-muted mb-2">Select Table</label>
            <select
              value={qrTable}
              onChange={e => setQrTable(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary text-sm focus:border-accent focus:outline-none"
            >
              {Array.from({ length: 20 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Table {i + 1}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-center">
            <QRCodeDisplay url={qrUrl} tableId={qrTable} size={180} />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted">Scan this QR code to open the ordering page for Table {qrTable}</p>
          </div>
        </section>

        {/* Charges */}
        <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-primary">Charges & Taxes</h2>
          {field('serviceChargePercent', 'Service Charge (%)', 'number')}
          {field('gstPercent', 'GST (%)', 'number')}
        </section>

        {/* Loyalty Settings */}
        <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-primary">Loyalty Program</h2>
          {field('pointsPer100', 'Points per Rs. 100 spent', 'number')}
          {field('rsPerPoints', 'Rs. per 100 points redeemed', 'number')}
          {field('minPointsToRedeem', 'Minimum points to redeem', 'number')}
        </section>

        {/* Kitchen Settings */}
        <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-primary">Kitchen Display</h2>
          {field('kdsWarningMinutes', 'Warning threshold (minutes → amber)', 'number')}
          {field('kdsAlertMinutes', 'Alert threshold (minutes → red)', 'number')}
          {field('kdsAutoBumpMinutes', 'Auto-bump after X minutes', 'number')}
        </section>

        {/* Print all QRs */}
        <section className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-primary mb-3">Print All QR Codes</h2>
          <p className="text-sm text-muted mb-4">Generate a printable page with all 20 table QR codes.</p>
          <Button
            variant="secondary"
            onClick={() => {
              const win = window.open('', '_blank');
              if (!win) return;
              const qrItems = Array.from({ length: 20 }, (_, i) => i + 1)
                .map(t => `<div style="text-align:center;padding:20px;border:1px solid #ccc;border-radius:12px;break-inside:avoid">
                  <p style="font-size:14px;font-weight:600;margin-bottom:8px">Table ${t}</p>
                  <p style="font-size:10px;color:#666;word-break:break-all">${baseUrl}/table/${t}</p>
                </div>`)
                .join('');
              win.document.write(`<html><head><title>All Table QRs</title>
                <style>body{font-family:sans-serif;padding:20px}
                .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
                @media print{@page{size:A4}}</style>
                </head><body>
                <h1 style="text-align:center;margin-bottom:24px">${form.restaurantName} — Table QR Codes</h1>
                <div class="grid">${qrItems}</div>
                <script>window.print()</script></body></html>`);
            }}
          >
            Print All QRs (20 Tables)
          </Button>
        </section>
      </div>
    </div>
  );
}
