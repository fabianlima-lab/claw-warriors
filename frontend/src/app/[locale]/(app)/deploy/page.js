'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SectionLabel from '@/components/ui/SectionLabel';
import { CLASS_LABELS, CLASS_HEX } from '@/lib/constants';
import { apiFetch } from '@/lib/api';

const DEPLOY_STEPS = ['step1', 'step2', 'step3', 'step4', 'step5'];
const STEP_DURATION = 800;

export default function DeployPage() {
  const t = useTranslations('Deploy');
  const tClasses = useTranslations('Classes');
  const [warrior, setWarrior] = useState(null);
  const [phase, setPhase] = useState('deploying');
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/warriors/mine')
      .then((data) => {
        const list = data.warriors || data;
        if (Array.isArray(list) && list.length > 0) {
          const active = list.find((w) => w.isActive || w.is_active) || list[0];
          setWarrior(active);
        }
      })
      .catch(() => {});
  }, []);

  // Animated deploy sequence
  useEffect(() => {
    if (phase !== 'deploying') return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= DEPLOY_STEPS.length - 1) {
          clearInterval(timer);
          setTimeout(() => setPhase('done'), 600);
          return prev;
        }
        return prev + 1;
      });
    }, STEP_DURATION);

    return () => clearInterval(timer);
  }, [phase]);

  const cls = warrior?.warriorClass || warrior?.warrior_class || 'guardian';
  const color = CLASS_HEX[cls];
  const templateId = warrior?.templateId || warrior?.template_id;
  const warriorAvatar = avatarPreview || (templateId ? `/warriors/${templateId}.png` : null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;

    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/warriors/${warrior.id}/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarPreview(data.avatar_url);
        setToast(t('avatarUploaded'));
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      // Silently fail — preview still shows
    }
    setUploading(false);
  }

  function handleDone() {
    setPhase('done');
  }

  // ── Deploy Animation Phase ──
  if (phase === 'deploying') {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse"
            style={{ background: color }}
          />
          {warriorAvatar && (
            <Image
              src={warriorAvatar}
              alt="Deploying"
              width={128}
              height={128}
              className="relative rounded-full object-cover w-full h-full border-2 border-border opacity-80"
            />
          )}
        </div>

        <h2 className="font-[family-name:var(--font-display)] text-xl text-txt mb-6">
          {t('deploying')}
        </h2>

        <div className="space-y-3 max-w-xs mx-auto">
          {DEPLOY_STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                i < currentStep
                  ? 'text-success'
                  : i === currentStep
                    ? 'text-accent'
                    : 'text-txt-dim'
              }`}
            >
              <span className="w-5 text-center">
                {i < currentStep ? '✓' : i === currentStep ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                ) : '○'}
              </span>
              <span>{t(step)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Avatar Awakening Phase ──
  if (phase === 'avatar') {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <SectionLabel warriorClass={cls}>{t('step')}</SectionLabel>

        <h1 className="font-[family-name:var(--font-display)] text-2xl text-txt mt-6 mb-2">
          {t('avatarTitle')}
        </h1>
        <p className="text-sm text-txt-muted mb-8">{t('avatarSubtitle')}</p>

        <div className="relative w-36 h-36 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{ background: color }}
          />
          {warriorAvatar && (
            <Image
              src={warriorAvatar}
              alt="Avatar"
              width={144}
              height={144}
              className="relative rounded-full object-cover w-full h-full border-2 border-border"
            />
          )}
        </div>

        <div className="space-y-3 max-w-xs mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleUpload}
            className="hidden"
          />

          <Button
            variant={cls}
            className="w-full"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('uploadAvatar')}
          </Button>

          <p className="text-xs text-txt-dim">{t('avatarHint')}</p>

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleDone}
          >
            {avatarPreview ? t('useDefault') : t('skipAvatar')}
          </Button>
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-[var(--radius-btn)] text-sm text-txt shadow-lg z-50">
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ── Done Phase ──
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-center">
      <SectionLabel warriorClass={cls}>{t('step')}</SectionLabel>

      <div className="mt-8 mb-6">
        <div className="relative w-40 h-40 mx-auto">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse"
            style={{ background: color }}
          />
          {warriorAvatar && (
            <Image
              src={warriorAvatar}
              alt={warrior?.name || 'Warrior'}
              width={160}
              height={160}
              className="relative rounded-full object-cover w-full h-full border-2 border-border"
            />
          )}
        </div>
      </div>

      <h1 className="font-[family-name:var(--font-display)] text-4xl text-txt mt-6">
        {t('title')}
      </h1>

      {warrior && (
        <div className="mt-3">
          <span className="font-[family-name:var(--font-display)] text-2xl text-txt">
            {warrior.customName || warrior.custom_name || warrior.name || templateId}
          </span>
          <span
            className="block text-xs uppercase tracking-wider font-medium mt-1"
            style={{ color }}
          >
            {tClasses(CLASS_LABELS[cls])}
          </span>
        </div>
      )}

      <p className="text-txt-muted mt-6 max-w-md mx-auto">
        {t('description')}
      </p>

      <div className="mt-10">
        <Button
          onClick={() => router.push('/dashboard')}
          variant={cls}
          className="px-10"
        >
          {t('goToDashboard')}
        </Button>
      </div>
    </div>
  );
}
