'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { useRestaurant } from '@/context/RestaurantContext';

export default function CRMPage() {
  const { loyalty } = useRestaurant();
  const [promoMessage, setPromoMessage] = useState('Happy Birthday! Visit us this week for a free dessert.');
  const [campaignName, setCampaignName] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  
  // Dynamically calculate Top 3 VIP Spenders
  const vipCustomers = useMemo(() => {
    return [...loyalty]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 3);
  }, [loyalty]);

  const handleSendOffers = () => {
    alert(`Offer sent successfully!\nMessage: ${promoMessage}`);
    // Real implementation would call API route to trigger Twilio/SendGrid here
  };

  const handleLaunchCampaign = () => {
    if (!campaignName || !campaignMessage) {
      alert('Please fill in Campaign Name and Message Content.');
      return;
    }
    alert(`Campaign "${campaignName}" launched!\nSending messages to all ${loyalty.length} members.\nCode: ${discountCode || 'N/A'}`);
  };

  const handleVIPOffer = () => {
    alert(`Sending VIP Exclusive Offer to ${vipCustomers.length} Top Spenders...`);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Customer CRM & Marketing</h1>
        <p className="text-muted mt-2">Manage {loyalty.length} customer relationships and send automated offers.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Birthday & Anniversary Offers Card */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 pb-4 border-b border-border">
            <h3 className="font-semibold text-lg text-primary">Birthday & Anniversary Offers</h3>
            <p className="text-sm text-muted">Send automated SMS/Email offers to loyalty members.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Offer Message Template
              </label>
              <input 
                className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                value={promoMessage}
                onChange={(e) => setPromoMessage(e.target.value)}
              />
            </div>
            <div className="text-sm text-primary bg-elevated p-3 rounded-md border border-border">
              <p className="font-medium mb-1">Active Triggers:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-muted">
                <li>Birthdays (7 days before)</li>
                <li>Anniversaries (3 days before)</li>
              </ul>
            </div>
            <Button onClick={handleSendOffers} className="w-full">
              Send Upcoming Offers Now
            </Button>
          </div>
        </div>

        {/* VIP Customers Card */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 pb-4 border-b border-border">
            <h3 className="font-semibold text-lg text-primary">VIP Customers (Top Spenders)</h3>
            <p className="text-sm text-muted">Reward your most valuable and loyal customers.</p>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col">
            <div className="space-y-3">
              {vipCustomers.length > 0 ? vipCustomers.map((vip, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-md hover:bg-elevated transition-colors border border-transparent hover:border-border">
                  <div>
                    <p className="text-sm font-medium text-primary">{vip.name}</p>
                    <p className="text-xs text-muted">{vip.totalOrders} visits</p>
                  </div>
                  <p className="text-sm font-semibold text-accent">Rs. {vip.totalSpent.toFixed(2)}</p>
                </div>
              )) : (
                <p className="text-sm text-muted">No customer data available yet.</p>
              )}
            </div>
            <div className="mt-auto pt-4">
              <Button variant="secondary" onClick={handleVIPOffer} className="w-full" disabled={vipCustomers.length === 0}>
                Send VIP Exclusive Offer
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk SMS/Email Campaign Card */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden md:col-span-2">
          <div className="p-6 pb-4 border-b border-border">
            <h3 className="font-semibold text-lg text-primary">Bulk Promotions Campaign</h3>
            <p className="text-sm text-muted">Send weekend specials or festival offers to all {loyalty.length} loyalty members.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-primary">Campaign Name</label>
                <input 
                  className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. Weekend Seafood Special"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-primary">Discount Code (Optional)</label>
                <input 
                  className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. WEEKEND20"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-primary">Message Content</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Get 20% off all seafood dishes this weekend! Show this message to claim."
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleLaunchCampaign}>
                Launch Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
