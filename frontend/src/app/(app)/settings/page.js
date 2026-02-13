'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { apiFetch, apiPost } from '@/lib/api';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    apiFetch('/dashboard/stats')
      .then((data) => {
        setEmail(data.email || '');
      })
      .catch(() => {});
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    if (newPassword !== confirmPassword) {
      setPasswordErr('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordErr('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await apiPost('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordErr(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const data = await apiPost('/billing/portal', {});
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Stripe portal not configured
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-txt">Settings</h1>

      {/* Account Info */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">Account</h3>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-txt-muted uppercase tracking-wider">Email</span>
            <p className="text-txt">{email}</p>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="New Password"
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
            minLength={8}
            required
          />
          <Input
            label="Confirm New Password"
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordErr && <p className="text-danger text-sm">{passwordErr}</p>}
          {passwordMsg && <p className="text-success text-sm">{passwordMsg}</p>}
          <Button type="submit" loading={loading}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* Subscription */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">Subscription</h3>
        <p className="text-sm text-txt-muted mb-4">
          Manage your subscription, update payment method, or cancel your plan.
        </p>
        <Button variant="ghost" onClick={handleManageSubscription} loading={portalLoading}>
          Manage Subscription
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-danger/30">
        <h3 className="text-sm font-medium text-danger uppercase tracking-wider mb-4">Danger Zone</h3>
        <p className="text-sm text-txt-muted mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Button
          variant="danger"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
              // TODO: Implement account deletion endpoint
              console.log('Account deletion requested');
            }
          }}
        >
          Delete Account
        </Button>
      </Card>
    </div>
  );
}
