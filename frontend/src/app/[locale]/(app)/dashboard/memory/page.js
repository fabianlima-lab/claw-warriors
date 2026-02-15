'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { apiFetch, apiDelete } from '@/lib/api';

const CATEGORY_ICONS = {
  preference: '💜',
  fact: '📌',
  instruction: '⚡',
  summary: '📝',
};

export default function MemoryPage() {
  const t = useTranslations('Memory');
  const tGlossary = useTranslations('Glossary');
  const [warrior, setWarrior] = useState(null);
  const [memories, setMemories] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/warriors/mine')
      .then((data) => {
        const list = Array.isArray(data) ? data : data.warriors || [];
        if (list.length > 0) {
          setWarrior(list[0]);
          loadMemories(list[0].id, null);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  async function loadMemories(warriorId, category) {
    setLoading(true);
    try {
      const query = category ? `?category=${category}` : '';
      const result = await apiFetch(`/memory/${warriorId}${query}`);
      setMemories(result.memories || []);
      setTotal(result.total || 0);
    } catch {
      setMemories([]);
    }
    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDelete(memoryId) {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await apiDelete(`/memory/${warrior.id}/${memoryId}`);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      setTotal((prev) => prev - 1);
      showToast(t('deleted'));
    } catch {
      // ignore
    }
  }

  async function handleClearAll() {
    try {
      await apiDelete(`/memory/${warrior.id}`);
      setMemories([]);
      setTotal(0);
      setShowClearConfirm(false);
      showToast(t('cleared'));
    } catch {
      // ignore
    }
  }

  function handleFilterChange(cat) {
    setFilter(cat);
    if (warrior) loadMemories(warrior.id, cat);
  }

  const categories = [
    { key: null, label: t('all') },
    { key: 'preference', label: t('preference') },
    { key: 'fact', label: t('fact') },
    { key: 'instruction', label: t('instruction') },
    { key: 'summary', label: t('summary') },
  ];

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
            <Tooltip tip={tGlossary('deepMemory')}>{t('title')}</Tooltip>
          </h1>
          <p className="text-sm text-txt-muted mt-1">{t('subtitle')}</p>
        </div>
        {total > 0 && (
          <span className="text-xs text-txt-dim">
            {t('count', { count: total })}
          </span>
        )}
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.key || 'all'}
            onClick={() => handleFilterChange(cat.key)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer ${
              filter === cat.key
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border text-txt-muted hover:border-txt-dim'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Memory list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-card border border-border rounded-[var(--radius-card)] animate-pulse" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-txt-muted">{t('empty')}</p>
          <p className="text-sm text-txt-dim mt-2">{t('emptyHint')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => (
            <Card key={memory.id} className="p-4 group">
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">
                  {CATEGORY_ICONS[memory.category] || '📝'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-txt-body">{memory.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-txt-dim capitalize">
                      {memory.category}
                    </span>
                    <span className="text-xs text-txt-dim">
                      {new Date(memory.createdAt || memory.created_at).toLocaleDateString()}
                    </span>
                    {memory.source && memory.source !== 'extracted' && (
                      <span className="text-xs text-accent">{memory.source}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(memory.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-danger hover:text-danger/80 cursor-pointer px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Clear all */}
      {memories.length > 0 && (
        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="text-xs text-danger border-danger/30 hover:bg-danger/10"
            onClick={() => setShowClearConfirm(true)}
          >
            {t('clearAll')}
          </Button>
        </div>
      )}

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
          <Card className="p-8 max-w-md mx-4">
            <h3 className="font-[family-name:var(--font-display)] text-lg text-txt">
              {t('clearAll')}
            </h3>
            <p className="text-sm text-txt-muted mt-3">{t('clearConfirm')}</p>
            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleClearAll}
                className="flex-1"
              >
                {t('clearAll')}
              </Button>
            </div>
          </Card>
        </div>
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
