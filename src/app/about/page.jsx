'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from '@/components/ui-components/Themetoggle';
import LanguageSwitcher from '@/components/ui-components/LanguageSwitcher';
import {
  ArrowRight,
  ArrowUpRight,
  MessageSquare,
  Video,
  Heart,
  Shield,
  Play,
  Pause,
  Lock,
  CheckCircle2,
  Mic,
  Volume2,
  Users,
  Compass,
  Check,
  Radio,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations('about');
  const prefersReducedMotion = useReducedMotion();

  // Interactive showcase state
  const [activeShowcaseTab, setActiveShowcaseTab] = useState(0);
  const [isPlayingHeroAudio, setIsPlayingHeroAudio] = useState(false);
  const [isPlayingChatVoice, setIsPlayingChatVoice] = useState(false);

  // Showcase tabs definition
  const showcaseTabs = [
    {
      id: 0,
      number: '01',
      title: t('scroll.section1Title'),
      desc: t('scroll.section1Desc'),
      tag: t('showcase.tab1')
    },
    {
      id: 1,
      number: '02',
      title: t('scroll.section2Title'),
      desc: t('scroll.section2Desc'),
      tag: t('showcase.tab2')
    },
    {
      id: 2,
      number: '03',
      title: t('scroll.section3Title'),
      desc: t('scroll.section3Desc'),
      tag: t('showcase.tab3')
    }
  ];

  return (
    <div className="relative min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white transition-colors duration-300">
      
      {/* ─── MASTHEAD & TICKER BAR ─── */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]/30 backdrop-blur-sm text-[11px] font-mono tracking-tight text-[var(--muted-foreground)] px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[var(--foreground)] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PocPoc Network
            </span>
            <span className="hidden sm:inline-block text-[var(--border)]">/</span>
            <span className="hidden sm:inline-block">WebRTC Mesh · E2E Cryptography</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden md:inline-block">Protocol v2.4 (Core)</span>
            <span className="hidden md:inline-block text-[var(--border)]">/</span>
            <span>Hanoi · Saigon · Global Nodes</span>
          </div>
        </div>
      </div>

      {/* ─── INTEGRATED EDITORIAL HEADER ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-18 sm:h-20 flex items-center justify-between">
          {/* Brand mark */}
          <div className="flex items-baseline gap-3">
            <Link href="/" className="group flex items-baseline gap-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              <span>Poc</span>
              <span className="text-[var(--accent)] group-hover:italic transition-all">Poc</span>
            </Link>
            <span className="hidden lg:inline-block text-[11px] font-mono text-[var(--muted-foreground)] border-l border-[var(--border)] pl-3">
              The Human Social Commons
            </span>
          </div>

          {/* Directory Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="group flex items-baseline gap-1.5 text-xs font-mono tracking-tight text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <span className="text-[10px] text-[var(--accent)]">01</span>
              <span className="font-sans font-medium text-sm text-[var(--foreground)]">{t('features.title')}</span>
            </a>
            <a
              href="#showcase"
              className="group flex items-baseline gap-1.5 text-xs font-mono tracking-tight text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <span className="text-[10px] text-[var(--accent)]">02</span>
              <span className="font-sans font-medium text-sm text-[var(--foreground)]">{t('scroll.section1Title')}</span>
            </a>
            <a
              href="#manifesto"
              className="group flex items-baseline gap-1.5 text-xs font-mono tracking-tight text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <span className="text-[10px] text-[var(--accent)]">03</span>
              <span className="font-sans font-medium text-sm text-[var(--foreground)]">Manifesto</span>
            </a>
          </nav>

          {/* Controls & Primary Action */}
          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageSwitcher variant="toggle" />
            <ThemeToggle />
            <Link
              href="/login"
              className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wide uppercase bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] transition-all duration-150 border border-[var(--foreground)]"
            >
              <span>{t('hero.ctaStart')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── SECTION 1: EDITORIAL HERO ─── */}
      <section className="relative w-full border-b border-[var(--border)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-12 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Bold Typographic Identity */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8 lg:space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="inline-block w-2 h-2 bg-[var(--accent)]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                    Human-Scale Digital Space · Vol. 01
                  </span>
                </div>

                <motion.h1
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-5xl sm:text-7xl lg:text-[5.5rem] font-medium tracking-[-0.04em] leading-[0.96] text-[var(--foreground)]"
                >
                  {t('hero.headline')}
                </motion.h1>

                <motion.p
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="text-base sm:text-xl text-[var(--muted-foreground)] font-normal leading-relaxed max-w-[54ch]"
                >
                  {t('hero.subhead')}
                </motion.p>
              </div>

              {/* CTAs and Protocol Readout */}
              <div className="space-y-8 pt-2">
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-3 px-7 py-3.5 text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <span>{t('hero.ctaStart')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--card)] active:scale-[0.98] transition-all"
                  >
                    <span>{t('hero.ctaLearn')}</span>
                  </a>
                </div>

                {/* Technical architectural strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-[var(--border)] text-xs font-mono text-[var(--muted-foreground)]">
                  <div>
                    <span className="block text-[10px] uppercase text-[var(--accent)] font-semibold">Latency</span>
                    <span className="text-[var(--foreground)] font-medium">&lt; 18ms WebSocket</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-[var(--accent)] font-semibold">Architecture</span>
                    <span className="text-[var(--foreground)] font-medium">Decentralized Mesh</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block text-[10px] uppercase text-[var(--accent)] font-semibold">Curation</span>
                    <span className="text-[var(--foreground)] font-medium">100% Chronological</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Visual Centerpiece (Human Connection) */}
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="relative border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4 shadow-sm"
              >
                {/* Visual Header Strip */}
                <div className="flex items-center justify-between pb-3 text-[11px] font-mono text-[var(--muted-foreground)] border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span>PLATE 01 / CANDID RESONANCE</span>
                  </div>
                  <span>HANOI, 2025</span>
                </div>

                {/* Photographic Artwork Frame */}
                <div className="relative aspect-[4/4.5] sm:aspect-[4/4.2] w-full mt-3 overflow-hidden bg-[var(--card-elevated)] border border-[var(--border)]">
                  <Image
                    src="/images/about/hero_connection.png"
                    alt="Authentic human connection and laughter between friends"
                    fill
                    sizes="(max-width: 768px) 100vw, 520px"
                    priority
                    className="object-cover object-center grayscale-[15%] hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Audio Voice Note Overlay Artifact */}
                  <div className="absolute bottom-4 left-4 right-4 p-3.5 bg-black/80 backdrop-blur-md border border-white/10 text-white rounded-none">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPlayingHeroAudio(!isPlayingHeroAudio)}
                        aria-label={isPlayingHeroAudio ? 'Pause voice message' : 'Play voice message'}
                        className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
                      >
                        {isPlayingHeroAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="truncate">Voice note from Linh · 0:24</span>
                          <span className="text-[var(--accent)]">{isPlayingHeroAudio ? 'Playing' : '0:08 / 0:24'}</span>
                        </div>
                        {/* Audio Waveform Bars */}
                        <div className="flex items-center gap-1 h-3.5">
                          {[35, 60, 45, 90, 75, 40, 85, 95, 65, 50, 80, 70, 45, 60, 85, 40, 30, 70, 55, 90, 65, 40, 75, 50].map((height, i) => (
                            <span
                              key={i}
                              style={{ height: `${height}%` }}
                              className={`w-1 rounded-none transition-all duration-200 ${
                                isPlayingHeroAudio && i < 14
                                  ? 'bg-[var(--accent)]'
                                  : 'bg-white/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editorial Caption / Colophon */}
                <div className="pt-3 text-[11px] font-mono leading-relaxed text-[var(--muted-foreground)] flex items-start justify-between gap-4">
                  <p>
                    <span className="text-[var(--foreground)] font-medium">Human presence:</span> Genuine conversations unfold without algorithm-driven engagement traps.
                  </p>
                  <span className="shrink-0 text-[var(--accent)] font-semibold">FIG. A</span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 2: EDITORIAL MANIFESTO STRIP ─── */}
      <section id="manifesto" className="relative w-full border-b border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-baseline">
            <div className="lg:col-span-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--accent)]">
                The PocPoc Thesis
              </span>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight mt-2 text-[var(--foreground)]">
                Built for presence, not engagement metrics.
              </h2>
            </div>
            <div className="lg:col-span-8">
              <blockquote className="text-xl sm:text-2xl lg:text-3xl font-light text-[var(--foreground)] leading-relaxed tracking-tight border-l-2 border-[var(--accent)] pl-6">
                &ldquo;{t('manifesto.quote')}&rdquo;
              </blockquote>
            </div>
          </div>

          {/* Three Foundational Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 mt-12 border-t border-[var(--border)]">
            <div className="space-y-2">
              <div className="text-xs font-mono text-[var(--accent)]">01 / PRINCIPLE</div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">{t('manifesto.p1Title')}</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{t('manifesto.p1Desc')}</p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-mono text-[var(--accent)]">02 / PRINCIPLE</div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">{t('manifesto.p2Title')}</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{t('manifesto.p2Desc')}</p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-mono text-[var(--accent)]">03 / PRINCIPLE</div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">{t('manifesto.p3Title')}</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{t('manifesto.p3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: ASYMMETRIC BROADSHEET FEATURES ─── */}
      <section id="features" className="relative w-full border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24 space-y-16">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
                Core Capabilities · 01
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight mt-1 text-[var(--foreground)]">
                {t('features.title')}
              </h2>
            </div>
            <p className="text-sm font-mono text-[var(--muted-foreground)] max-w-xs">
              Meticulously engineered for zero latency, audio spatiality, and cryptographic privacy.
            </p>
          </div>

          {/* Feature Grid: Asymmetric Broadsheet Layout */}
          <div className="space-y-8">
            
            {/* ROW 1: Real-time messaging (8 cols) + Account Security (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Feature 1: Real-time messaging */}
              <div className="lg:col-span-7 border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
                      <span>DISPATCH / SOCKET</span>
                    </span>
                    <span className="text-[var(--accent)]">E2EE PROTOCOL</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--foreground)]">
                    {t('features.chatTitle')}
                  </h3>
                  <p className="text-base text-[var(--muted-foreground)] leading-relaxed max-w-[50ch]">
                    {t('features.chatDesc')}
                  </p>
                </div>

                {/* Interactive Chat Mechanism Demonstration */}
                <div className="mt-8 border border-[var(--border)] bg-[var(--card-elevated)] p-4 sm:p-5 space-y-3 font-sans">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
                        ML
                      </div>
                      <span className="font-medium text-[var(--foreground)]">{t('showcase.postAuthor')}</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      &lt; 14ms latency
                    </span>
                  </div>

                  {/* Message bubbles */}
                  <div className="space-y-2.5 text-xs">
                    <div className="bg-[var(--card)] border border-[var(--border)] p-3 max-w-[85%] self-start">
                      <p className="text-[var(--foreground)]">{t('showcase.chatMsg1')}</p>
                      <span className="block text-[9px] font-mono text-[var(--muted-foreground)] mt-1">09:14 AM · Delivered</span>
                    </div>

                    <div className="bg-[var(--foreground)] text-[var(--background)] p-3 max-w-[85%] ml-auto">
                      <p>{t('showcase.chatMsg2')}</p>
                      <div className="flex items-center justify-between text-[9px] font-mono opacity-80 mt-1">
                        <span>Voice memo attached</span>
                        <span>09:15 AM · Read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4: Account Security */}
              <div className="lg:col-span-5 border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[var(--accent)]" />
                      <span>CRYPTOGRAPHIC SANCTUARY</span>
                    </span>
                    <span>2FA / BIOMETRIC</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--foreground)]">
                    {t('features.secureTitle')}
                  </h3>
                  <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
                    {t('features.secureDesc')}
                  </p>
                </div>

                {/* Technical Cryptographic Control Display */}
                <div className="mt-8 border border-[var(--border)] bg-[var(--card-elevated)] p-4 sm:p-5 space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <span className="text-[var(--muted-foreground)]">Key Fingerprint</span>
                    <span className="text-[var(--foreground)] font-bold">ed25519:7f8a...31b9</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <span className="text-[var(--muted-foreground)]">Zero-Knowledge Auth</span>
                    <span className="text-emerald-500 font-medium">Verified Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted-foreground)]">Session Guard</span>
                    <span className="text-[var(--accent)] font-medium">Multi-Factor Locked</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ROW 2: High-Quality Calling (5 cols) + Share Moments (7 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Feature 2: High-Quality Calling */}
              <div className="lg:col-span-5 border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-[var(--accent)]" />
                      <span>WEBRTC STREAMING</span>
                    </span>
                    <span className="text-[var(--accent)]">60FPS HD</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--foreground)]">
                    {t('features.callTitle')}
                  </h3>
                  <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
                    {t('features.callDesc')}
                  </p>
                </div>

                {/* Real photographic illustration of human call connection */}
                <div className="relative mt-8 aspect-[4/3] w-full overflow-hidden border border-[var(--border)] bg-zinc-950">
                  <Image
                    src="/images/about/call_connection.png"
                    alt="Authentic video call connection with friend at dusk"
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover object-center grayscale-[15%] hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm border border-white/10 text-white text-[10px] font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Spatial Audio Active</span>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm border border-white/10 text-white text-[10px] font-mono">
                    P2P Direct · 0% Packet Loss
                  </div>
                </div>
              </div>

              {/* Feature 3: Share Moments */}
              <div className="lg:col-span-7 border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-[var(--accent)]" />
                      <span>CHRONOLOGICAL CURRENTS</span>
                    </span>
                    <span>NO ALGORITHMIC FEED</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--foreground)]">
                    {t('features.shareTitle')}
                  </h3>
                  <p className="text-base text-[var(--muted-foreground)] leading-relaxed max-w-[50ch]">
                    {t('features.shareDesc')}
                  </p>
                </div>

                {/* Photographic and tactile post preview */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-12 gap-4 border border-[var(--border)] bg-[var(--card-elevated)] p-4 sm:p-5">
                  <div className="sm:col-span-5 relative aspect-[4/3] sm:aspect-auto w-full overflow-hidden border border-[var(--border)]">
                    <Image
                      src="/images/about/shared_moments.png"
                      alt="Hands sharing printed photography memories over tea"
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="sm:col-span-7 flex flex-col justify-between space-y-3 font-sans text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--foreground)]">{t('showcase.postAuthor')}</span>
                        <span className="font-mono text-[10px] text-[var(--muted-foreground)]">Today · 08:30 AM</span>
                      </div>
                      <p className="text-[var(--muted-foreground)] leading-relaxed">
                        &ldquo;{t('showcase.postContent')}&rdquo;
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                      <div className="text-[11px] text-[var(--foreground)] flex items-start gap-2">
                        <span className="font-semibold shrink-0 text-[var(--accent)]">{t('showcase.friend1')}:</span>
                        <span>{t('showcase.friend1Msg')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--muted-foreground)] pt-1">
                        <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>42 genuine reactions</span>
                        </span>
                        <span>· 0 sponsored promotions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 4: PRODUCT SHOWCASE STUDIO ─── */}
      <section id="showcase" className="relative w-full border-b border-[var(--border)] bg-[var(--card)]/20">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24 space-y-12">
          
          {/* Header and Story Introduction */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[var(--border)] pb-6">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--accent)]">
                The Product In Action · 02
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[var(--foreground)]">
                {showcaseTabs[activeShowcaseTab].title}
              </h2>
            </div>
            
            {/* Step Selector Tabs */}
            <div className="flex items-center gap-2 border border-[var(--border)] p-1 bg-[var(--card)]">
              {showcaseTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveShowcaseTab(tab.id)}
                  className={`px-4 py-2 text-xs font-mono transition-all ${
                    activeShowcaseTab === tab.id
                      ? 'bg-[var(--foreground)] text-[var(--background)] font-medium'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.number} / {tab.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Showcase Viewport */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Narrative description */}
            <div className="lg:col-span-5 space-y-6">
              <div className="text-xs font-mono text-[var(--muted-foreground)]">
                STEP {showcaseTabs[activeShowcaseTab].number} OF 03
              </div>

              <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--foreground)]">
                {showcaseTabs[activeShowcaseTab].title}
              </h3>

              <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
                {showcaseTabs[activeShowcaseTab].desc}
              </p>

              <div className="pt-6 border-t border-[var(--border)] space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="font-medium text-[var(--foreground)]">No algorithmic manipulation:</span>
                    <span className="text-[var(--muted-foreground)]"> Chronological streams mean you see updates only from connections you actively choose.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="font-medium text-[var(--foreground)]">Uncompromising privacy:</span>
                    <span className="text-[var(--muted-foreground)]"> Your conversations and metadata are never aggregated for ad profile targeting.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Architectural Interactive Showcase Surface */}
            <div className="lg:col-span-7">
              <div className="border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
                
                {/* Surface Window Chrome */}
                <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--card-elevated)] flex items-center justify-between text-xs font-mono text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-[var(--foreground)] font-medium">pocpoc.internal/app</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--accent)] font-semibold">{t('showcase.encryptedBadge')}</span>
                  </div>
                </div>

                {/* Dynamic Content Surface */}
                <div className="p-6 sm:p-8 min-h-[420px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    
                    {/* TAB 0: The Living Dialogue */}
                    {activeShowcaseTab === 0 && (
                      <motion.div
                        key="dialogue"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 max-w-lg mx-auto w-full"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center">
                              LN
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[var(--foreground)]">{t('showcase.chatUser')}</div>
                              <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active now
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-[var(--muted-foreground)]">Channel: Direct</span>
                        </div>

                        {/* Dialogue Thread */}
                        <div className="space-y-3 font-sans text-xs pt-2">
                          <div className="bg-[var(--card-elevated)] border border-[var(--border)] p-3.5 max-w-[85%]">
                            <p className="text-[var(--foreground)]">{t('showcase.chatMsg1')}</p>
                            <span className="block text-[9px] font-mono text-[var(--muted-foreground)] mt-1.5">10:42 AM</span>
                          </div>

                          <div className="bg-[var(--foreground)] text-[var(--background)] p-3.5 max-w-[85%] ml-auto space-y-2">
                            <p>{t('showcase.chatMsg2')}</p>
                            
                            {/* Voice memo mini player */}
                            <div className="pt-2 border-t border-white/20 flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setIsPlayingChatVoice(!isPlayingChatVoice)}
                                className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0"
                              >
                                {isPlayingChatVoice ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center justify-between text-[9px] font-mono opacity-80 mb-1">
                                  <span>{t('showcase.listenVoice')}</span>
                                  <span>{isPlayingChatVoice ? 'Playing' : '0:24'}</span>
                                </div>
                                <div className="flex items-center gap-0.5 h-2">
                                  {[40, 80, 60, 100, 75, 45, 90, 85, 50, 70, 95, 40].map((h, i) => (
                                    <span
                                      key={i}
                                      style={{ height: `${h}%` }}
                                      className={`w-1 ${isPlayingChatVoice && i < 6 ? 'bg-[var(--accent)]' : 'bg-white/40'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Typing indicator */}
                          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--muted-foreground)] pl-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" />
                            <span>Linh is typing...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 1: Chronological Currents (Feed) */}
                    {activeShowcaseTab === 1 && (
                      <motion.div
                        key="feed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 max-w-lg mx-auto w-full"
                      >
                        <div className="border border-[var(--border)] bg-[var(--card-elevated)] p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                                ML
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-[var(--foreground)]">{t('showcase.postAuthor')}</h4>
                                <p className="text-[10px] font-mono text-[var(--muted-foreground)]">{t('showcase.postRole')}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--accent)]">CHRONO FEED</span>
                          </div>

                          <p className="text-xs text-[var(--foreground)] leading-relaxed">
                            {t('showcase.postContent')}
                          </p>

                          <div className="relative aspect-[16/9] w-full overflow-hidden border border-[var(--border)]">
                            <Image
                              src="/images/about/shared_moments.png"
                              alt="Candid studio photographic moment"
                              fill
                              sizes="(max-width: 768px) 100vw, 420px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[11px] font-mono text-[var(--muted-foreground)]">
                            <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                              <Heart className="w-3.5 h-3.5 fill-current" /> 48 reactions
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" /> 8 conversations
                            </span>
                            <span className="text-[var(--accent)]">No ads</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 2: Cryptographic Sanctuary */}
                    {activeShowcaseTab === 2 && (
                      <motion.div
                        key="privacy"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 max-w-lg mx-auto w-full text-center"
                      >
                        <div className="w-16 h-16 mx-auto rounded-none border border-[var(--accent)] bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                          <Lock className="w-8 h-8" />
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xl font-medium text-[var(--foreground)] tracking-tight">
                            Client-Side Cryptographic Shield
                          </h4>
                          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto leading-relaxed">
                            Every message and file is sealed on your device with modern public-key cryptography before traversing the network.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-left font-mono text-xs pt-2">
                          <div className="border border-[var(--border)] p-3 bg-[var(--card-elevated)]">
                            <span className="block text-[10px] text-[var(--muted-foreground)]">ENCRYPTION</span>
                            <span className="text-[var(--foreground)] font-bold">X25519 + ChaCha20</span>
                          </div>
                          <div className="border border-[var(--border)] p-3 bg-[var(--card-elevated)]">
                            <span className="block text-[10px] text-[var(--muted-foreground)]">DATA HARVESTING</span>
                            <span className="text-emerald-500 font-bold">Strictly Zero (0%)</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* Surface Footer Status */}
                <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--card-elevated)] flex items-center justify-between text-[11px] font-mono text-[var(--muted-foreground)]">
                  <span>Displaying live simulation preview</span>
                  <span className="text-[var(--foreground)] font-medium">Step {showcaseTabs[activeShowcaseTab].number} / 03</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── SECTION 5: MONUMENTAL CLOSING CTA ─── */}
      <section className="relative w-full border-b border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] py-20 sm:py-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest opacity-70">
              Join The Commons · No Advertisements · Free Forever
            </span>
            <h2 className="text-4xl sm:text-6xl font-medium tracking-[-0.03em] leading-tight max-w-3xl mx-auto">
              {t('footer.ctaText')}
            </h2>
            <p className="text-base sm:text-lg opacity-80 max-w-xl mx-auto font-normal leading-relaxed">
              {t('footer.ctaDesc')}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-3 px-9 py-4 text-sm font-semibold tracking-wide bg-[var(--background)] text-[var(--foreground)] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <span>{t('footer.ctaButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-8 text-xs font-mono opacity-60 flex flex-wrap items-center justify-center gap-6">
            <span>✓ No phone number tracking</span>
            <span>✓ Open cryptographic protocol</span>
            <span>✓ Instant WebRTC calling</span>
          </div>

        </div>
      </section>

      {/* ─── SECTION 6: EDITORIAL FOOTER ─── */}
      <footer className="w-full bg-[var(--card)] text-[var(--foreground)] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pb-12 border-b border-[var(--border)]">
            
            {/* Col 1: Brand & Manifesto colophon */}
            <div className="md:col-span-5 space-y-4">
              <Link href="/" className="inline-block text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Poc<span className="text-[var(--accent)]">Poc</span>
              </Link>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-sm">
                A modern digital commons engineered for genuine human connection, intimate voice moments, and uncompromising privacy.
              </p>
              <div className="text-xs font-mono text-[var(--muted-foreground)] pt-2">
                Status: <span className="text-emerald-500 font-medium">All Systems Operational</span> · v2.4
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="md:col-span-3 space-y-3 text-xs font-mono">
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Directory</div>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="hover:text-[var(--accent)] transition-colors">{t('features.title')}</a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-[var(--accent)] transition-colors">{t('scroll.section1Title')}</a>
                </li>
                <li>
                  <a href="#manifesto" className="hover:text-[var(--accent)] transition-colors">The Manifesto</a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[var(--accent)] transition-colors">{t('hero.ctaStart')}</Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Legal & Privacy */}
            <div className="md:col-span-4 space-y-3 text-xs font-mono">
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Sanctuary & Trust</div>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[var(--accent)] transition-colors">Terms of Service</Link>
                </li>
                <li className="text-[var(--muted-foreground)]">
                  Zero telemetry data collection policy
                </li>
              </ul>

              <div className="pt-4 flex items-center gap-4">
                <LanguageSwitcher variant="toggle" />
                <ThemeToggle />
              </div>
            </div>

          </div>

          {/* Bottom Colophon Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--muted-foreground)]">
            <p>&copy; {new Date().getFullYear()} PocPoc Commons. All rights reserved.</p>
            <p>Designed with intentionality & craft for the open web.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
