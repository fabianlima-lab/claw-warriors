'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { apiFetch, apiPut } from '@/lib/api';

const SOUL_FIELDS = ['nickname', 'role', 'tone', 'aboutHuman', 'alwaysDo', 'neverDo'];

const EMPTY_SOUL = {
  nickname: '',
  role: '',
  tone: '',
  aboutHuman: '',
  alwaysDo: '',
  neverDo: '',
};

export default function SoulPage() {
  const t = useTranslations('Soul');
  const tGlossary = useTranslations('Glossary');
  const [warrior, setWarrior] = useState(null);
  const [warriorName, setWarriorName] = useState('');
  const [soul, setSoul] = useState({ ...EMPTY_SOUL });
  const [originalSoul, setOriginalSoul] = useState({ ...EMPTY_SOUL });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    apiFetch('/warriors/mine')
      .then((data) => {
        const list = Array.isArray(data) ? data : data.warriors || [];
        if (list.length > 0) {
          setWarrior(list[0]);
          loadSoul(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));

    // Check tier
    apiFetch('/dashboard/stats')
      .then((stats) => {
        setIsPro(stats.tier === 'pro' || stats.tier === 'pro_tribe');
      })
      .catch(() => {});
  }, []);

  async function loadSoul(warriorId) {
    try {
      const result = await apiFetch(`/warriors/${warriorId}/soul`);
      const soulData = result.soul || { ...EMPTY_SOUL };
      setSoul(soulData);
      setOriginalSoul(soulData);
      setWarriorName(result.warrior_name || '');
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function updateField(field, value) {
    setSoul((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!warrior) return;
    setSaving(true);
    setError(null);

    try {
      const result = await apiPut(`/warriors/${warrior.id}/soul`, { soul });
      setOriginalSoul(result.soul || soul);
      setEditingField(null);
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

  const hasChanges = JSON.stringify(soul) !== JSON.stringify(originalSoul);
  const filledCount = SOUL_FIELDS.filter((f) => soul[f] && soul[f].trim()).length;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-elevated rounded" />
        <div className="h-8 w-64 bg-elevated rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-[var(--radius-card)]" />
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
            <Tooltip tip={tGlossary('soulForge')}>{t('title')}</Tooltip>
          </h1>
          <p className="text-sm text-txt-muted mt-1">{t('subtitle')}</p>
        </div>
        <span className="text-xs text-txt-dim">{filledCount}/6</span>
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
          {/* 6-field card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SOUL_FIELDS.map((field) => {
              const isEditing = editingField === field;
              const value = soul[field] || '';
              const hasValue = value.trim().length > 0;

              return (
                <Card
                  key={field}
                  className={`p-4 cursor-pointer transition-all hover:border-accent ${
                    isEditing ? 'border-accent ring-1 ring-accent/20' : ''
                  } ${hasValue ? 'border-accent/30' : ''}`}
                  onClick={() => {
                    if (!isEditing) setEditingField(field);
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{t(`${field}Icon`)}</span>
                    <span className="text-sm font-medium text-txt">
                      {t(`${field}Label`)}
                    </span>
                    {hasValue && !isEditing && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-accent shrink-0" />
                    )}
                  </div>

                  {/* Content */}
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={value}
                      onChange={(e) => updateField(field, e.target.value)}
                      placeholder={t(`${field}Placeholder`)}
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                      className="w-full bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm text-txt-body outline-none resize-none focus:border-accent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className={`text-sm min-h-[2.5rem] ${
                      hasValue ? 'text-txt-body' : 'text-txt-dim italic'
                    }`}>
                      {hasValue ? value : t(`${field}Placeholder`)}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Save bar */}
          <div className="flex items-center justify-between pt-2">
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="ml-auto">
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                disabled={!hasChanges}
                className="px-8"
              >
                {t('save')}
              </Button>
            </div>
          </div>
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
