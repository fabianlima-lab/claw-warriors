'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { apiFetch, apiPost, apiPatch, apiDelete } from '@/lib/api';

export default function RhythmsPage() {
  const tGlossary = useTranslations('Glossary');
  const t = useTranslations('Rhythms');
  const [warrior, setWarrior] = useState(null);
  const [rhythms, setRhythms] = useState([]);
  const [tier, setTier] = useState('trial');
  const [maxRhythms, setMaxRhythms] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSchedule, setFormSchedule] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [parsedSchedule, setParsedSchedule] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [addingSuggestion, setAddingSuggestion] = useState(null);

  useEffect(() => {
    apiFetch('/warriors/mine')
      .then((data) => {
        const list = Array.isArray(data) ? data : data.warriors || [];
        if (list.length > 0) {
          setWarrior(list[0]);
          loadRhythms(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  async function loadRhythms(warriorId) {
    try {
      const result = await apiFetch(`/rhythms/${warriorId}`);
      setRhythms(result.rhythms || []);
      setTier(result.tier || 'trial');
      setMaxRhythms(result.max_rhythms || 0);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleParseSchedule() {
    if (!formSchedule.trim() || !warrior) return;
    setParsing(true);
    setParsedSchedule(null);

    try {
      const result = await apiPost(`/rhythms/${warrior.id}/parse-schedule`, {
        schedule: formSchedule,
      });
      if (result.success) {
        setParsedSchedule({ cronExpr: result.cronExpr, humanReadable: result.humanReadable });
      } else {
        setParsedSchedule({ error: true });
      }
    } catch {
      setParsedSchedule({ error: true });
    }
    setParsing(false);
  }

  async function handleCreate() {
    if (!formName.trim() || !formPrompt.trim() || !warrior) return;
    setCreating(true);

    try {
      const body = {
        name: formName,
        taskPrompt: formPrompt,
      };

      if (parsedSchedule?.cronExpr) {
        body.cronExpr = parsedSchedule.cronExpr;
      } else {
        body.naturalLanguage = formSchedule;
      }

      const result = await apiPost(`/rhythms/${warrior.id}`, body);
      setRhythms((prev) => [{ ...result }, ...prev]);
      setShowForm(false);
      resetForm();
      showToast(t('created'));
    } catch (err) {
      if (err.status === 403) {
        showToast(t('proRequired'));
      } else {
        showToast(t('createFailed'));
      }
    }
    setCreating(false);
  }

  async function handleToggle(rhythm) {
    try {
      const updated = await apiPatch(`/rhythms/${warrior.id}/${rhythm.id}`, {
        isActive: !rhythm.isActive,
      });
      setRhythms((prev) => prev.map((r) => (r.id === rhythm.id ? { ...updated, scheduleText: updated.scheduleText || rhythm.scheduleText } : r)));
    } catch {
      // ignore
    }
  }

  async function handleDelete(rhythmId) {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await apiDelete(`/rhythms/${warrior.id}/${rhythmId}`);
      setRhythms((prev) => prev.filter((r) => r.id !== rhythmId));
      showToast(t('deleted'));
    } catch {
      // ignore
    }
  }

  async function handleRunNow(rhythmId) {
    try {
      await apiPost(`/rhythms/${warrior.id}/${rhythmId}/trigger`);
      showToast(t('runSent'));
    } catch {
      // ignore
    }
  }

  async function loadSuggestions() {
    if (!warrior) return;
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const result = await apiFetch(`/rhythms/${warrior.id}/suggestions`);
      setSuggestions(result.suggestions || []);
    } catch {
      setSuggestions([]);
    }
    setLoadingSuggestions(false);
  }

  async function handleAddSuggestion(suggestion) {
    if (!warrior) return;
    setAddingSuggestion(suggestion.id);
    try {
      const result = await apiPost(`/rhythms/${warrior.id}`, {
        name: suggestion.name,
        taskPrompt: suggestion.taskPrompt,
        cronExpr: suggestion.cronExpr,
      });
      setRhythms((prev) => [{ ...result }, ...prev]);
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      showToast(t('suggestionAdded'));
    } catch (err) {
      if (err.status === 403) {
        showToast(t('proRequired'));
      } else {
        showToast(t('createFailed'));
      }
    }
    setAddingSuggestion(null);
  }

  function resetForm() {
    setFormName('');
    setFormSchedule('');
    setFormPrompt('');
    setParsedSchedule(null);
  }

  const isPro = tier === 'pro' || tier === 'pro_tribe';
  const atLimit = rhythms.length >= maxRhythms;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-elevated rounded" />
        <div className="h-8 w-64 bg-elevated rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-card border border-border rounded-[var(--radius-card)]" />
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
            <Tooltip tip={tGlossary('standingOrders')}>{t('title')}</Tooltip>
          </h1>
          <p className="text-sm text-txt-muted mt-1">{t('subtitle')}</p>
        </div>
        {isPro && !showForm && !atLimit && (
          <Button
            variant="primary"
            className="text-sm"
            onClick={() => setShowForm(true)}
          >
            {t('addRhythm')}
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
          {/* Limit warning */}
          {atLimit && (
            <p className="text-sm text-txt-dim">
              {t('limit', { count: rhythms.length, max: maxRhythms })}
            </p>
          )}

          {/* Create form */}
          {showForm && (
            <Card className="p-6 space-y-4">
              <div>
                <label className="text-xs text-txt-muted uppercase tracking-wider">{t('name')}</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value.slice(0, 200))}
                  placeholder={t('namePlaceholder')}
                  className="w-full bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm text-txt-body outline-none mt-1 focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-txt-muted uppercase tracking-wider">{t('schedule')}</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={formSchedule}
                    onChange={(e) => { setFormSchedule(e.target.value); setParsedSchedule(null); }}
                    placeholder={t('schedulePlaceholder')}
                    onBlur={handleParseSchedule}
                    className="flex-1 bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm text-txt-body outline-none focus:border-accent"
                  />
                </div>
                {parsing && (
                  <p className="text-xs text-txt-dim mt-1">{t('parsing')}</p>
                )}
                {parsedSchedule && !parsedSchedule.error && (
                  <p className="text-xs text-success mt-1">
                    {t('parsedAs', { schedule: parsedSchedule.humanReadable })}
                  </p>
                )}
                {parsedSchedule?.error && (
                  <p className="text-xs text-danger mt-1">{t('parseFailed')}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-txt-muted uppercase tracking-wider">{t('taskPrompt')}</label>
                <textarea
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value.slice(0, 2000))}
                  placeholder={t('taskPromptPlaceholder')}
                  rows={4}
                  className="w-full bg-bg border border-border rounded-[var(--radius-btn)] px-3 py-2 text-sm text-txt-body outline-none resize-none mt-1 focus:border-accent"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleCreate}
                  loading={creating}
                  disabled={!formName.trim() || !formPrompt.trim() || !formSchedule.trim()}
                >
                  {t('create')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowForm(false); resetForm(); }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Rhythm list */}
          {rhythms.length === 0 && !showForm ? (
            <Card className="p-8 text-center">
              <p className="text-txt-muted">{t('empty')}</p>
              <p className="text-sm text-txt-dim mt-2">{t('emptyHint')}</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {rhythms.map((rhythm) => (
                <Card key={rhythm.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-medium text-txt">{rhythm.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          rhythm.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-border text-txt-dim'
                        }`}>
                          {rhythm.isActive ? t('active') : t('inactive')}
                        </span>
                      </div>

                      <p className="text-xs text-accent mt-1">
                        {rhythm.scheduleText || rhythm.cronExpr || rhythm.cron_expr}
                      </p>

                      <p className="text-xs text-txt-muted mt-1 line-clamp-2">
                        {rhythm.taskPrompt || rhythm.task_prompt}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-txt-dim">
                        <span>
                          {t('lastRun')} {rhythm.lastRunAt || rhythm.last_run_at
                            ? new Date(rhythm.lastRunAt || rhythm.last_run_at).toLocaleString()
                            : t('never')}
                        </span>
                        <span>
                          {t('nextRun')} {rhythm.nextRunAt || rhythm.next_run_at
                            ? new Date(rhythm.nextRunAt || rhythm.next_run_at).toLocaleString()
                            : t('never')}
                        </span>
                      </div>

                      {/* Last result */}
                      {(rhythm.lastResult || rhythm.last_result) && (
                        <details className="mt-2">
                          <summary className="text-xs text-txt-dim cursor-pointer">
                            {t('lastResult')}
                          </summary>
                          <p className="text-xs text-txt-muted mt-1 whitespace-pre-wrap">
                            {rhythm.lastResult || rhythm.last_result}
                          </p>
                        </details>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0 ml-4">
                      <button
                        onClick={() => handleToggle(rhythm)}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                          rhythm.isActive ? 'bg-accent' : 'bg-border'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          rhythm.isActive ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>

                      {rhythm.isActive && (
                        <button
                          onClick={() => handleRunNow(rhythm.id)}
                          className="text-xs text-accent hover:underline cursor-pointer"
                        >
                          {t('runNow')}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(rhythm.id)}
                        className="text-xs text-danger hover:underline cursor-pointer"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {/* ── Suggestions Section ── */}
          {!atLimit && (
            <div className="pt-4 border-t border-border">
              {!showSuggestions ? (
                <button
                  onClick={loadSuggestions}
                  className="text-sm text-accent hover:underline cursor-pointer"
                >
                  {t('showSuggestions')}
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-txt">{t('suggestions')}</h3>
                      <p className="text-xs text-txt-dim">{t('suggestionsHint')}</p>
                    </div>
                    <button
                      onClick={() => setShowSuggestions(false)}
                      className="text-xs text-txt-dim hover:text-txt cursor-pointer"
                    >
                      {t('hideSuggestions')}
                    </button>
                  </div>

                  {loadingSuggestions ? (
                    <div className="space-y-3">
                      <p className="text-xs text-txt-dim animate-pulse">{t('loadingSuggestions')}</p>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-card border border-border rounded-[var(--radius-card)] animate-pulse" />
                      ))}
                    </div>
                  ) : suggestions.length === 0 ? (
                    <p className="text-sm text-txt-dim">{t('noSuggestions')}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="p-4 border-dashed hover:border-accent transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-lg shrink-0">{suggestion.icon || '⚡'}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-txt">{suggestion.name}</h4>
                              <p className="text-xs text-accent mt-0.5">{suggestion.schedule}</p>
                              <p className="text-xs text-txt-muted mt-1 line-clamp-2">{suggestion.taskPrompt}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => handleAddSuggestion(suggestion)}
                                  disabled={addingSuggestion === suggestion.id}
                                  className="text-xs px-3 py-1 bg-accent text-white rounded-[var(--radius-btn)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                                >
                                  {addingSuggestion === suggestion.id ? '...' : t('addSuggestion')}
                                </button>
                                <span className="text-[10px] text-txt-dim">
                                  {suggestion.source === 'personalized' ? t('suggestionsPersonalized') : t('suggestionsTemplate')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
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
