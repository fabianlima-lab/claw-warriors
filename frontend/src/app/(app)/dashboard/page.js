'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatBar from '@/components/ui/StatBar';
import TrialBanner from '@/components/TrialBanner';
import { CLASS_LABELS, CLASS_HEX, CLASS_STAT_NAMES, CLASS_STAT_KEYS } from '@/lib/constants';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [warriors, setWarriors] = useState([]);
  const [messages, setMessages] = useState([]);
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      {/* Trial banner */}
      {stats.tier === 'trial' && (
        <TrialBanner trialEndsAt={stats.trial_ends_at} />
      )}

      {/* Warrior cards */}
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-txt mb-6">
          {isProTribe ? 'Your Warriors' : 'Your Warrior'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="flex items-start gap-4">
                  <Image
                    src={`/warriors/${templateId}.png`}
                    alt={template.name || templateId}
                    width={isProTribe ? 64 : 80}
                    height={isProTribe ? 64 : 80}
                    className="rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-[family-name:var(--font-display)] text-lg text-txt">
                      {w.customName || w.custom_name || template.name || templateId}
                    </h3>
                    <span
                      className="text-xs uppercase tracking-wider font-medium"
                      style={{ color }}
                    >
                      {CLASS_LABELS[cls]}
                    </span>
                    {isProTribe && templateId && (
                      <p className="text-xs text-txt-dim mt-1">
                        @{(template.name || '').replace(/\s/g, '')}{CLASS_LABELS[cls]}Bot
                      </p>
                    )}
                    {template.introQuote && (
                      <p className="text-sm text-txt-muted italic mt-2 truncate">
                        &ldquo;{template.introQuote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 space-y-2">
                  {statNames.map((name, i) => (
                    <StatBar
                      key={name}
                      label={name}
                      value={warriorStats[statKeys[i]] || 0}
                      warriorClass={cls}
                    />
                  ))}
                </div>

                {/* Quick stats row */}
                <div className="mt-4 flex items-center gap-4 text-xs text-txt-muted">
                  <span>{stats.messages_today || 0} msgs today</span>
                  <span>{stats.messages_this_month || 0} this month</span>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="ghost"
                    className="text-xs px-3 py-1.5"
                    onClick={() => router.push('/warriors')}
                  >
                    Switch
                  </Button>
                </div>
              </Card>
            );
          })}

          {/* Add warrior slot (Pro Tribe only) */}
          {isProTribe && warriors.length < maxWarriors && (
            <Card
              className="p-6 border-dashed cursor-pointer hover:border-guardian transition-colors"
              onClick={() => router.push('/warriors')}
            >
              <div className="flex flex-col items-center justify-center h-full gap-3 text-txt-muted">
                <span className="text-4xl">+</span>
                <span className="text-sm">
                  Add warrior ({maxWarriors - warriors.length} slot{maxWarriors - warriors.length !== 1 ? 's' : ''} remaining)
                </span>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Bottom grid: Activity + Skills + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">Recent Activity</h3>
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    msg.direction === 'in' ? 'bg-guardian' : 'bg-bard'
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
            <p className="text-sm text-txt-dim">No messages yet. Start chatting with your warrior!</p>
          )}
        </Card>

        {/* Active Skills */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">Active Skills</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm text-txt-body">Telegram</span>
              <span className="text-xs text-success ml-auto">Active</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm text-txt-body">Web Search</span>
              <span className="text-xs text-guardian ml-auto">Built-in</span>
            </div>
          </div>
          <Link
            href="/dashboard/skills"
            className="text-sm text-guardian hover:underline mt-4 inline-block"
          >
            Manage →
          </Link>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full text-left text-sm"
              onClick={() => router.push('/warriors')}
            >
              Switch Warrior
            </Button>
            {stats.tier === 'trial' && (
              <Button
                variant="ghost"
                className="w-full text-left text-sm"
                onClick={() => router.push('/upgrade')}
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Gateway Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <div>
              <span className="text-sm text-txt font-medium">Gateway Online</span>
              <span className="text-xs text-txt-dim ml-3">
                Last heartbeat: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-xs border-danger/30 text-danger hover:bg-danger/10"
            onClick={() => setShowResetDialog(true)}
          >
            Reset Gateway
          </Button>
        </div>
      </Card>

      {/* Reset dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
          <Card className="p-8 max-w-md mx-4">
            <h3 className="font-[family-name:var(--font-display)] text-xl text-txt">
              ⚠️ Reset Gateway Connection?
            </h3>
            <p className="text-sm text-txt-muted mt-3">
              This will restart the OpenClaw gateway and reconnect all active skills.
              Your warrior will be briefly offline (10–15 seconds). No data is lost.
            </p>
            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowResetDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  apiFetch('/gateway/reset', { method: 'POST' }).catch(() => {});
                  setShowResetDialog(false);
                }}
                className="flex-1"
              >
                Confirm Reset
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
