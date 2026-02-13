'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';
import StatBar from '@/components/ui/StatBar';
import ClassTabs from '@/components/ClassTabs';
import { CLASS_LABELS, CLASS_STAT_NAMES, CLASS_STAT_KEYS, CLASS_HEX, GOAL_OPTIONS } from '@/lib/constants';
import { apiFetch, apiPost } from '@/lib/api';

export default function WarriorsPage() {
  const [templates, setTemplates] = useState({});
  const [selectedClass, setSelectedClass] = useState('guardian');
  const [selectedWarrior, setSelectedWarrior] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [userTier, setUserTier] = useState('trial');
  const [tribeSelections, setTribeSelections] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Load templates
    apiFetch('/warriors/templates')
      .then((data) => {
        const grouped = {};
        (data.templates || data).forEach((w) => {
          const cls = w.warriorClass || w.warrior_class;
          if (!grouped[cls]) grouped[cls] = [];
          grouped[cls].push(w);
        });
        setTemplates(grouped);
      })
      .catch(() => {});

    // Load user data for recommended class + tier
    apiFetch('/dashboard/stats')
      .then((stats) => {
        setUserTier(stats.tier || 'trial');
        if (stats.goals) {
          const goalIds = stats.goals.split(',');
          const firstGoal = GOAL_OPTIONS.find((g) => goalIds.includes(g.id));
          if (firstGoal) setSelectedClass(firstGoal.class);
        }
      })
      .catch(() => {});
  }, []);

  const current = templates[selectedClass] || [];
  const isProTribe = userTier === 'pro_tribe';
  const maxSelections = isProTribe ? 3 : 1;

  const handleSelectWarrior = (warrior) => {
    if (isProTribe) {
      setTribeSelections((prev) => {
        const exists = prev.find((w) => w.id === warrior.id);
        if (exists) return prev.filter((w) => w.id !== warrior.id);
        if (prev.length >= maxSelections) return prev;
        return [...prev, warrior];
      });
    } else {
      setSelectedWarrior(warrior);
    }
  };

  const handleDeploy = async () => {
    const warriors = isProTribe ? tribeSelections : [selectedWarrior];
    if (warriors.length === 0 || !warriors[0]) return;

    setDeploying(true);
    try {
      for (const w of warriors) {
        await apiPost('/warriors/deploy', { templateId: w.id });
      }
      router.push('/channel');
    } catch (err) {
      console.error('Deploy failed:', err.message);
    } finally {
      setDeploying(false);
    }
  };

  const isSelected = (warrior) => {
    if (isProTribe) return tribeSelections.some((w) => w.id === warrior.id);
    return selectedWarrior?.id === warrior.id;
  };

  const deployEnabled = isProTribe
    ? tribeSelections.length > 0
    : !!selectedWarrior;

  const deployLabel = isProTribe
    ? `Deploy ${tribeSelections.length} Warrior${tribeSelections.length !== 1 ? 's' : ''}`
    : selectedWarrior
      ? `Deploy ${selectedWarrior.name}`
      : 'Select a Warrior';

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <SectionLabel warriorClass={selectedClass}>Step 2 of 4</SectionLabel>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-txt mt-3">
          Choose Your Warrior
        </h1>
        {isProTribe && (
          <p className="text-txt-muted mt-2">
            {tribeSelections.length} of {maxSelections} warriors selected
          </p>
        )}
      </div>

      <ClassTabs selected={selectedClass} onSelect={setSelectedClass} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {current.map((w) => {
          const cls = w.warriorClass || w.warrior_class;
          const statNames = CLASS_STAT_NAMES[cls] || [];
          const statKeys = CLASS_STAT_KEYS[cls] || [];
          const color = CLASS_HEX[cls];
          const active = isSelected(w);

          return (
            <Card
              key={w.id}
              className={`p-6 cursor-pointer transition-all duration-200 ${
                active ? 'ring-2 border-transparent' : 'hover:border-elevated'
              }`}
              style={active ? { '--tw-ring-color': color } : {}}
              onClick={() => handleSelectWarrior(w)}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <Image
                    src={w.artFile || w.art_file || `/warriors/${w.id}.png`}
                    alt={w.name}
                    width={120}
                    height={120}
                    className="rounded-full object-cover"
                  />
                  {active && (
                    <span
                      className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-bg text-sm font-bold"
                      style={{ background: color }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-txt text-xl">
                  {w.name}
                </h3>
                <span
                  className="text-xs uppercase tracking-wider font-medium"
                  style={{ color }}
                >
                  {CLASS_LABELS[cls]}
                </span>
                {w.introQuote && (
                  <p className="text-sm text-txt-muted italic">
                    &ldquo;{w.introQuote}&rdquo;
                  </p>
                )}
                <div className="w-full space-y-2 mt-3">
                  {statNames.map((name, i) => (
                    <StatBar
                      key={name}
                      label={name}
                      value={w.stats?.[statKeys[i]] || 0}
                      warriorClass={cls}
                    />
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Expanded view for selected warrior (single mode) */}
      {!isProTribe && selectedWarrior && (
        <Card className="mt-8 p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Image
              src={selectedWarrior.artFile || selectedWarrior.art_file || `/warriors/${selectedWarrior.id}.png`}
              alt={selectedWarrior.name}
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-txt">
                {selectedWarrior.name}
              </h3>
              <span
                className="text-xs uppercase tracking-wider font-medium"
                style={{ color: CLASS_HEX[selectedWarrior.warriorClass || selectedWarrior.warrior_class] }}
              >
                {CLASS_LABELS[selectedWarrior.warriorClass || selectedWarrior.warrior_class]}
              </span>
              {selectedWarrior.firstMessage && (
                <p className="text-sm text-txt-muted mt-3 italic">
                  &ldquo;{selectedWarrior.firstMessage}&rdquo;
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="mt-10 text-center">
        <Button
          onClick={handleDeploy}
          loading={deploying}
          disabled={!deployEnabled}
          variant={selectedClass}
          className="px-10"
        >
          {deployLabel}
        </Button>
      </div>
    </div>
  );
}
