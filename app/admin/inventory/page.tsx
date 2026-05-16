'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { InventoryItem } from '@/lib/types';
import { isLowStock, stockStatusColor } from '@/lib/utils';
import { Search, AlertCircle, Plus, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function InventoryPage() {
  const { inventory, menuItems, orders, addStockMovement, addInventoryItem } = useRestaurant();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState('');

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState<'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'box' | 'bottle'>('kg');
  const [newCost, setNewCost] = useState('');
  const [newMinStock, setNewMinStock] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSupplier, setNewSupplier] = useState('');

  const filtered = inventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Quick COGS Calculation for paid orders
  const paidOrders = orders.filter(o => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((s, o) => s + o.subtotal, 0);
  
  // Estimate COGS based on menu item costPrice
  const totalCOGS = paidOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => {
      const mi = menuItems.find(m => m.id === item.menuItemId);
      return itemSum + (mi?.costPrice || 0) * item.quantity;
    }, 0);
  }, 0);

  const profitMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalCOGS) / totalRevenue) * 100) : 0;

  const handleRestock = () => {
    if (!selectedItem || !restockAmount) return;
    const qty = parseFloat(restockAmount);
    if (isNaN(qty) || qty <= 0) return;

    addStockMovement({
      id: Math.random().toString(36).substring(2),
      inventoryItemId: selectedItem.id,
      type: 'restock',
      quantity: qty,
      reason: 'restock',
      timestamp: new Date().toISOString(),
      staffId: 'admin' // In real app, use logged in user
    });

    setSelectedItem(null);
    setRestockAmount('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary font-heading">Inventory & COGS</h1>
          <p className="text-sm text-muted mt-1">Manage ingredients and track profitability</p>
        </div>
        <Button variant="accent" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-muted">Total Revenue</p>
            <p className="text-2xl font-bold text-primary">Rs. {totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center text-warning">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-muted">Total COGS</p>
            <p className="text-2xl font-bold text-primary">Rs. {totalCOGS.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center text-success">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-muted">Profit Margin</p>
            <p className="text-2xl font-bold text-primary">{profitMargin}%</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-elevated border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-elevated border-b border-border text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Item Name</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Stock Level</th>
                <th className="px-5 py-3 font-medium">Unit Cost</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(item => {
                const low = isLowStock(item.currentStock, item.minStockLevel);
                return (
                  <tr key={item.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-primary">{item.name}</p>
                      <p className="text-xs text-muted">Supplier: {item.supplier}</p>
                    </td>
                    <td className="px-5 py-4 text-muted">{item.category}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${stockStatusColor(item.currentStock, item.minStockLevel)}`}>
                          {item.currentStock} {item.unit}
                        </span>
                        {low && <span title="Low Stock"><AlertCircle size={14} className="text-warning" /></span>}
                      </div>
                      <p className="text-[10px] text-muted">Min: {item.minStockLevel} {item.unit}</p>
                    </td>
                    <td className="px-5 py-4 text-muted">Rs. {item.costPerUnit}</td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="secondary" size="sm" onClick={() => setSelectedItem(item)}>
                        Restock
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <Modal isOpen onClose={() => { setSelectedItem(null); setRestockAmount(''); }} title={`Restock ${selectedItem.name}`} maxWidth="sm">
          <div className="space-y-4">
            <p className="text-sm text-muted">Current Stock: <strong className="text-primary">{selectedItem.currentStock} {selectedItem.unit}</strong></p>
            <div>
              <label className="text-sm font-medium mb-1 block">Amount to Add ({selectedItem.unit})</label>
              <input
                type="number"
                value={restockAmount}
                onChange={e => setRestockAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-elevated border border-border p-2 rounded-lg text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setSelectedItem(null)}>Cancel</Button>
              <Button variant="accent" onClick={handleRestock}>Confirm Restock</Button>
            </div>
          </div>
        </Modal>
      )}

      {showAdd && (
        <Modal isOpen onClose={() => setShowAdd(false)} title="Add Inventory Item" maxWidth="sm">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Item Name</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-elevated border border-border p-2 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Unit</label>
                <select value={newUnit} onChange={e => setNewUnit(e.target.value as any)} className="w-full bg-elevated border border-border p-2 rounded-lg text-sm">
                  {['kg', 'g', 'L', 'ml', 'pcs', 'box', 'bottle'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Cost per Unit (Rs.)</label>
                <input type="number" value={newCost} onChange={e => setNewCost(e.target.value)} className="w-full bg-elevated border border-border p-2 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Min Stock Alert</label>
                <input type="number" value={newMinStock} onChange={e => setNewMinStock(e.target.value)} className="w-full bg-elevated border border-border p-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Category</label>
                <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Meat" className="w-full bg-elevated border border-border p-2 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Supplier</label>
              <input type="text" value={newSupplier} onChange={e => setNewSupplier(e.target.value)} className="w-full bg-elevated border border-border p-2 rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="accent" onClick={() => {
                if (newName && newCost && newCategory) {
                  addInventoryItem({
                    id: Math.random().toString(36).substring(2),
                    name: newName,
                    unit: newUnit,
                    currentStock: 0,
                    minStockLevel: parseInt(newMinStock) || 0,
                    costPerUnit: parseFloat(newCost) || 0,
                    category: newCategory,
                    supplier: newSupplier,
                    lastRestocked: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                  });
                  setShowAdd(false);
                  setNewName('');
                  setNewCost('');
                  setNewMinStock('');
                  setNewCategory('');
                  setNewSupplier('');
                }
              }}>Save Item</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
