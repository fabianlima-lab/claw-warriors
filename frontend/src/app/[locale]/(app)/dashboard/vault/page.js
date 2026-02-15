'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { apiFetch, apiPost, apiPatch, apiDelete } from '@/lib/api';

export default function VaultPage() {
  const t = useTranslations('Vault');
  const tGlossary = useTranslations('Glossary');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [maxEntries, setMaxEntries] = useState(0);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  // Form state
  const [label, setLabel] = useState('');
  const [type, setType] = useState('api_key');
  const [value, setValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVault();
    apiFetch('/dashboard/stats')
      .then((stats) => {
        const tier = stats.tier;
        setIsPro(tier === 'pro' || tier === 'pro_tribe');
        setMaxEntries(tier === 'pro_tribe' ? 10 : tier === 'pro' ? 5 : 0);
      })
      .catch(() => {});
  }, []);

  async function loadVault() {
    try {
      const data = await apiFetch('/vault');
      setEntries(data.entries || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const entry = await apiPost('/vault', {
        label: label.trim(),
        type,
        value,
        expires_at: expiresAt || null,
      });
      setEntries((prev) => [entry, ...prev]);
      setShowForm(false);
      setLabel('');
      setType('api_key');
      setValue('');
      setExpiresAt('');
      showToast(t('saved'));
    } catch (err) {
      if (err.status === 403) {
        setError(t('proRequired'));
      } else {
        setError(t('saveFailed'));
      }
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await apiDelete(`/vault/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast(t('deleted'));
    } catch {
      // ignore
    }
  }

  const atLimit = entries.length >= maxEntries;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-elevated rounded" />
        <div className="h-8 w-64 bg-elevated rounded" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      {/* Back link */}
      <Link href="/dashboard" className="text-sm text-accent hover:underline">
        {t('back')}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-txt">
            <Tooltip tip={tGlossary('vault')}>{t('title')}</Tooltip>
          </h1>
          <p className="text-sm text-txt-muted mt-1">{t('subtitle')}</p>
        </div>
        {isPro && !showForm && !atLimit && (
          <Button
            variant="primary"
            className="text-sm"
            onClick={() => setShowForm(true)}
          >
            {t('addKey')}
          </Button>
        )}
      </div>

      {/* Pro gating */}
      {!isPro ? (
        <Card className="p-8 text-center space-y-4">
          <p className="text-txt-muted">{t('upgradePrompt')}</p>
          <Link href="/upgrade">
            <Button variant="primary">{t('upgrade')}</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Encryption note */}
          <div className="flex items-start gap-2 text-xs text-txt-dim bg-elevated/50 rounded-[var(--radius-btn)] px-3 py-2">
            <span className="mt-0.5">🔐</span>
            <span>{t('encryptionNote')}</span>
          </div>

          {/* Add form */}
          {showForm && (
            <Card className="p-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs text-txt-dim uppercase tracking-wider">{t('label')}</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={t('labelPlaceholder')}
                    maxLength={100}
                    required
                    className="w-full mt-1 bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm text-txt-body outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs text-txt-dim uppercase tracking-wider">{t('type')}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full mt-1 bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm text-txt-body outline-none cursor-pointer"
                  >
                    <option value="api_key">{t('apiKey')}</option>
                    <option value="oauth_token">{t('oauthToken')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-txt-dim uppercase tracking-wider">{t('value')}</label>
                  <input
                    type="password"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={t('valuePlaceholder')}
                    required
                    minLength={4}
                    maxLength={2000}
                    className="w-full mt-1 bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm text-txt-body outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-txt-dim uppercase tracking-wider">{t('expiresAt')}</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full mt-1 bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm text-txt-body outline-none"
                  />
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                <div className="flex gap-3">
                  <Button type="submit" variant="primary" loading={saving} className="flex-1">
                    {t('save')}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Limit warning */}
          {atLimit && (
            <p className="text-sm text-txt-dim">{t('limit', { count: entries.length, max: maxEntries })}</p>
          )}

          {/* Entries list */}
          {entries.length > 0 ? (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-txt">{entry.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-elevated text-txt-dim">
                          {entry.type === 'api_key' ? t('apiKey') : t('oauthToken')}
                        </span>
                        {entry.is_expired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-danger/20 text-danger">
                            {t('expired')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-txt-dim">
                        <span className="font-mono">{entry.masked_preview}</span>
                        <span>
                          {t('lastUsed')} {entry.last_used_at
                            ? new Date(entry.last_used_at).toLocaleDateString()
                            : t('never')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-danger hover:text-danger/80 cursor-pointer px-2 py-1"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : !showForm && (
            <Card className="p-8 text-center">
              <p className="text-txt-muted">{t('empty')}</p>
              <p className="text-xs text-txt-dim mt-2">{t('emptyHint')}</p>
            </Card>
          )}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-[var(--radius-btn)] text-sm text-txt shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
