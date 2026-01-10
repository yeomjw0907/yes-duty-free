
import React, { useState, useEffect } from 'react';

const BANNERS = [
  {
    tag: 'D-1 글로벌 쇼핑 위크',
    title: '전세계 어디든,\n면세 혜택을 배달합니다.',
    desc: '명품 브랜드부터 한국 단독 구성 세트까지,\n이제 관세/배송 걱정 없이 면세가 그대로 즐기세요.',
    img: 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?q=80&w=1600&auto=format&fit=crop'
  },
  {
    tag: 'K-BEAUTY SPECIAL',
    title: '피부 본연의 광채를 찾는,\n설화수 글로벌 특가 오픈',
    desc: '전세계 무료배송과 함께 만나는\n최상의 홀리스틱 뷰티 솔루션.',
    img: 'https://images.unsplash.com/photo-1512496011220-420a89408e06?q=80&w=1600&auto=format&fit=crop'
  }
];

const HeroBanner: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[460px] lg:h-[500px] rounded-3xl overflow-hidden bg-gray-900 group shadow-2xl">
      <div className="absolute inset-0 transition-opacity duration-1000">
        <img 
          src={BANNERS[current].img} 
          className="w-full h-full object-cover opacity-50 scale-105"
          alt="Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
      </div>
      
      <div className="relative h-full px-12 lg:px-20 flex flex-col justify-center text-white">
        <span className="bg-red-600/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-black w-fit mb-6 uppercase tracking-[0.2em] shadow-lg">
          {BANNERS[current].tag}
        </span>
        <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-[1.15] whitespace-pre-line tracking-tight drop-shadow-2xl">
          {BANNERS[current].title}
        </h1>
        <p className="text-base lg:text-lg opacity-80 mb-10 max-w-lg whitespace-pre-line font-medium leading-relaxed">
          {BANNERS[current].desc}
        </p>
        <button className="bg-white text-gray-900 px-10 py-4 rounded-full text-sm font-black hover:bg-red-600 hover:text-white transition-all w-fit shadow-xl hover:-translate-y-1 active:scale-95">
          컬렉션 살펴보기
        </button>
      </div>

      <div className="absolute bottom-10 right-10 flex items-center gap-6">
        <div className="flex gap-2">
           {BANNERS.map((_, i) => (
             <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? 'w-10 bg-white' : 'w-2.5 bg-white/30'}`} />
           ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={() => setCurrent((prev) => (prev + 1) % BANNERS.length)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
