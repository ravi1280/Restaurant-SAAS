'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';

export default function CustomerOrderPage() {
  const params = useParams();
  const tableId = params.tableId;
  const [cart, setCart] = useState(0);

  // In a real implementation, you would fetch menu items from the database
  const sampleMenu = [
    { id: 1, name: 'Margherita Pizza', price: 1200, emoji: '🍕' },
    { id: 2, name: 'Cheeseburger', price: 850, emoji: '🍔' },
    { id: 3, name: 'Caesar Salad', price: 650, emoji: '🥗' },
    { id: 4, name: 'Iced Latte', price: 450, emoji: '☕' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Restaurant Name</h1>
          <p className="text-sm text-gray-500">Table {tableId}</p>
        </div>
        <button className="relative p-2 rounded-md hover:bg-gray-100">
          <ShoppingCart className="h-6 w-6" />
          {cart > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {cart}
            </span>
          )}
        </button>
      </header>

      {/* Menu List */}
      <main className="p-4 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Our Menu</h2>
        {sampleMenu.map((item) => (
          <div key={item.id} className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{item.emoji}</div>
                <div>
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">Rs. {item.price}</p>
                </div>
              </div>
              <Button onClick={() => setCart(c => c + 1)} size="sm" variant="accent">Add</Button>
            </div>
          </div>
        ))}
      </main>

      {/* Floating Action Button for Checkout */}
      {cart > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-md">
          <Button variant="accent" className="w-full text-lg h-12">
            View Cart & Pay (Rs. {cart * 1200} approx)
          </Button>
        </div>
      )}
    </div>
  );
}
