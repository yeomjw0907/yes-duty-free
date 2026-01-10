
import React, { useState, useEffect } from 'react';
import { LOGO_SVG, MOCK_PRODUCTS } from '../constants';
import { Category } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onAdminClick: () => void;
  setCurrentPage: (page: string, category?: string, subCategory?: string) => void;
  currentPage: string;
}

const Layout: React.FC<LayoutProps> = ({ children, onAdminClick, setCurrentPage, currentPage }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isLiveMode = currentPage === 'live';

  const categories = Object.values(Category);

  const bottomNavItems = [
    { id: 'home', label: '홈', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { id: 'all_categories', label: '카테고리', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /> },
    { id: 'live', label: '라이브', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
    { id: 'deals', label: '특가', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /> },
    { id: 'mypage', label: 'MY', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> }
  ];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${isLiveMode ? 'bg-black text-white' : 'bg-[#fcfcfc] text-[#1a1a1a]'} pb-16 lg:pb-0`}>
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[250] bg-white animate-in fade-in slide-in-from-top-4 duration-500 overflow-y-auto scrollbar-hide">
          <div className="max-w-5xl mx-auto px-6 py-8 lg:py-16">
            <div className="flex items-center gap-4 lg:gap-8 mb-16 border-b-4 border-gray-900 pb-2 lg:pb-5">
              <div className="flex items-center pointer-events-none shrink-0">
                 <svg className="w-6 h-6 lg:w-9 lg:h-9 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="어떤 면세 혜택을 찾으시나요?"
                className="flex-grow text-lg lg:text-3xl font-black outline-none bg-transparent placeholder:text-gray-200 transition-all text-gray-900"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-2 lg:p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all shrink-0"
              >
                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-8">Trending Now</h3>
                <div className="space-y-6">
                  {['설화수 자음생 세트', '에어팟 프로 최저가', '조말론 블랙베리', '정관장 에브리타임', '위스키 오픈런 혜택'].map((keyword, idx) => (
                    <div key={idx} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-5">
                        <span className="text-xl font-black italic text-red-600 w-4 text-center">{idx + 1}</span>
                        <span className="text-lg font-extrabold text-gray-800 group-hover:text-red-600 group-hover:translate-x-1 transition-all">{keyword}</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-200 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-8">Real-time Popular</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {MOCK_PRODUCTS.slice(0, 4).map((product) => (
                    <div 
                      key={product.id} 
                      className="group cursor-pointer flex flex-col gap-4"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative shadow-sm group-hover:shadow-xl transition-all duration-500">
                        <img 
                          src={product.imageUrl} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          alt={product.name}
                        />
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-lg">HOT</div>
                      </div>
                      <div className="px-1 flex flex-col gap-1.5">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{product.brand}</p>
                        <h4 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors h-10">{product.name}</h4>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-red-600 text-sm font-black">{product.discount}%</span>
                          <span className="text-gray-900 text-sm font-black">{product.price.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header (GNB) */}
      <header className={`sticky top-0 z-[200] ${isLiveMode ? 'bg-black border-white/10' : 'bg-white border-gray-100'} border-b backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 lg:h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-10">
              <div 
                className="flex items-center gap-1.5 cursor-pointer group" 
                onClick={() => setCurrentPage('home')}
              >
                <div className="scale-75 lg:scale-100">{LOGO_SVG("w-8 h-8 lg:w-10 lg:h-10 shadow-lg shadow-red-500/20 rounded-xl")}</div>
                <span className={`font-black text-base lg:text-xl tracking-tighter uppercase italic ${isLiveMode ? 'text-white' : 'text-[#E52D27]'}`}>Yes Duty Free</span>
              </div>
              <nav className={`hidden lg:flex gap-10 text-[15px] font-black uppercase tracking-tight ${isLiveMode ? 'text-white/70' : 'text-gray-800'}`}>
                <button onClick={() => setCurrentPage('deals')} className="hover:text-red-600 transition-colors">Special Offers</button>
                <button onClick={() => setCurrentPage('best')} className="hover:text-red-600 transition-colors">Best Sellers</button>
                <button onClick={() => setCurrentPage('live')} className="hover:text-red-600 transition-colors">Live TV</button>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className={`p-2.5 rounded-full transition-all ${isLiveMode ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>
              <div className="hidden lg:flex items-center gap-8">
                <button onClick={() => setCurrentPage('mypage')} className={`text-xs font-black tracking-widest uppercase ${isLiveMode ? 'text-white/40 hover:text-white' : 'text-gray-300 hover:text-gray-900'}`}>My Profile</button>
                <button onClick={onAdminClick} className={`text-xs font-black tracking-widest uppercase ${isLiveMode ? 'text-white/20 hover:text-white' : 'text-gray-100 hover:text-gray-900'}`}>Admin</button>
                <button onClick={() => setCurrentPage('login')} className={`px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-xl active:scale-95 ${isLiveMode ? 'bg-white text-black hover:bg-red-600 hover:text-white' : 'bg-gray-900 text-white hover:bg-red-600'}`}>LOGIN</button>
              </div>
            </div>
          </div>

          {/* Sub Navigation Bar - Cat Menu (Always visible on non-live modes for easy navigation) */}
          {!isLiveMode && (
            <div className="flex items-center gap-8 py-3 overflow-x-auto scrollbar-hide border-t border-gray-50 px-2 lg:px-0">
              <button 
                onClick={() => setCurrentPage('home')} 
                className={`text-[13px] font-black whitespace-nowrap transition-colors ${currentPage === 'home' ? 'text-red-600' : 'text-gray-500'}`}
              >
                전체보기
              </button>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setCurrentPage('category', cat)}
                  className={`text-[13px] font-bold whitespace-nowrap transition-colors ${currentPage === 'category' && children?.props?.activeCategory === cat ? 'text-red-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-[150] border-t flex items-center justify-around h-16 px-4 shadow-[0_-5px_25px_rgba(0,0,0,0.06)] backdrop-blur-2xl transition-all ${isLiveMode ? 'bg-black/90 border-white/5 text-white' : 'bg-white/95 border-gray-100'}`}>
        {bottomNavItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${currentPage === item.id ? 'text-red-600' : (isLiveMode ? 'text-white/30' : 'text-gray-300')}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
            <span className="text-[10px] font-black tracking-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      {!isLiveMode && (
        <footer className="bg-gray-900 text-white pt-24 pb-16 mt-20 mb-16 lg:mb-0">
          <div className="max-w-7xl mx-auto px-10">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-20 border-b border-gray-800 pb-20 mb-16">
              <div className="col-span-1">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-white p-1 rounded-xl shadow-inner">{LOGO_SVG("w-10 h-10")}</div>
                  <span className="font-black text-2xl tracking-tighter uppercase italic">Yes Duty Free</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  (주)원케이션 | 대표이사: 홍길동<br/>
                  글로벌 면세 물류 배송 전문 서비스<br/>
                  admin@onecation.co.kr
                </p>
              </div>
              <div className="lg:col-span-3 grid grid-cols-3 gap-10">
                <div>
                  <h4 className="font-black mb-6 text-gray-400 text-xs uppercase tracking-widest">Customer Support</h4>
                  <ul className="text-sm space-y-4 font-medium text-gray-500">
                    <li className="hover:text-white cursor-pointer transition-colors">공지사항</li>
                    <li className="hover:text-white cursor-pointer transition-colors">자주 묻는 질문</li>
                    <li className="hover:text-white cursor-pointer transition-colors">1:1 문의하기</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black mb-6 text-gray-400 text-xs uppercase tracking-widest">Global Logistics</h4>
                  <ul className="text-sm space-y-4 font-medium text-gray-500">
                    <li className="hover:text-white cursor-pointer transition-colors">배송 현황 조회</li>
                    <li className="hover:text-white cursor-pointer transition-colors">통관 안내</li>
                    <li className="hover:text-white cursor-pointer transition-colors">해외 배송 가능 국가</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black mb-6 text-gray-400 text-xs uppercase tracking-widest">Connect</h4>
                  <ul className="text-sm space-y-4 font-medium text-gray-500">
                    <li className="hover:text-white cursor-pointer transition-colors">Instagram</li>
                    <li className="hover:text-white cursor-pointer transition-colors">YouTube</li>
                    <li className="hover:text-white cursor-pointer transition-colors">Facebook</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              <span>© 2025 Onecation Co., Ltd. All rights reserved.</span>
              <div className="flex gap-8">
                <span className="hover:text-white cursor-pointer">Terms of Service</span>
                <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
