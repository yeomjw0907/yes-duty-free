import React, { useState, useEffect } from 'react';
import { LOGO_SVG } from '../constants';
import { useCategories } from '../lib/hooks/useCategories';
import type { Product } from '../types';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/api/users';
import FooterModal from './FooterModal';

interface LayoutProps {
  children: React.ReactNode;
  setCurrentPage: (page: string, category?: string, subCategory?: string) => void;
  currentPage: string;
  products: Product[];
  productsLoading?: boolean;
  activeCategory?: string;
  user?: User | null;
  profile?: UserProfile | null;
  onLogout?: () => Promise<void>;
  authLoading?: boolean;
  cartItemCount?: number;
  /** 헤더 검색창에서 검색 시 (Enter 등): 검색어 전달 후 검색 페이지로 이동 */
  onSearchSubmit?: (query: string) => void;
}

const tierLabel = (tier: string) => (tier === 'vip' ? 'VIP' : tier === 'premium' ? 'Premium' : 'Basic');

type FooterModalType = 'notice' | 'faq' | 'inquiry' | 'customs' | 'countries' | 'terms' | 'privacy' | null;

const Layout: React.FC<LayoutProps> = ({ children, setCurrentPage, currentPage, products, productsLoading, activeCategory, user, profile, onLogout, authLoading, cartItemCount = 0, onSearchSubmit }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [footerModal, setFooterModal] = useState<FooterModalType>(null);
  const isLiveMode = currentPage === 'live';

  const { categories } = useCategories();
  const categoryNames = categories.map((c) => c.name);

  const bottomNavItems = [
    { id: 'all_categories', label: '카테고리', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /> },
    { id: 'live', label: '라이브', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
    { id: 'home', label: '홈', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
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
        <div className="fixed inset-0 z-[250] bg-white overflow-x-hidden overflow-y-auto scrollbar-hide">
          <div className="w-full min-w-0 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-16 box-border">
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-8 mb-10 sm:mb-16 border-b-4 border-gray-900 pb-2 lg:pb-5 min-w-0">
              <div className="flex items-center pointer-events-none shrink-0">
                 <svg className="w-6 h-6 lg:w-9 lg:h-9 text-gray-900 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = searchQuery.trim();
                    if (q && onSearchSubmit) {
                      onSearchSubmit(q);
                      setIsSearchOpen(false);
                    }
                  }
                }}
                placeholder="어떤 면세 혜택을 찾으시나요?"
                className="flex-1 min-w-0 text-base sm:text-lg lg:text-3xl font-black outline-none bg-transparent placeholder:text-gray-200 transition-all text-gray-900"
              />
              <button
                type="button"
                onClick={() => {
                  const q = searchQuery.trim();
                  if (q && onSearchSubmit) {
                    onSearchSubmit(q);
                    setIsSearchOpen(false);
                  } else {
                    setIsSearchOpen(false);
                  }
                }}
                className="p-2 lg:p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shrink-0 font-black text-sm lg:text-base"
              >
                검색
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-2 lg:p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all shrink-0"
              >
                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 min-w-0">
              <div className="lg:col-span-4 min-w-0">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-6 lg:mb-8">Trending Now</h3>
                <div className="space-y-5 lg:space-y-6">
                  {['설화수 자음생 세트', '에어팟 프로 최저가', '조말론 블랙베리', '정관장 에브리타임', '위스키 오픈런 혜택'].map((keyword, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 group cursor-pointer min-w-0">
                      <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                        <span className="text-lg sm:text-xl font-black italic text-red-600 w-4 shrink-0 text-center">{idx + 1}</span>
                        <span className="text-sm sm:text-lg font-extrabold text-gray-800 group-hover:text-red-600 group-hover:translate-x-1 transition-all truncate">{keyword}</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-200 group-hover:text-red-300 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 min-w-0">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-6 lg:mb-8">Real-time Popular</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 min-w-0">
                  {(productsLoading ? [] : products.slice(0, 4)).map((product) => (
                    <div 
                      key={product.id} 
                      className="group cursor-pointer flex flex-col gap-2 sm:gap-4 min-w-0"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative shadow-sm group-hover:shadow-xl transition-all duration-500">
                        <img 
                          src={product.imageUrl} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          alt={product.name}
                        />
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded shadow-lg">HOT</div>
                      </div>
                      <div className="px-0 sm:px-1 flex flex-col gap-1 min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate">{product.brand}</p>
                        <h4 className="text-[11px] sm:text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors min-h-[2.5rem] sm:h-10">{product.name}</h4>
                        <div className="mt-0.5 flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
                          <span className="text-red-600 text-xs sm:text-sm font-black">{product.discount}%</span>
                          <span className="text-gray-900 text-xs sm:text-sm font-black truncate">{product.price.toLocaleString()}원</span>
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
                onClick={() => setCurrentPage('cart')}
                className={`relative p-2.5 rounded-full transition-all ${isLiveMode ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                aria-label="장바구니"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-black rounded-full">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setIsSearchOpen(true)}
                className={`p-2.5 rounded-full transition-all ${isLiveMode ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>
              <div className="hidden lg:flex items-center gap-6">
                {!authLoading && user ? (
                  <>
                    <button onClick={() => setCurrentPage('mypage')} className={`flex items-center gap-2 text-xs font-black tracking-widest uppercase ${isLiveMode ? 'text-white/40 hover:text-white' : 'text-gray-300 hover:text-gray-900'}`}>
                      My Profile
                      {profile && (
                        <span className={`px-2 py-0.5 rounded text-[10px] ${profile.membership_tier === 'vip' ? 'bg-amber-100 text-amber-800' : profile.membership_tier === 'premium' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                          {tierLabel(profile.membership_tier)}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => onLogout?.().then(() => setCurrentPage('home'))}
                      className={`px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-xl active:scale-95 ${isLiveMode ? 'bg-white/20 text-white hover:bg-red-600 border border-white/30' : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'}`}
                    >
                      로그아웃
                    </button>
                  </>
                ) : !authLoading ? (
                  <>
                    <button onClick={() => setCurrentPage('login')} className={`px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl active:scale-95 border ${isLiveMode ? 'bg-transparent text-white border-white/40 hover:bg-white/20' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-red-600'}`}>
                      로그인
                    </button>
                    <button onClick={() => setCurrentPage('signup')} className={`px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl active:scale-95 ${isLiveMode ? 'bg-white text-black hover:bg-red-600' : 'bg-gray-900 text-white hover:bg-red-600 hover:bg-red-700'}`}>
                      회원가입
                    </button>
                  </>
                ) : null}
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
              {categoryNames.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setCurrentPage('category', cat)}
                  className={`text-[13px] font-bold whitespace-nowrap transition-colors ${currentPage === 'category' && activeCategory === cat ? 'text-red-600' : 'text-gray-500 hover:text-gray-900'}`}
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
                  (주)원케이션 | 대표이사: 염정원<br/>
                  글로벌 면세 물류 배송 전문 서비스<br/>
                  admin@onecation.co.kr
                </p>
              </div>
              <div className="lg:col-span-3 grid grid-cols-3 gap-10">
                <div>
                  <h4 className="font-black mb-6 text-gray-400 text-xs uppercase tracking-widest">Customer Support</h4>
                  <ul className="text-sm space-y-4 font-medium text-gray-500">
                    <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setFooterModal('notice')}>공지사항</li>
                    <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setFooterModal('faq')}>자주 묻는 질문</li>
                    <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setFooterModal('inquiry')}>1:1 문의하기</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black mb-6 text-gray-400 text-xs uppercase tracking-widest">Global Logistics</h4>
                  <ul className="text-sm space-y-4 font-medium text-gray-500">
                    <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentPage('mypage')}>배송 현황 조회</li>
                    <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setFooterModal('customs')}>통관 안내</li>
                    <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setFooterModal('countries')}>해외 배송 가능 국가</li>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              <span className="order-2 sm:order-1">© 2025 Onecation Co., Ltd. All rights reserved.</span>
              <div className="flex gap-6 sm:gap-8 order-1 sm:order-2">
                <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setFooterModal('terms')}>Terms of Service</span>
                <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setFooterModal('privacy')}>Privacy Policy</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Footer 모달 */}
      <FooterModal open={footerModal === 'notice'} title="공지사항" onClose={() => setFooterModal(null)}>
        <p className="mb-4">Yes Duty Free 공지사항을 확인하실 수 있습니다.</p>
        <ul className="space-y-3 text-gray-600">
          <li>· 서비스 점검 안내 (예정)</li>
          <li>· 배송비 정책 변경 안내</li>
          <li>· 개인정보 처리방침 개정 안내</li>
        </ul>
        <p className="mt-6 text-gray-400 text-xs">자세한 내용은 추후 업데이트됩니다.</p>
      </FooterModal>
      <FooterModal open={footerModal === 'faq'} title="자주 묻는 질문" onClose={() => setFooterModal(null)}>
        <div className="space-y-6">
          <div>
            <p className="font-bold text-gray-900 mb-1">주문은 어떻게 취소하나요?</p>
            <p>마이페이지 → 주문 내역에서 해당 주문의 상세 보기 후 취소를 요청하실 수 있습니다.</p>
          </div>
          <div>
            <p className="font-bold text-gray-900 mb-1">배송 기간은 얼마나 걸리나요?</p>
            <p>결제 완료 후 3~7 영업일 내 출고되며, 해외 배송의 경우 7~14일 소요될 수 있습니다.</p>
          </div>
          <div>
            <p className="font-bold text-gray-900 mb-1">적립금은 어떻게 사용하나요?</p>
            <p>주문서(결제) 단계에서 사용 가능 적립금을 입력하시면 결제 금액에서 차감됩니다.</p>
          </div>
        </div>
      </FooterModal>
      <FooterModal open={footerModal === 'inquiry'} title="1:1 문의하기" onClose={() => setFooterModal(null)}>
        <p className="mb-4">1:1 문의는 아래 이메일로 보내주시면 순차적으로 답변 드리겠습니다.</p>
        <p className="font-bold text-gray-900">admin@onecation.co.kr</p>
        <p className="mt-4 text-gray-500 text-xs">문의 시 주문번호, 회원 이메일을 함께 적어주시면 더 빠른 처리가 가능합니다.</p>
      </FooterModal>
      <FooterModal open={footerModal === 'customs'} title="통관 안내" onClose={() => setFooterModal(null)}>
        <p className="mb-4">해외 직구·면세 구매 시 통관 관련 안내입니다.</p>
        <ul className="space-y-2 text-gray-600">
          <li>· 개인통관고유부호(PCCC)가 필요할 수 있습니다.</li>
          <li>· 관세·부가세는 구매 금액에 따라 부과될 수 있습니다.</li>
          <li>· 수입 금지 품목은 배송이 불가할 수 있습니다.</li>
        </ul>
        <p className="mt-6 text-gray-400 text-xs">자세한 내용은 관세청 홈페이지를 참고해 주세요.</p>
      </FooterModal>
      <FooterModal open={footerModal === 'countries'} title="해외 배송 가능 국가" onClose={() => setFooterModal(null)}>
        <p className="mb-4">현재 아래 국가/지역으로 배송이 가능합니다.</p>
        <ul className="space-y-1 text-gray-600">
          <li>· 대한민국</li>
          <li>· 미국, 캐나다</li>
          <li>· 일본, 중국, 홍콩</li>
          <li>· 영국, 독일, 프랑스 등 EU 회원국</li>
          <li>· 호주, 싱가포르, 대만 등</li>
        </ul>
        <p className="mt-6 text-gray-400 text-xs">국가별 배송비·소요일은 주문 시 안내됩니다.</p>
      </FooterModal>
      <FooterModal open={footerModal === 'terms'} title="Terms of Service" onClose={() => setFooterModal(null)}>
        <p className="mb-4">Yes Duty Free 서비스 이용약관입니다.</p>
        <div className="space-y-4 text-gray-600">
          <p><strong className="text-gray-900">제1조 (목적)</strong><br/>본 약관은 (주)원케이션이 운영하는 Yes Duty Free 서비스의 이용 조건 및 절차에 관한 사항을 규정합니다.</p>
          <p><strong className="text-gray-900">제2조 (이용계약)</strong><br/>서비스 이용을 위해 회원가입 시 본 약관에 동의한 것으로 간주됩니다.</p>
          <p><strong className="text-gray-900">제3조 (서비스 이용)</strong><br/>회원은 주문, 결제, 배송 조회 등 서비스 내 제공 기능을 이용할 수 있습니다.</p>
        </div>
        <p className="mt-6 text-gray-400 text-xs">전문은 추후 업데이트됩니다.</p>
      </FooterModal>
      <FooterModal open={footerModal === 'privacy'} title="Privacy Policy" onClose={() => setFooterModal(null)}>
        <p className="mb-4">Yes Duty Free 개인정보 처리방침입니다.</p>
        <div className="space-y-4 text-gray-600">
          <p><strong className="text-gray-900">1. 수집 항목</strong><br/>이메일, 이름, 전화번호, 배송 주소 등 서비스 이용에 필요한 최소 정보를 수집합니다.</p>
          <p><strong className="text-gray-900">2. 이용 목적</strong><br/>주문·배송 처리, 회원 관리, 고객 문의 대응에 이용됩니다.</p>
          <p><strong className="text-gray-900">3. 보관 기간</strong><br/>회원 탈퇴 또는 이용 목적 달성 시까지 보관하며, 관계 법령에 따라 필요한 경우 해당 기간 동안 보관합니다.</p>
        </div>
        <p className="mt-6 text-gray-400 text-xs">전문은 추후 업데이트됩니다.</p>
      </FooterModal>
    </div>
  );
};

export default Layout;
