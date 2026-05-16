'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { CartItem } from '@/lib/types';

interface CartState {
  items: CartItem[];
  orderNote: string;
  tableId: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { menuItemId: string; quantity: number } }
  | { type: 'SET_NOTE'; payload: string }
  | { type: 'SET_TABLE'; payload: number }
  | { type: 'CLEAR' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        i => i.menuItemId === action.payload.menuItemId &&
          JSON.stringify(i.selectedModifiers) === JSON.stringify(action.payload.selectedModifiers)
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.menuItemId === action.payload.menuItemId &&
              JSON.stringify(i.selectedModifiers) === JSON.stringify(action.payload.selectedModifiers)
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.menuItemId !== action.payload) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map(i =>
          i.menuItemId === action.payload.menuItemId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ).filter(i => i.quantity > 0),
      };
    case 'SET_NOTE':
      return { ...state, orderNote: action.payload };
    case 'SET_TABLE':
      return { ...state, tableId: action.payload };
    case 'CLEAR':
      return { ...state, items: [], orderNote: '' };
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setOrderNote: (note: string) => void;
  setTableId: (id: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    orderNote: '',
    tableId: 0,
  });

  const addItem = useCallback((item: CartItem) => dispatch({ type: 'ADD_ITEM', payload: item }), []);
  const removeItem = useCallback((menuItemId: string) => dispatch({ type: 'REMOVE_ITEM', payload: menuItemId }), []);
  const updateQuantity = useCallback((menuItemId: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QTY', payload: { menuItemId, quantity } }), []);
  const setOrderNote = useCallback((note: string) => dispatch({ type: 'SET_NOTE', payload: note }), []);
  const setTableId = useCallback((id: number) => dispatch({ type: 'SET_TABLE', payload: id }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => {
    const modsTotal = i.selectedModifiers.reduce((ms, m) => ms + m.priceAdjustment, 0);
    return sum + (i.price + modsTotal) * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{
      ...state,
      addItem,
      removeItem,
      updateQuantity,
      setOrderNote,
      setTableId,
      clearCart,
      itemCount,
      subtotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
