'use client';

import React, { useState, useEffect } from 'react';
import { MenuItem, ModifierGroup, ModifierOption, DietaryFlag, Station } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { generateId, getDirectImageUrl } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FOOD_EMOJIS } from '@/lib/constants';
import { Plus, Trash2, Leaf, Flame, AlertTriangle, Wheat, Star } from 'lucide-react';

interface MenuItemFormProps {
  item?: MenuItem | null;
  onClose: () => void;
}

const DIETARY_OPTIONS = [
  { key: 'vegan' as DietaryFlag, label: 'Vegan', icon: Leaf },
  { key: 'spicy' as DietaryFlag, label: 'Spicy', icon: Flame },
  { key: 'nuts' as DietaryFlag, label: 'Contains Nuts', icon: AlertTriangle },
  { key: 'glutenFree' as DietaryFlag, label: 'Gluten Free', icon: Wheat },
  { key: 'chefSpecial' as DietaryFlag, label: "Chef's Special", icon: Star },
];

export function MenuItemForm({ item, onClose }: MenuItemFormProps) {
  const { addMenuItem, updateMenuItem, menuCategories } = useRestaurant();
  const { showToast } = useToast();

  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [emoji, setEmoji] = useState(item?.emoji || '🍕');
  const [categoryId, setCategoryId] = useState(item?.categoryId || menuCategories[0]?.id || '');
  const [station, setStation] = useState<Station>(item?.station || 'hot');
  const [available, setAvailable] = useState(item?.available ?? true);
  const [dietaryFlags, setDietaryFlags] = useState<DietaryFlag[]>(item?.dietaryFlags || []);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(item?.modifierGroups || []);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [modelUrl, setModelUrl] = useState(item?.modelUrl || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');

  const toggleDietary = (flag: DietaryFlag) => {
    setDietaryFlags(prev =>
      prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
    );
  };

  const addModifierGroup = () => {
    setModifierGroups(prev => [...prev, {
      id: generateId(),
      name: 'New Group',
      required: false,
      options: [],
    }]);
  };

  const updateGroup = (groupId: string, updates: Partial<ModifierGroup>) => {
    setModifierGroups(prev =>
      prev.map(g => g.id === groupId ? { ...g, ...updates } : g)
    );
  };

  const removeGroup = (groupId: string) => {
    setModifierGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const addOption = (groupId: string) => {
    setModifierGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, options: [...g.options, { id: generateId(), name: 'Option', priceAdjustment: 0 }] }
          : g
      )
    );
  };

  const updateOption = (groupId: string, optionId: string, updates: Partial<ModifierOption>) => {
    setModifierGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? {
            ...g,
            options: g.options.map(o => o.id === optionId ? { ...o, ...updates } : o),
          }
          : g
      )
    );
  };

  const removeOption = (groupId: string, optionId: string) => {
    setModifierGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, options: g.options.filter(o => o.id !== optionId) }
          : g
      )
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) errs.price = 'Valid price required';
    if (!categoryId) errs.category = 'Category is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const menuItem: MenuItem = {
        id: item?.id || generateId(),
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        emoji,
        categoryId,
        station,
        available,
        dietaryFlags,
        modifierGroups,
        soldCount: item?.soldCount || 0,
        costPrice: item?.costPrice || 0,
        linkedInventoryIds: item?.linkedInventoryIds || [],
        upsellItemIds: item?.upsellItemIds || [],
        createdAt: item?.createdAt || new Date().toISOString(),
        modelUrl: modelUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      };
      if (item) {
        updateMenuItem(menuItem);
        showToast(`${menuItem.name} updated`, 'success');
      } else {
        addMenuItem(menuItem);
        showToast(`${menuItem.name} added to menu`, 'success');
      }
      setSaving(false);
      onClose();
    }, 300);
  };

  return (
    <Modal isOpen onClose={onClose} title={item ? 'Edit Menu Item' : 'Add Menu Item'} maxWidth="lg">
      <div className="p-5 space-y-5">
        {/* Emoji picker */}
        <div>
          <p className="text-sm font-semibold text-primary mb-2">Food Emoji</p>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-5xl hover:scale-110 transition-transform"
          >
            {emoji}
          </button>
          {showEmojiPicker && (
            <div className="mt-2 p-3 bg-elevated rounded-xl border border-border grid grid-cols-10 gap-1">
              {FOOD_EMOJIS.map((e, idx) => (
                <button
                  key={`${e}-${idx}`}
                  onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                  className={`text-xl p-1 rounded-lg hover:bg-accent/10 transition-all ${emoji === e ? 'bg-accent/20' : ''}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-muted mb-1">Item Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
              placeholder="e.g. Grilled Sea Bass"
            />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Price (Rs.) *</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
              placeholder="1200"
            />
            {errors.price && <p className="text-xs text-danger mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
            >
              {menuCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm resize-none"
              placeholder="Brief description of the dish..."
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-muted mb-1">Image URL (Google Drive / Imgur / Web Link)</label>
            <div className="flex gap-3 items-center">
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
                placeholder="e.g. https://drive.google.com/... or https://i.imgur.com/..."
              />
              {imageUrl && (
                <div className="w-10 h-10 border border-border rounded-xl overflow-hidden bg-background shrink-0">
                  <img
                    src={getDirectImageUrl(imageUrl)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-149514740007a-18a1833f4a7c?q=80&w=120&auto=format&fit=crop';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted mt-1">Paste a direct image link or shareable Google Drive / Imgur link. Emojis will be used as a backup.</p>
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-muted mb-1">3D Model Path (GLB)</label>
            <input
              value={modelUrl}
              onChange={e => setModelUrl(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
              placeholder="e.g. /models/burger.glb"
            />
            <p className="text-[10px] text-muted mt-1">Leave empty if this dish does not have an AR model. Store GLB files in <code>/public/models/</code>.</p>
          </div>
        </div>

        {/* Station */}
        <div>
          <label className="block text-sm text-muted mb-2">Kitchen Station</label>
          <div className="flex gap-2">
            {(['hot', 'cold', 'bar'] as Station[]).map(s => (
              <button
                key={s}
                onClick={() => setStation(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
                  ${station === s ? 'bg-accent/20 border-accent text-accent' : 'bg-elevated border-border text-muted hover:text-primary'}`}
              >
                {s === 'hot' ? 'Hot Kitchen' : s === 'cold' ? 'Cold Kitchen' : 'Bar Station'}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary flags */}
        <div>
          <label className="block text-sm text-muted mb-2">Dietary Tags</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(opt => {
              const IconComponent = opt.icon;
              const isSelected = dietaryFlags.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleDietary(opt.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${isSelected
                      ? 'bg-accent/20 border-accent text-accent'
                      : 'bg-elevated border-border text-muted hover:text-primary'
                    }`}
                >
                  <IconComponent size={12} className={isSelected ? 'text-accent' : 'text-hint'} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted">Available on menu</label>
          <button
            onClick={() => setAvailable(!available)}
            className={`w-12 h-6 rounded-full transition-all relative ${available ? 'bg-success' : 'bg-elevated border border-border'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${available ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Modifier groups */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-primary">Modifier Groups</label>
            <button
              onClick={addModifierGroup}
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Plus size={12} />
              Add Group
            </button>
          </div>
          <div className="space-y-3">
            {modifierGroups.map(group => (
              <div key={group.id} className="p-3 bg-elevated rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={group.name}
                    onChange={e => updateGroup(group.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 bg-background border border-border rounded-lg text-sm text-primary focus:border-accent focus:outline-none"
                  />
                  <label className="flex items-center gap-1 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={group.required}
                      onChange={e => updateGroup(group.id, { required: e.target.checked })}
                      className="accent-accent"
                    />
                    Required
                  </label>
                  <button onClick={() => removeGroup(group.id)} className="text-danger text-xs hover:underline">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {group.options.map(opt => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        value={opt.name}
                        onChange={e => updateOption(group.id, opt.id, { name: e.target.value })}
                        className="flex-1 px-2 py-1 bg-background border border-border rounded-lg text-xs text-primary focus:border-accent focus:outline-none"
                        placeholder="Option name"
                      />
                      <input
                        type="number"
                        value={opt.priceAdjustment}
                        onChange={e => updateOption(group.id, opt.id, { priceAdjustment: parseFloat(e.target.value) || 0 })}
                        className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-xs text-primary focus:border-accent focus:outline-none"
                        placeholder="+0"
                      />
                      <button
                        onClick={() => removeOption(group.id, opt.id)}
                        className="text-danger/60 hover:text-danger"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(group.id)}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <Plus size={10} />
                    Add Option
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="accent" loading={saving} onClick={handleSave} className="flex-1">
            {item ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
