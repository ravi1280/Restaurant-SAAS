'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { StaffMember, Shift } from '@/lib/types';
import { calculateShiftDuration, formatShiftDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Clock, Plus, Trash2, Edit } from 'lucide-react';

export default function StaffPage() {
  const { staff, shifts, addStaff, updateStaff, clockIn, clockOut } = useRestaurant();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'manager' | 'waiter' | 'chef' | 'cashier' | 'host'>('waiter');
  const [newPhone, setNewPhone] = useState('');

  const activeShifts = shifts.filter(s => !s.clockOut);
  const pastShifts = shifts.filter(s => s.clockOut).sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary font-heading">Staff & Shifts</h1>
          <p className="text-sm text-muted mt-1">Manage team members and track hours</p>
        </div>
        <Button variant="accent" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-primary mb-4">Team Members</h2>
          <div className="space-y-3">
            {staff.map(member => {
              const activeShift = activeShifts.find(s => s.staffId === member.id);
              return (
                <div key={member.id} className="flex justify-between items-center p-3 bg-elevated rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{member.avatar}</span>
                    <div>
                      <p className="font-medium text-sm text-primary">{member.name}</p>
                      <p className="text-xs text-muted capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeShift ? (
                      <Button variant="danger" size="sm" onClick={() => clockOut(activeShift.id)}>Clock Out</Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => clockIn(member.id)}>Clock In</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <Clock size={16} className="text-info" /> Shift Log
          </h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {activeShifts.length > 0 && <h3 className="text-xs font-semibold text-success uppercase">Currently Active</h3>}
            {activeShifts.map(shift => {
              const member = staff.find(s => s.id === shift.staffId);
              return (
                <div key={shift.id} className="p-3 bg-elevated rounded-xl border border-success/30">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm">{member?.name || 'Unknown'}</p>
                    <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className="text-xs text-muted mt-1">In: {new Date(shift.clockIn).toLocaleTimeString()}</p>
                </div>
              );
            })}
            
            {pastShifts.length > 0 && <h3 className="text-xs font-semibold text-muted uppercase mt-4">Past Shifts</h3>}
            {pastShifts.map(shift => {
              const member = staff.find(s => s.id === shift.staffId);
              const duration = calculateShiftDuration(shift.clockIn, shift.clockOut);
              return (
                <div key={shift.id} className="p-3 bg-elevated rounded-xl border border-border">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm">{member?.name || 'Unknown'}</p>
                    <span className="text-xs font-semibold">{formatShiftDuration(duration)}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {new Date(shift.clockIn).toLocaleDateString()} · {new Date(shift.clockIn).toLocaleTimeString()} - {shift.clockOut ? new Date(shift.clockOut).toLocaleTimeString() : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {showAdd && (
        <Modal isOpen onClose={() => setShowAdd(false)} title="Add Staff Member" maxWidth="sm">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Full Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-elevated border border-border p-2 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as any)}
                className="w-full bg-elevated border border-border p-2 rounded-lg text-sm"
              >
                <option value="manager">Manager</option>
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
                <option value="cashier">Cashier</option>
                <option value="host">Host</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Phone Number</label>
              <input
                type="tel"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="w-full bg-elevated border border-border p-2 rounded-lg text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="accent" onClick={() => {
                if (newName) {
                  addStaff({
                    id: Math.random().toString(36).substring(2),
                    name: newName,
                    role: newRole,
                    phone: newPhone,
                    email: '',
                    pin: '0000',
                    active: true,
                    hireDate: new Date().toISOString(),
                    avatar: '🤵',
                    createdAt: new Date().toISOString()
                  });
                  setShowAdd(false);
                  setNewName('');
                  setNewPhone('');
                }
              }}>Save Staff</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
