const INTEGRATIONS = [
  { icon: '📱', name: 'Telegram' },
  { icon: '✉️', name: 'Gmail' },
  { icon: '💬', name: 'Discord' },
  { icon: '📅', name: 'Calendar' },
  { icon: '📝', name: 'Notion' },
  { icon: '🎨', name: 'Midjourney' },
  { icon: '🐙', name: 'GitHub' },
  { icon: '📁', name: 'Drive' },
  { icon: '🌐', name: 'Web Search' },
  { icon: '📊', name: 'Sheets' },
  { icon: '🖼️', name: 'Figma' },
  { icon: '⚡', name: 'Supabase' },
];

export default function AppIntegrations() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest text-artificer font-medium">Integrations</span>
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-txt mt-3">
          Connects With Your Stack
        </h2>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 max-w-3xl mx-auto">
        {INTEGRATIONS.map((app) => (
          <div
            key={app.name}
            className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-card)] bg-card border border-border hover:border-elevated transition-colors"
          >
            <span className="text-2xl">{app.icon}</span>
            <span className="text-xs text-txt-muted">{app.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
