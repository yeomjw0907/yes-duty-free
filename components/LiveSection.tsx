import React from 'react';
import { MOCK_LIVES } from '../constants';
import { LiveStream } from '../types';

interface LiveSectionProps {
  onNavigateToLive?: (liveIndex?: number) => void;
}

const LiveSection: React.FC<LiveSectionProps> = ({ onNavigateToLive }) => {
  const liveStreams = MOCK_LIVES as LiveStream[];

  return (
    <div className="py-16 bg-white border-y border-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
              </span>
              지금 뜨는 라방
            </h2>
            <p className="text-sm text-gray-600 mt-2">전문 쇼호스트가 전하는 생생한 면세 혜택</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToLive?.()}
            className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            실시간 방송 더보기 &gt;
          </button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {liveStreams.concat(liveStreams[0]).map((live, idx) => (
            <div
              key={live.id + idx}
              role="button"
              tabIndex={0}
              onClick={() => onNavigateToLive?.(idx)}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateToLive?.(idx)}
              className="relative group cursor-pointer flex flex-col gap-3"
            >
              <div className="aspect-[9/16] relative overflow-hidden rounded-2xl shadow-lg bg-gray-100">
                <img 
                  src={live.thumbnail} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={live.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                
                {live.isLive ? (
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md w-fit shadow-lg">LIVE</span>
                    <span className="bg-black/30 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                      {live.viewerCount.toLocaleString()} 시청
                    </span>
                  </div>
                ) : (
                  <div className="absolute top-4 left-4">
                    {/* Fixed: Safe access to startTime which is optional on LiveStream interface */}
                    <span className="bg-gray-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">{live.startTime || '방송 예정'}</span>
                  </div>
                )}
                
                <div className="absolute bottom-6 left-4 right-4">
                  <h3 className="text-white font-bold text-base leading-snug line-clamp-2 drop-shadow-md">
                    {live.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border border-white/30 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${live.id}`} alt="host" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white/80 text-xs font-medium">DutyFree 쇼호스트</span>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/50">
                    <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveSection;
