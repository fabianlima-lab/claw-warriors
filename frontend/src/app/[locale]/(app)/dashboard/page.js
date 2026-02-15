'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import StatBar from '@/components/ui/StatBar';
import TrialBanner from '@/components/TrialBanner';
import ChatPanel from '@/components/ChatPanel';
import { CLASS_LABELS, CLASS_HEX, CLASS_STAT_NAMES, CLASS_STAT_KEYS } from '@/lib/constants';
import { apiFetch } from '@/lib/api';

const FEATURE_BUTTONS = [
  { key: 'soul', icon: '✨', href: '/dashboard/soul', glossary: 'soulForge' },
  { key: 'memory', icon: '🧠', href: '/dashboard/memory', glossary: 'deepMemory' },
  { key: 'pulse', icon: '💓', href: '/dashboard/pulse', glossary: 'pulseCheck' },
  { key: 'rhythms', icon: '⚡', href: '/dashboard/rhythms', glossary: 'standingOrders' },
  { key: 'skills', icon: '🔌', href: '/dashboard/skills', glossary: 'skill' },
  { key: 'vault', icon: '🔐', href: '/dashboard/vault', glossary: 'vault' },
];

const TIER_COLORS = {
  recruit: 'text-txt-muted',
  apprentice: 'text-scholar',
  warrior: 'text-accent',
  commander: 'text-creator',
};

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const tClasses = useTranslations('Classes');
  const tStats = useTranslations('Stats');
  const tCommon = useTranslations('Common');
  const tQuests = useTranslations('Quests');
  const tGlossary = useTranslations('Glossary');
  const [stats, setStats] = useState(null);
  const [warriors, setWarriors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [questState, setQuestState] = useState(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/dashboard/stats').then(setStats).catch(() => {});
    apiFetch('/warriors/mine')
      .then((data) => {
        const list = Array.isArray(data) ? data : data.warriors || [];
        setWarriors(list);
      })
      .catch(() => {});
    apiFetch('/dashboard/messages?limit=4')
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMessages(list);
      })
      .catch(() => {});
    apiFetch('/quests').then(setQuestState).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-elevated rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-card border border-border rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
    );
  }

  const isProTribe = stats.tier === 'pro_tribe';
  const maxWarriors = stats.max_warriors || 1;
  const primaryWarrior = warriors[0];
  const nextQuest = questState?.quests?.find((q) => !q.completed);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      {/* Trial banner */}
      {stats.tier === 'trial' && (
        <TrialBanner trialEndsAt={stats.trial_ends_at} />
      )}

      {/* ── The Hearth: Warrior + Quest + Chat ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left column: Warrior card + Features + Quest */}
        <div className="lg:col-span-2 space-y-4">
          {warriors.map((w) => {
            const cls = w.warriorClass || w.warrior_class;
            const color = CLASS_HEX[cls];
            const templateId = w.templateId || w.template_id;
            const template = w.template || {};
            const statNames = CLASS_STAT_NAMES[cls] || [];
            const statKeys = CLASS_STAT_KEYS[cls] || [];
            const warriorStats = template.stats || {};

            return (
              <Card key={w.id} className="p-6">
                {/* Warrior identity */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Image
                      src={`/warriors/${templateId}.png`}
                      alt={template.name || templateId}
                      width={72}
                      height={72}
                      className="rounded-full object-cover shrink-0 ring-2 ring-border"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-[family-name:var(--font-display)] text-lg text-txt">
                      {w.customName || w.custom_name || template.name || templateId}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs uppercase tracking-wider font-medium"
                        style={{ color }}
                      >
                        {tClasses(CLASS_LABELS[cls])}
                      </span>
                      {questState && (
                        <span className={`text-xs font-medium ${TIER_COLORS[questState.questTier] || ''}`}>
                          {tQuests('level', { level: questState.level })}
                        </span>
                      )}
                    </div>
                    {template.introQuote && (
                      <p className="text-xs text-txt-muted italic mt-1 truncate">
                        &ldquo;{template.introQuote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* XP Progress Bar */}
                {questState && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-txt-dim mb-1">
                      <span className={`font-medium uppercase tracking-wider ${TIER_COLORS[questState.questTier] || ''}`}>
                        {tQuests(questState.questTier)}
                      </span>
                      <span>
                        {questState.nextLevelXp
                          ? tQuests('xpLabel', { current: questState.totalXp, next: questState.nextLevelXp })
                          : tQuests('xpMaxLevel', { current: questState.totalXp })}
                      </span>
                    </div>
                    <div className="h-2 bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{
                          width: questState.nextLevelXp
                            ? `${Math.min(100, (questState.totalXp / questState.nextLevelXp) * 100)}%`
                            : '100%',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Stat bars */}
                <div className="mt-4 space-y-2">
                  {statNames.map((name, i) => (
                    <StatBar
                      key={name}
                      label={tStats(name)}
                      value={warriorStats[statKeys[i]] || 0}
                      warriorClass={cls}
                    />
                  ))}
                </div>

                {/* Quick stats */}
                <div className="mt-3 flex items-center gap-4 text-xs text-txt-muted">
                  <span>{t('msgsToday', { count: stats.messages_today || 0 })}</span>
                  <span>{t('msgsMonth', { count: stats.messages_this_month || 0 })}</span>
                </div>

                {/* Switch action */}
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    className="text-xs px-3 py-1.5"
                    onClick={() => router.push('/warriors')}
                  >
                    {t('switch')}
                  </Button>
                </div>
              </Card>
            );
          })}

          {/* Add warrior slot (Pro Tribe only) */}
          {isProTribe && warriors.length < maxWarriors && (
            <Card
              className="p-6 border-dashed cursor-pointer hover:border-accent transition-colors"
              onClick={() => router.push('/warriors')}
            >
              <div className="flex flex-col items-center justify-center h-full gap-3 text-txt-muted">
                <span className="text-4xl">+</span>
                <span className="text-sm">
                  {maxWarriors - warriors.length !== 1
                    ? t('addWarriorPlural', { count: maxWarriors - warriors.length })
                    : t('addWarrior', { count: maxWarriors - warriors.length })}
                </span>
              </div>
            </Card>
          )}

          {/* ── Feature Buttons (6 actions) ── */}
          <div className="grid grid-cols-3 gap-2">
            {FEATURE_BUTTONS.map((btn) => (
              <Link
                key={btn.key}
                href={btn.href}
                className="relative flex flex-col items-center gap-1.5 px-2 py-3 text-txt-body bg-card border border-border rounded-[var(--radius-btn)] hover:border-accent hover:text-accent transition-all cursor-pointer group overflow-hidden"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{btn.icon}</span>
                <span className="text-[11px] font-medium">{t(btn.key)}</span>
                {/* Hover description overlay */}
                <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[10px] leading-tight text-txt bg-card/95 border border-accent rounded-[var(--radius-btn)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {tGlossary(btn.glossary)}
                </span>
              </Link>
            ))}
          </div>

          {/* ── Quest Nudge Banner ── */}
          {nextQuest && (
            <Card className="p-3 border-accent/20 bg-accent/5">
              <div className="flex items-center gap-3">
                <span className="text-lg">⚔️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-txt-body font-medium truncate">
                    {tQuests('nextQuest', { quest: tQuests(nextQuest.id) })}
                  </p>
                  <p className="text-[11px] text-txt-dim">
                    {tQuests(`${nextQuest.id}_hint`)}
                  </p>
                </div>
                <span className="text-xs font-bold text-accent shrink-0">
                  {tQuests('xpReward', { xp: nextQuest.xp })}
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* Right column: Chat panel */}
        <div className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
          {warriors.length > 0 && (
            <ChatPanel warrior={{
              name: warriors[0].customName || warriors[0].custom_name || warriors[0].template?.name || warriors[0].templateId || warriors[0].template_id,
              templateId: warriors[0].templateId || warriors[0].template_id,
              template: warriors[0].template,
            }} />
          )}
        </div>
      </div>

      {/* ── Bottom Grid: Activity + Skills + Gateway ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">{t('recentActivity')}</h3>
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    msg.direction === 'in' ? 'bg-accent' : 'bg-creator'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm text-txt-body truncate">{msg.content}</p>
                    <p className="text-xs text-txt-dim">
                      {new Date(msg.createdAt || msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-txt-dim">{t('noMessages')}</p>
          )}
        </Card>

        {/* Active Skills */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">{t('activeSkills')}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm text-txt-body">{t('telegram')}</span>
              <span className="text-xs text-success ml-auto">{t('active')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm text-txt-body">{t('webSearch')}</span>
              <span className="text-xs text-accent ml-auto">{t('builtIn')}</span>
            </div>
          </div>
          <Link
            href="/dashboard/skills"
            className="text-sm text-accent hover:underline mt-4 inline-block"
          >
            {t('manage')}
          </Link>
        </Card>

        {/* Gateway Status */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">
            <Tooltip tip={tGlossary('gateway')}>{t('gatewayOnline')}</Tooltip>
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-txt-dim">
              {t('lastHeartbeat')} {new Date().toLocaleTimeString()}
            </span>
          </div>
          <Button
            variant="ghost"
            className="text-xs border-danger/30 text-danger hover:bg-danger/10"
            onClick={() => setShowResetDialog(true)}
          >
            {t('resetGateway')}
          </Button>
        </Card>
      </div>

      {/* Reset dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
          <Card className="p-8 max-w-md mx-4">
            <h3 className="font-[family-name:var(--font-display)] text-xl text-txt">
              {t('resetTitle')}
            </h3>
            <p className="text-sm text-txt-muted mt-3">
              {t('resetDesc')}
            </p>
            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowResetDialog(false)}
                className="flex-1"
              >
                {tCommon('cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  apiFetch('/gateway/reset', { method: 'POST' }).catch(() => {});
                  setShowResetDialog(false);
                }}
                className="flex-1"
              >
                {t('confirmReset')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
