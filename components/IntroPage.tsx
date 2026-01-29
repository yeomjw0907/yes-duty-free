import React from 'react';
import { LOGO_SVG } from '../constants';

const INTRO_DURATION_MS = 1500;

interface IntroPageProps {
  onComplete: () => void;
}

const IntroPage: React.FC<IntroPageProps> = ({ onComplete }) => {
  React.useEffect(() => {
    const t = setTimeout(onComplete, INTRO_DURATION_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#fcfcfc] text-[#1a1a1a] transition-opacity duration-300"
      style={{ fontFamily: 'Pretendard, sans-serif', opacity: visible ? 1 : 0 }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="transition-opacity duration-500 delay-75">
          {LOGO_SVG('w-20 h-20 lg:w-28 lg:h-28')}
        </div>
        <h1 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900">
          Yes Duty Free
        </h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Global Duty Free Shopping
        </p>
      </div>
    </div>
  );
};

export default IntroPage;
