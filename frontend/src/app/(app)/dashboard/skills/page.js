'use client';

import Card from '@/components/ui/Card';

const SKILLS = [
  {
    category: 'Messaging',
    items: [
      { name: 'Telegram', status: 'active', icon: '📱' },
      { name: 'WhatsApp', status: 'coming_soon', icon: '💬' },
    ],
  },
  {
    category: 'Productivity',
    items: [
      { name: 'Gmail', status: 'not_connected', icon: '✉️' },
      { name: 'Google Calendar', status: 'not_connected', icon: '📅' },
      { name: 'Notion', status: 'not_connected', icon: '📝' },
      { name: 'Google Drive', status: 'not_connected', icon: '📁' },
    ],
  },
  {
    category: 'Creative',
    items: [
      { name: 'Midjourney', status: 'not_connected', icon: '🎨' },
      { name: 'Canva', status: 'not_connected', icon: '🖼️' },
    ],
  },
  {
    category: 'Development',
    items: [
      { name: 'GitHub', status: 'not_connected', icon: '🐙' },
      { name: 'Vercel', status: 'not_connected', icon: '▲' },
    ],
  },
  {
    category: 'Built-in',
    items: [
      { name: 'Web Search', status: 'built_in', icon: '🌐' },
      { name: 'Persistent Memory', status: 'built_in', icon: '🧠' },
    ],
  },
];

const STATUS_STYLES = {
  active: { label: 'Active', color: 'text-success', bg: 'bg-success/10' },
  built_in: { label: 'Built-in', color: 'text-accent', bg: 'bg-accent/10' },
  not_connected: { label: 'Not Connected', color: 'text-txt-dim', bg: 'bg-elevated' },
  coming_soon: { label: 'Coming Soon', color: 'text-txt-dim', bg: 'bg-elevated' },
};

export default function SkillsPage() {
  const activeCount = SKILLS.flatMap((c) => c.items).filter((i) => i.status === 'active').length;
  const builtInCount = SKILLS.flatMap((c) => c.items).filter((i) => i.status === 'built_in').length;
  const availableCount = SKILLS.flatMap((c) => c.items).filter((i) => i.status === 'not_connected').length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-txt">Skills & Apps</h1>

      {/* Summary bar */}
      <div className="flex items-center gap-4 mt-4 text-sm">
        <span className="text-success font-medium">{activeCount} Active</span>
        <span className="text-txt-dim">·</span>
        <span className="text-accent font-medium">{builtInCount} Built-in</span>
        <span className="text-txt-dim">·</span>
        <span className="text-txt-muted">{availableCount} Available</span>
      </div>

      {/* Skill categories */}
      <div className="mt-8 space-y-8">
        {SKILLS.map((category) => (
          <div key={category.category}>
            <h3 className="text-sm font-medium text-txt uppercase tracking-wider mb-4">
              {category.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.items.map((skill) => {
                const style = STATUS_STYLES[skill.status];
                const dimmed = skill.status === 'not_connected' || skill.status === 'coming_soon';
                return (
                  <Card
                    key={skill.name}
                    className={`p-4 flex items-center gap-4 ${dimmed ? 'opacity-50' : ''}`}
                  >
                    <span className="text-2xl">{skill.icon}</span>
                    <div className="flex-1">
                      <span className="text-sm text-txt font-medium">{skill.name}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${style.color} ${style.bg}`}>
                      {style.label}
                    </span>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Help callout */}
      <Card className="mt-8 p-6">
        <p className="text-sm text-txt-muted">
          💡 Want to connect more apps? Configure new integrations in your OpenClaw gateway.
        </p>
      </Card>
    </div>
  );
}
