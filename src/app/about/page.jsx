'use client';

// DESIGN_VARIANCE: 8
// MOTION_INTENSITY: 8
// VISUAL_DENSITY: 3
// Reading this as: marketing introduction page for users and prospective members, with a premium consumer glassmorphic language, leaning toward custom Framer Motion scroll-driven animations + tailwind CSS v4.

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from '@/components/ui-components/Themetoggle';
import LanguageSwitcher from '@/components/ui-components/LanguageSwitcher';
import {
  MessageSquare,
  Video,
  Heart,
  Shield,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Lock,
  CheckCircle2,
  Users,
  Compass,
  Check
} from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations('about');
  // Sticky showcase section ref
  const showcaseRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!showcaseRef.current) return;
      const textBlocks = showcaseRef.current.querySelectorAll('.showcase-text-block');
      if (textBlocks.length === 0) return;

      let activeIndex = 0;
      let minDistance = Infinity;
      const viewportCenter = window.innerHeight / 2;

      textBlocks.forEach((block, index) => {
        const rect = block.getBoundingClientRect();
        const blockCenter = rect.top + rect.height / 2;
        const distance = Math.abs(blockCenter - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          activeIndex = index;
        }
      });
      setActiveStep(activeIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Floating shape values for Hero parallax
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white">
      {/* Floating Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-[var(--accent)]/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[60%] aspect-square rounded-full bg-[var(--accent)]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] aspect-square rounded-full bg-[var(--accent)]/8 blur-[130px] pointer-events-none" />

      {/* Floating Header */}
      <header className="fixed top-4 left-4 right-4 z-50 h-16 max-w-7xl mx-auto rounded-full bg-glass flex items-center justify-between px-6 shadow-sm border border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Link href="/" className="logo-brand flex items-center gap-1 text-xl sm:text-2xl">
            Poc<span className="logo-accent">Poc</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200">
            {t('features.title')}
          </a>
          <a href="#showcase" className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200">
            {t('scroll.section1Title')}
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher variant="toggle" />
          <ThemeToggle />
          <Link href="/login" className="btn-primary !py-2 !px-4 !text-xs !font-bold rounded-full">
            {t('hero.ctaStart')}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] max-w-7xl mx-auto px-6 pt-24 sm:pt-28 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12">
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-8 text-left z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)]/40 backdrop-blur-md text-[var(--muted-foreground)] text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse" />
                <span>PocPoc Connect v2.0</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
                {t('hero.headline')}
              </h1>
              
              <p className="text-base sm:text-lg text-[var(--muted-foreground)] max-w-xl leading-relaxed">
                {t('hero.subhead')}
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link href="/login" className="btn-primary !px-6 !py-3 !text-sm group flex items-center gap-2 rounded-full shadow-lg">
                <span>{t('hero.ctaStart')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a href="#features" className="px-6 py-3 rounded-full text-sm font-semibold border border-[var(--border)] hover:bg-[var(--card-elevated)]/40 transition-colors flex items-center gap-2">
                {t('hero.ctaLearn')}
              </a>
            </motion.div>
          </div>

          {/* Hero Visual Asset */}
          <div className="lg:col-span-5 flex justify-center z-10">
            <motion.div
              style={{
                x: mousePosition.x,
                y: mousePosition.y,
                rotateX: mousePosition.y * -0.2,
                rotateY: mousePosition.x * 0.2,
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full aspect-square max-w-[420px] rounded-3xl p-3 bg-glass border border-[var(--border)] shadow-2xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-950">
                <Image
                  src="/hero_network.png"
                  alt="PocPoc Premium Network Representation"
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  priority
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
                />
              </div>

              {/* Floating stats card */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-glass/90 border border-[var(--border)] shadow-xl flex items-center justify-between backdrop-blur-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white">
                    <Users className="w-5 h-5 text-[var(--accent-foreground)]" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted-foreground)]">Active Community</div>
                    <div className="text-sm font-bold">120k+ Connected</div>
                  </div>
                </div>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--success)]"></span>
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity z-10">
          <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-semibold">Scroll to explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-[var(--muted-foreground)]" />
        </div>
      </section>


      {/* Grid Features Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {t('features.title')}
          </h2>
          <div className="h-1.5 w-12 bg-[var(--accent)] rounded-full mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1: Real-time chat */}
          <motion.div
            whileHover={{ y: -6 }}
            className="p-6 rounded-2xl bg-[var(--card)]/40 border border-[var(--border)] backdrop-blur-md space-y-4 card-hover-effect"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/10 shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">{t('features.chatTitle')}</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{t('features.chatDesc')}</p>
          </motion.div>

          {/* Feature 2: High-quality calling */}
          <motion.div
            whileHover={{ y: -6 }}
            className="p-6 rounded-2xl bg-[var(--card)]/40 border border-[var(--border)] backdrop-blur-md space-y-4 card-hover-effect"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/10 shadow-sm">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">{t('features.callTitle')}</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{t('features.callDesc')}</p>
          </motion.div>

          {/* Feature 3: Share moments */}
          <motion.div
            whileHover={{ y: -6 }}
            className="p-6 rounded-2xl bg-[var(--card)]/40 border border-[var(--border)] backdrop-blur-md space-y-4 card-hover-effect"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/10 shadow-sm">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">{t('features.shareTitle')}</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{t('features.shareDesc')}</p>
          </motion.div>

          {/* Feature 4: Account Security */}
          <motion.div
            whileHover={{ y: -6 }}
            className="p-6 rounded-2xl bg-[var(--card)]/40 border border-[var(--border)] backdrop-blur-md space-y-4 card-hover-effect"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/10 shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">{t('features.secureTitle')}</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{t('features.secureDesc')}</p>
          </motion.div>
        </div>
      </section>

      {/* Sticky Showcase Section (High-end Scroll Triggered Stack - Desktop Only) */}
      <section id="showcase" ref={showcaseRef} className="hidden lg:block relative w-full border-t border-[var(--border)] bg-[var(--card)]/5">
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Scroll Text Explanations (Left Side) - Normal scrollable list */}
          <div className="lg:col-span-5 flex flex-col relative z-10">
            {/* Step 1 */}
            <div className="showcase-text-block min-h-[60vh] py-[15vh] flex flex-col justify-center space-y-4">
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                01 / Minimal Experience
              </div>
              <h3 className="text-4xl font-extrabold tracking-tight">
                {t('scroll.section1Title')}
              </h3>
              <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
                {t('scroll.section1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="showcase-text-block min-h-[60vh] py-[15vh] flex flex-col justify-center space-y-4">
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                02 / Synchronized
              </div>
              <h3 className="text-4xl font-extrabold tracking-tight">
                {t('scroll.section2Title')}
              </h3>
              <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
                {t('scroll.section2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="showcase-text-block min-h-[60vh] py-[15vh] flex flex-col justify-center space-y-4">
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                03 / Privacy Locked
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {t('scroll.section3Title')}
              </h3>
              <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
                {t('scroll.section3Desc')}
              </p>
            </div>
          </div>

          {/* Sticky Visual Showcase (Right Side) */}
          <div className="lg:col-span-7 sticky top-0 h-screen flex justify-center items-center">
            {/* Device Frame Wrapper */}
            <div className="relative w-[300px] h-[400px] sm:w-[320px] sm:h-[420px] rounded-[48px] bg-zinc-950 p-3 shadow-2xl border-4 border-zinc-800 overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-6 bg-zinc-950 rounded-b-2xl z-20 flex items-center justify-center">
                <div className="w-12 h-1 bg-zinc-800 rounded-full" />
              </div>
              
              {/* Internal Device Screen Screen */}
              <div className="relative flex-1 rounded-[38px] overflow-hidden bg-zinc-900 border border-zinc-800 flex flex-col p-4">
                <AnimatePresence mode="wait">
                  {/* Visual Stage 1: Real-time UI */}
                  {activeStep === 0 && (
                    <motion.div
                      key="ui-chat"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="flex-1 flex flex-col justify-end space-y-3 pt-6"
                    >
                      <div className="flex items-center gap-2 mb-auto pb-2 border-b border-zinc-800">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-white">JD</div>
                        <div>
                          <div className="text-xs font-bold text-white">John Doe</div>
                          <div className="text-[9px] text-[var(--success)]">online</div>
                        </div>
                      </div>

                      {/* Speech bubbles */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-zinc-800 text-[11px] text-zinc-100 p-2.5 rounded-2xl rounded-tl-none self-start max-w-[80%]"
                      >
                        Hi there! Are you ready to see the new PocPoc update?
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[var(--accent)] text-[11px] text-[var(--accent-foreground)] p-2.5 rounded-2xl rounded-br-none self-end max-w-[80%]"
                      >
                        Absolutely! Let's check out the new design and motion components.
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-zinc-800 text-[11px] text-zinc-100 p-2.5 rounded-2xl rounded-tl-none self-start max-w-[80%] flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                        <span>Awesome! Launching now...</span>
                      </motion.div>

                      {/* Input bar */}
                      <div className="bg-zinc-950 p-1 rounded-full flex items-center justify-between border border-zinc-800 mt-2">
                        <div className="text-[10px] text-zinc-500 px-3">Type message...</div>
                        <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white">
                          <ArrowRight className="w-3 h-3 text-[var(--accent-foreground)]" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Visual Stage 2: Instant Sync / Live Post Feed */}
                  {activeStep === 1 && (
                    <motion.div
                      key="ui-feed"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="flex-1 flex flex-col justify-start space-y-4 pt-6"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <span className="text-xs font-bold text-white">PocPoc Feed</span>
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                      </div>

                      {/* Feed card */}
                      <div className="bg-zinc-950 rounded-2xl p-3 border border-zinc-800 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-white">A</div>
                          <div>
                            <div className="text-[10px] font-bold text-white">Alice Vance</div>
                            <div className="text-[8px] text-zinc-500">2 minutes ago</div>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-300">
                          Connecting with nature this weekend! Exploring the mountains 🏔️
                        </p>
                        <div className="relative h-28 w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                          <Image
                            src="/chat_feature.png"
                            alt="Vibrant visual for showcase feed post"
                            fill
                            sizes="320px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-4 text-[9px] text-zinc-500 pt-1">
                          <span className="flex items-center gap-1 text-[var(--destructive)]">
                            <Heart className="w-3.5 h-3.5 fill-current" /> 148
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> 24
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Visual Stage 3: Privacy Lock */}
                  {activeStep === 2 && (
                    <motion.div
                      key="ui-security"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="flex-1 flex flex-col justify-center items-center space-y-4 pt-6 text-center"
                    >
                      <motion.div
                        initial={{ rotate: -90, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-16 h-16 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center border border-[var(--accent)]/20"
                      >
                        <Lock className="w-8 h-8 text-[var(--accent)]" />
                      </motion.div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">2FA Protection</h4>
                        <p className="text-[10px] text-zinc-400 max-w-[200px]">
                          Your login session is encrypted and guarded with multi-factor authentication.
                        </p>
                      </div>

                      {/* Interactive scan code UI */}
                      <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 w-full max-w-[200px] flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[var(--success)] animate-pulse" />
                        <span className="text-[10px] font-mono tracking-widest text-zinc-300">SECURE: ACTIVE</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Mobile Showcase Section (Shown on mobile screens only) */}
      <section className="block lg:hidden py-16 px-6 space-y-16 bg-[var(--card)]/10 border-t border-[var(--border)]">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight">
            {t('scroll.section1Title')}
          </h2>
          <div className="h-1.5 w-12 bg-[var(--accent)] rounded-full mx-auto" />
        </div>

        <div className="space-y-16 max-w-xl mx-auto">
          {/* Card 1: Minimal Experience */}
          <div className="space-y-6 bg-[var(--card)]/30 p-6 rounded-3xl border border-[var(--border)] backdrop-blur-sm">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                01 / Minimal Experience
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                {t('scroll.section1Title')}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                {t('scroll.section1Desc')}
              </p>
            </div>

            {/* Mobile Device Mockup for Chat */}
            <div className="flex justify-center items-center py-4">
              <div className="relative w-[280px] h-[360px] rounded-[36px] bg-zinc-950 p-2.5 shadow-xl border-4 border-zinc-800 overflow-hidden flex flex-col">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-zinc-950 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-zinc-800 rounded-full" />
                </div>
                <div className="relative flex-1 rounded-[28px] overflow-hidden bg-zinc-900 border border-zinc-800 flex flex-col p-3 pt-5 justify-end space-y-2">
                  <div className="flex items-center gap-2 mb-auto pb-1.5 border-b border-zinc-800">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-bold text-white">JD</div>
                    <div>
                      <div className="text-[10px] font-bold text-white">John Doe</div>
                      <div className="text-[8px] text-[var(--success)]">online</div>
                    </div>
                  </div>
                  <div className="bg-zinc-800 text-[10px] text-zinc-100 p-2 rounded-xl rounded-tl-none self-start max-w-[85%]">
                    Hi there! Are you ready to see the new PocPoc update?
                  </div>
                  <div className="bg-[var(--accent)] text-[10px] text-[var(--accent-foreground)] p-2 rounded-xl rounded-br-none self-end max-w-[85%]">
                    Absolutely! Let's check out the new design and motion components.
                  </div>
                  <div className="bg-zinc-800 text-[10px] text-zinc-100 p-2 rounded-xl rounded-tl-none self-start max-w-[85%] flex items-center gap-1">
                    <Check className="w-3 h-3 text-[var(--success)]" />
                    <span>Awesome! Launching now...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Synchronized */}
          <div className="space-y-6 bg-[var(--card)]/30 p-6 rounded-3xl border border-[var(--border)] backdrop-blur-sm">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                02 / Synchronized
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                {t('scroll.section2Title')}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                {t('scroll.section2Desc')}
              </p>
            </div>

            {/* Mobile Device Mockup for Feed */}
            <div className="flex justify-center items-center py-4">
              <div className="relative w-[280px] h-[360px] rounded-[36px] bg-zinc-950 p-2.5 shadow-xl border-4 border-zinc-800 overflow-hidden flex flex-col">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-zinc-950 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-zinc-800 rounded-full" />
                </div>
                <div className="relative flex-1 rounded-[28px] overflow-hidden bg-zinc-900 border border-zinc-800 flex flex-col p-3 pt-5 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                    <span className="text-[10px] font-bold text-white">PocPoc Feed</span>
                    <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                  </div>
                  <div className="bg-zinc-950 rounded-xl p-2 border border-zinc-800 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] font-bold text-white">A</div>
                      <div>
                        <div className="text-[9px] font-bold text-white">Alice Vance</div>
                        <div className="text-[7px] text-zinc-500">2 mins ago</div>
                      </div>
                    </div>
                    <p className="text-[9px] text-zinc-300 leading-tight">
                      Connecting with nature this weekend! Exploring the mountains 🏔️
                    </p>
                    <div className="relative h-20 w-full rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                      <Image
                        src="/chat_feature.png"
                        alt="Vibrant visual for showcase feed post"
                        fill
                        sizes="260px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Privacy Locked */}
          <div className="space-y-6 bg-[var(--card)]/30 p-6 rounded-3xl border border-[var(--border)] backdrop-blur-sm">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                03 / Privacy Locked
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                {t('scroll.section3Title')}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                {t('scroll.section3Desc')}
              </p>
            </div>

            {/* Mobile Device Mockup for Security */}
            <div className="flex justify-center items-center py-4">
              <div className="relative w-[280px] h-[360px] rounded-[36px] bg-zinc-950 p-2.5 shadow-xl border-4 border-zinc-800 overflow-hidden flex flex-col">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-zinc-950 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-zinc-800 rounded-full" />
                </div>
                <div className="relative flex-1 rounded-[28px] overflow-hidden bg-zinc-900 border border-zinc-800 flex flex-col p-3 pt-5 justify-center items-center space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center border border-[var(--accent)]/20">
                    <Lock className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white">2FA Protection</h4>
                    <p className="text-[9px] text-zinc-400 max-w-[160px] mx-auto">
                      Your login session is encrypted and guarded with multi-factor authentication.
                    </p>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 w-full max-w-[160px] flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)] animate-pulse" />
                    <span className="text-[8px] font-mono tracking-widest text-zinc-300">SECURE: ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conversion Banner / Footer */}
      <footer className="relative border-t border-[var(--border)] bg-[var(--card)]/10 backdrop-blur-md pt-20 pb-12 overflow-hidden">
        {/* Subtle decorative mesh background */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              {t('footer.ctaText')}
            </h2>
            <p className="text-base text-[var(--muted-foreground)] max-w-lg mx-auto">
              {t('footer.ctaDesc')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login" className="btn-primary !px-8 !py-3.5 !text-sm group flex items-center gap-2 rounded-full shadow-lg">
              <span>{t('footer.ctaButton')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Copyright, disclaimer, legal links */}
          <div className="pt-16 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted-foreground)]">
            <p>&copy; {new Date().getFullYear()} PocPoc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[var(--foreground)] transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
