'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { apiFetch, apiPost, apiPatch, apiPut } from '@/lib/api';

const PULSE_ICONS = {
  morning: '🌅',
  midday: '☀️',
  evening: '🌆',
  night: '🌙',
};

const PULSE_KEYS = ['morning', 'midday', 'evening', 'night'];

export default function PulsePage() {
  const t = useTranslations('Pulse');
  const tGlossary = useTranslations('Glossary');
  const [warrior, setWarrior] = useState(null);
  const [pulses, setPulses] = useState([]);
  const [tier, setTier] = useState('trial');
  const [maxPulses, setMaxPulses] = useState(1);
  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    apiFetch('/warriors/mine')
      .then((data) => {
        const list = Array.isArray(data) ? data : data.warriors || [];
        if (list.length > 0) {
          setWarrior(list[0]);
          loadPulses(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  async function loadPulses(warriorId) {
    try {
      const result = await apiFetch(`/pulse/${warriorId}`);
      setPulses(result.pulses || []);
      setTier(result.tier || 'trial');
      setMaxPulses(result.max_pulses || 1);
      setTimezone(result.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

      // Auto-initialize if empty
      if (!result.pulses || result.pulses.length === 0) {
        try {
          const initResult = await apiPost(`/pulse/${warriorId}/init`);
          setPulses(initResult.pulses || []);
        } catch {
          // May already be initialized
        }
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleToggle(pulse) {
    const newActive = !pulse.isActive;
    try {
      const updated = await apiPatch(`/pulse/${warrior.id}/${pulse.id}`, {
        isActive: newActive,
      });
      setPulses((prev) => prev.map((p) => (p.id === pulse.id ? updated : p)));
    } catch (err) {
      if (err.status === 403) {
        showToast(t('proRequired'));
      }
    }
  }

  async function handleSavePrompt(pulseId) {
    try {
      const updated = await apiPatch(`/pulse/${warrior.id}/${pulseId}`, {
        prompt: editPrompt,
      });
      setPulses((prev) => prev.map((p) => (p.id === pulseId ? updated : p)));
      setEditingId(null);
      setEditPrompt('');
    } catch {
      // ignore
    }
  }

  async function handleTestFire(pulseId) {
    try {
      await apiPost(`/pulse/${warrior.id}/${pulseId}/trigger`);
      showToast(t('testSent'));
    } catch {
      // ignore
    }
  }

  async function handleTimezone(e) {
    const tz = e.target.value;
    setTimezone(tz);
    try {
      await apiPut('/pulse/timezone', { timezone: tz });
      showToast(t('timezoneUpdated'));
    } catch {
      // ignore
    }
  }

  function getPulseTimeLabel(type) {
    const key = `${type}Time`;
    return t(key);
  }

  function getPulseLabel(type) {
    return t(type);
  }

  // Sort pulses by their type order
  const sortedPulses = [...pulses].sort(
    (a, b) => PULSE_KEYS.indexOf(a.type) - PULSE_KEYS.indexOf(b.type)
  );

  const activeCount = pulses.filter((p) => p.isActive).length;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-elevated rounded" />
        <div className="h-8 w-64 bg-elevated rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-[var(--radius-card)]" />
        ))}
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
            <Tooltip tip={tGlossary('pulseCheck')}>{t('title')}</Tooltip>
          </h1>
          <p className="text-sm text-txt-muted mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* Timezone */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-txt-body">{t('timezone')}</span>
          <select
            value={timezone}
            onChange={handleTimezone}
            className="bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-1.5 text-sm text-txt-body outline-none cursor-pointer"
          >
            {[
              'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
              'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
              'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
            ].map((tz) => (
              <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Pulse cards */}
      <div className="space-y-4">
        {sortedPulses.map((pulse, index) => {
          const isLocked = !pulse.isActive && activeCount >= maxPulses && tier === 'trial';
          const isEditing = editingId === pulse.id;

          return (
            <Card key={pulse.id} className="p-5">
              <div className="flex items-start gap-4">
                {/* Icon + time */}
                <div className="text-center shrink-0">
                  <span className="text-2xl">{PULSE_ICONS[pulse.type]}</span>
                  <p className="text-xs text-txt-dim mt-1">{getPulseTimeLabel(pulse.type)}</p>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-txt">
                      {getPulseLabel(pulse.type)}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      pulse.isActive
                        ? 'bg-success/10 text-success'
                        : 'bg-border text-txt-dim'
                    }`}>
                      {pulse.isActive ? t('active') : t('inactive')}
                    </span>
                  </div>

                  {/* Prompt (editable) */}
                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value.slice(0, 1000))}
                        rows={3}
                        className="w-full bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm text-txt-body outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          className="text-xs px-3 py-1.5"
                          onClick={() => handleSavePrompt(pulse.id)}
                        >
                          {t('savePrompt')}
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs px-3 py-1.5"
                          onClick={() => { setEditingId(null); setEditPrompt(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-txt-muted mt-1 line-clamp-2">{pulse.prompt}</p>
                  )}

                  {/* Last run */}
                  <p className="text-xs text-txt-dim mt-2">
                    {t('lastRun')} {pulse.lastRunAt || pulse.last_run_at
                      ? new Date(pulse.lastRunAt || pulse.last_run_at).toLocaleString()
                      : t('never')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(pulse)}
                    disabled={isLocked}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      pulse.isActive ? 'bg-accent' : 'bg-border'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      pulse.isActive ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>

                  {/* Edit / Test buttons */}
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => { setEditingId(pulse.id); setEditPrompt(pulse.prompt); }}
                        className="text-xs text-accent hover:underline cursor-pointer"
                      >
                        {t('editPrompt')}
                      </button>
                      {pulse.isActive && (
                        <button
                          onClick={() => handleTestFire(pulse.id)}
                          className="text-xs text-txt-muted hover:text-accent cursor-pointer"
                        >
                          {t('testNow')}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Locked overlay */}
              {isLocked && (
                <p className="text-xs text-txt-dim mt-2">{t('locked')}</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-[var(--radius-btn)] text-sm text-txt shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
