'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRestaurant } from '@/context/RestaurantContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { MenuBrowser } from '@/components/customer/MenuBrowser';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { CallWaiterButton } from '@/components/customer/CallWaiterButton';
import { LoyaltyBadge } from '@/components/customer/LoyaltyBadge';
import { ShoppingBag, ArrowLeft, Ban, Utensils } from 'lucide-react';

function TableOrderingInner({ tableId }: { tableId: number }) {
  const { menuItems, menuCategories, settings, getLoyaltyAccount, refreshOrders } = useRestaurant();
  const { itemCount, subtotal } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [phone] = useState<string>('');
  const searchParams = useSearchParams();
  const isWaiter = searchParams.get('waiter') === 'true';

  useEffect(() => {
    // Poll for menu updates so "out of stock" pushes instantly
    const interval = setInterval(() => {
      // In a real app we'd fetch latest menu; here we just rely on local storage
      const event = new Event('storage');
      window.dispatchEvent(event);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loyaltyAcc = phone ? getLoyaltyAccount(phone) : undefined;

  if (isNaN(tableId) || tableId < 1 || tableId > 20) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Ban className="w-12 h-12 text-danger mx-auto mb-4" />
        <h1 className="text-xl font-bold text-primary mb-2">Table Not Found</h1>
        <p className="text-muted text-sm">Please ask your waiter for assistance.</p>
        <p className="text-muted text-sm mt-2">Call: {settings.phone}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ maxWidth: '430px', margin: '0 auto' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                {isWaiter && (
                  <Link href="/waiter" className="p-1 mr-1 bg-elevated rounded-full hover:bg-border transition-colors">
                    <ArrowLeft size={16} />
                  </Link>
                )}
                <Utensils size={18} className="text-accent" />
                <h1 className="font-heading text-lg font-bold text-primary">{settings.restaurantName}</h1>
              </div>
              <p className="text-xs text-muted">Table {tableId} · {settings.tagline}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isWaiter && <CallWaiterButton tableId={tableId} variant="header" />}
              {loyaltyAcc && <LoyaltyBadge points={loyaltyAcc.points} />}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-4 pb-28">
        <MenuBrowser items={menuItems} categories={menuCategories} />
      </div>

      {/* FABs */}
      <div className="fixed bottom-6 left-0 right-0 px-4 flex items-end justify-end pointer-events-none"
        style={{ maxWidth: '430px', margin: '0 auto', left: '50%', transform: 'translateX(-50%)' }}>

        {/* Cart FAB */}
        {itemCount > 0 && (
          <button
            onClick={() => setCartOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-5 py-3.5 bg-accent text-white rounded-full shadow-xl shadow-accent/30 hover:bg-accent/90 active:scale-95 transition-all"
            style={{ animation: 'scaleIn 0.2s ease' }}
          >
            <ShoppingBag size={18} />
            <span className="font-semibold text-sm">{itemCount} items</span>
            <span className="text-sm opacity-80">·</span>
            <span className="font-bold text-sm">
              Rs. {subtotal.toLocaleString()}
            </span>
            {/* Badge */}
            <span
              className="absolute -top-2 -right-1 w-5 h-5 bg-white text-accent rounded-full text-[10px] font-bold flex items-center justify-center shadow"
              style={{ animation: 'bounce-subtle 0.3s ease' }}
            >
              {itemCount}
            </span>
          </button>
        )}
      </div>

      {/* Cart drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        tableId={tableId}
      />
    </div>
  );
}

export default function TablePage() {
  const params = useParams();
  const tableId = parseInt(params.tableId as string);

  return (
    <CartProvider>
      <TableOrderingInner tableId={tableId} />
    </CartProvider>
  );
}
