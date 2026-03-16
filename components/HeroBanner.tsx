import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getBanners } from '../lib/api/banners';
import type { BannerSlide } from '../types';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512496011220-420a89408e06?q=80&w=1600&auto=format&fit=crop',
];

const HeroBanner: React.FC = () => {
  const { t } = useTranslation();
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  const getFallbackBanners = (): BannerSlide[] => [
    { id: 'fallback-1', tag: t('banner.fallback1Tag'), title: t('banner.fallback1Title'), desc: t('banner.fallback1Desc'), img: FALLBACK_IMAGES[0], linkUrl: null },
    { id: 'fallback-2', tag: t('banner.fallback2Tag'), title: t('banner.fallback2Title'), desc: t('banner.fallback2Desc'), img: FALLBACK_IMAGES[1], linkUrl: null },
  ];

  const lang = useTranslation().i18n.language;
  useEffect(() => {
    getBanners('main', lang).then((list) => {
      setSlides(list.length > 0 ? list : getFallbackBanners());
      setLoading(false);
    }).catch(() => {
      setSlides(getFallbackBanners());
      setLoading(false);
    });
  }, [lang]);

  const list = slides.length > 0 ? slides : getFallbackBanners();

  useEffect(() => {
    if (list.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % list.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [list.length]);

  if (loading && list.length === 0) {
    return (
      <div className="w-full h-[460px] lg:h-[500px] rounded-3xl overflow-hidden bg-gray-200 animate-pulse" />
    );
  }

  const slide = list[current];
  return (
    <div className="relative w-full h-[460px] lg:h-[500px] rounded-3xl overflow-hidden bg-gray-900 group shadow-2xl">
      <div className="absolute inset-0 transition-opacity duration-1000">
        <img
          src={slide.img}
          className="w-full h-full object-cover opacity-50 scale-105"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="relative h-full px-12 lg:px-20 flex flex-col justify-center text-white">
        {slide.tag && (
          <span className="bg-red-600/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-black w-fit mb-6 uppercase tracking-[0.2em] shadow-lg">
            {slide.tag}
          </span>
        )}
        <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-[1.15] whitespace-pre-line tracking-tight drop-shadow-2xl">
          {slide.title}
        </h1>
        {slide.desc && (
          <p className="text-base lg:text-lg opacity-80 mb-10 max-w-lg whitespace-pre-line font-medium leading-relaxed">
            {slide.desc}
          </p>
        )}
        {slide.linkUrl ? (
          <a
            href={slide.linkUrl}
            target={slide.linkUrl.startsWith('http') ? '_blank' : undefined}
            rel={slide.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="bg-white text-gray-900 px-10 py-4 rounded-full text-sm font-black hover:bg-red-600 hover:text-white transition-all w-fit shadow-xl hover:-translate-y-1 active:scale-95"
          >
            {t('banner.viewCollection')}
          </a>
        ) : (
          <span className="bg-white text-gray-900 px-10 py-4 rounded-full text-sm font-black w-fit shadow-xl cursor-default">
            {t('banner.viewCollection')}
          </span>
        )}
      </div>

      <div className="absolute bottom-10 right-10 flex items-center gap-6">
        <div className="flex gap-2">
          {list.map((_, i) => (
            <button key={i} type="button" onClick={() => setCurrent(i)} className="p-0 border-0 bg-transparent cursor-pointer" aria-label={t('banner.slideN', { n: i + 1 })}>
              <div className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? 'w-10 bg-white' : 'w-2.5 bg-white/30'}`} />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setCurrent((prev) => (prev - 1 + list.length) % list.length)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all text-white" aria-label={t('banner.prev')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button type="button" onClick={() => setCurrent((prev) => (prev + 1) % list.length)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all text-white" aria-label={t('banner.next')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
