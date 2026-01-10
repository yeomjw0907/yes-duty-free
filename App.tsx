
import React, { useState } from 'react';
import Layout from './components/Layout';
import HeroBanner from './components/HeroBanner';
import ProductCard from './components/ProductCard';
import LiveSection from './components/LiveSection';
import AdminPanel from './components/AdminPanel';
import ProductDetail from './components/ProductDetail';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import { MOCK_PRODUCTS, MOCK_LIVES } from './constants';
import { Product, CartItem, Coupon, Order, LiveStream } from './types';

const availableCoupons: Coupon[] = [
  { id: 'c1', title: '신규 가입 10% 할인 쿠폰', discountValue: 10, isPercent: true, minOrderAmount: 50000, expiryDate: '2025-12-31' },
  { id: 'c2', title: '글로벌 배송비 무료 쿠폰', discountValue: 15000, isPercent: false, minOrderAmount: 100000, expiryDate: '2025-06-30' },
  { id: 'c3', title: '설화수 브랜드 20% 특별 쿠폰', discountValue: 20, isPercent: true, minOrderAmount: 200000, expiryDate: '2025-02-28' }
];

const App: React.FC = () => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [activeSubCategory, setActiveSubCategory] = useState<string | undefined>(undefined);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [myCoupons, setMyCoupons] = useState<Coupon[]>([]);
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [selectedCheckoutCoupon, setSelectedCheckoutCoupon] = useState<Coupon | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const products = MOCK_PRODUCTS as unknown as Product[];
  const liveStreams = MOCK_LIVES as LiveStream[];
  
  const categoryMap: Record<string, string[]> = {
    '뷰티': ['스킨케어', '메이크업', '바디케어', '향수', '헤어케어', '클렌징'],
    '패션': ['의류', '잡화', '슈즈', '액세서리', '언더웨어', '기능성 의류'],
    '럭셔리': ['명품가방', '명품지갑', '명품시계', '명품의류', '프리미엄 슈즈'],
    '테크·가전': ['생활가전', '주방가전', '스마트가전', '웨어러블', '로봇', 'App·Web', '주변기기'],
    '푸드': ['건강식품', '간편식', '디저트', '음료/주류', '신선식품'],
    '홈·리빙': ['가구', '인테리어', '침구', '주방용품', '생활용품'],
    '스포츠': ['캠핑', '골프', '러닝', '테니스', '헬스', '홈트레이닝'],
    '도서': ['베스트셀러', '자기계발', '경제/경영', '소설', '취미/실용']
  };

  const navigateToPage = (page: string, category?: string, subCategory?: string) => {
    setCurrentPage(page);
    setActiveCategory(category);
    setActiveSubCategory(subCategory);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const claimCoupon = (coupon: Coupon) => {
    if (myCoupons.some(c => c.id === coupon.id)) {
      alert('이미 보유하고 계신 쿠폰입니다.');
      return;
    }
    setMyCoupons([...myCoupons, { ...coupon, claimed: true }]);
    alert('쿠폰이 발급되었습니다! 마이페이지에서 확인 가능합니다.');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@onecation.co.kr' && password === 'admin123!') {
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
    } else {
      setError('로그인 정보가 올바르지 않습니다.');
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SubCategoryNav = ({ category, activeSub }: { category: string, activeSub?: string }) => {
    const subs = categoryMap[category] || [];
    return (
      <div className="bg-white border-b border-gray-100 sticky top-16 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex gap-8 overflow-x-auto scrollbar-hide py-4">
            <button 
              onClick={() => setActiveSubCategory(undefined)}
              className={`text-[15px] font-black whitespace-nowrap pb-1 border-b-2 transition-all ${!activeSub ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400'}`}
            >
              전체
            </button>
            {subs.map(sub => (
              <button 
                key={sub}
                onClick={() => setActiveSubCategory(sub)}
                className={`text-[15px] font-black whitespace-nowrap pb-1 border-b-2 transition-all ${activeSub === sub ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="space-y-20 pb-32 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 mt-6">
        <HeroBanner />
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 grid grid-cols-4 md:grid-cols-8 gap-4">
         {[
            { label: '면세 에디션', icon: '🍳', color: 'bg-red-50', page: 'trend_edition' },
            { label: '글로벌 트렌드', icon: '📈', color: 'bg-blue-50', page: 'trend_global' },
            { label: '프리주문', icon: '✈️', color: 'bg-teal-50', page: 'trend_pre' },
            { label: '로컬마켓', icon: '🛍️', color: 'bg-orange-50', page: 'category', cat: '푸드' },
            { label: '라방 모아보기', icon: '📺', color: 'bg-purple-50', page: 'live' },
            { label: '메이커스', icon: '✨', color: 'bg-pink-50', page: 'all_categories' },
            { label: '멤버십 쿠폰', icon: '🎫', color: 'bg-green-50', page: 'deals' },
            { label: '한정특가', icon: '⌛', color: 'bg-amber-50', page: 'trend_deal' }
          ].map((item, idx) => (
            <div key={idx} onClick={() => navigateToPage(item.page, item.cat)} className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-2xl group-hover:-translate-y-1 transition-all shadow-sm`}>
                {item.icon}
              </div>
              <span className="text-[12px] font-bold text-gray-700 tracking-tighter text-center">{item.label}</span>
            </div>
          ))}
      </div>

      <LiveSection />

      <section className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-end mb-10">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">실시간 인기 면세템</h2>
          <button onClick={() => navigateToPage('best')} className="text-xs font-black text-gray-400 hover:text-red-600 uppercase">View Best</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(p => (
            <div key={p.id} onClick={() => handleProductClick(p)}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderTrendPage = (title: string, type: 'edition' | 'global' | 'pre' | 'deal') => {
    const config = {
      edition: { bg: 'bg-red-600', sub: 'Exclusive', desc: '와디즈 X 예스 듀티프리 단독 패키지' },
      global: { bg: 'bg-blue-600', sub: 'Global Trend', desc: '전세계가 지금 주목하는 라이프스타일' },
      pre: { bg: 'bg-teal-600', sub: 'Pre-Order', desc: '출시 전 가장 빠르게 만나는 면세 혜택' },
      deal: { bg: 'bg-amber-600', sub: 'Limited Deal', desc: '마감 임박! 역대급 최저가 클리어런스' }
    }[type];

    return (
      <div className="animate-in fade-in duration-500 bg-white">
        <div className={`${config.bg} py-24 text-white text-center px-4`}>
           <p className="text-xs font-black tracking-[0.3em] uppercase opacity-70 mb-4">{config.sub}</p>
           <h1 className="text-5xl font-black tracking-tighter mb-4 italic">HELLO 2025</h1>
           <p className="text-xl font-bold opacity-90">{title}</p>
           <p className="mt-4 text-sm font-medium opacity-60">{config.desc}</p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(p => (
              <div key={p.id} onClick={() => handleProductClick(p)}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isAdminLoggedIn) return <AdminPanel onClose={() => setIsAdminLoggedIn(false)} />;

  return (
    <Layout onAdminClick={() => setShowAdminLogin(true)} setCurrentPage={navigateToPage}>
      {currentPage === 'home' && renderHome()}
      {currentPage === 'all_categories' && (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-black mb-12">전체 카테고리</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.keys(categoryMap).map(cat => (
              <div key={cat} onClick={() => navigateToPage('category', cat)} className="p-10 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center gap-4 cursor-pointer hover:border-red-500 hover:shadow-xl transition-all group">
                <span className="text-4xl group-hover:scale-110 transition-transform">📦</span>
                <span className="font-black text-lg">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {currentPage === 'category' && activeCategory && (
        <div className="bg-[#fcfcfc] min-h-screen pb-32">
          <div className="bg-white pt-16 pb-4">
             <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">{activeCategory}</h2>
                <p className="text-gray-400 font-bold mb-8">{activeCategory} 카테고리의 엄선된 면세 리스트입니다.</p>
             </div>
          </div>
          <SubCategoryNav category={activeCategory} activeSub={activeSubCategory} />
          
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
            <div className="flex justify-between items-center mb-10 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">
               <span>Filtering by: {activeSubCategory || 'All'}</span>
               <div className="flex gap-6">
                  <button className="text-gray-900 underline underline-offset-4">인기순</button>
                  <button className="hover:text-gray-900">신상품순</button>
                  <button className="hover:text-gray-900">낮은가격순</button>
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {products
                .filter(p => p.category === activeCategory)
                .filter(p => !activeSubCategory || p.subCategory === activeSubCategory)
                .map(p => (
                  <div key={p.id} onClick={() => handleProductClick(p)}>
                    <ProductCard product={p} />
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {currentPage === 'trend_edition' && renderTrendPage('면세 전용 익스클루시브', 'edition')}
      {currentPage === 'trend_global' && renderTrendPage('글로벌 트렌드 리포트', 'global')}
      {currentPage === 'trend_pre' && renderTrendPage('해외 프리오더 라인업', 'pre')}
      {currentPage === 'trend_deal' && renderTrendPage('한정 타임 딜', 'deal')}
      {currentPage === 'best' && (
        <div className="max-w-7xl mx-auto px-4 py-20">
           <h2 className="text-3xl font-black mb-10 italic">WORLD BEST SELLER</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {products.map(p => (
                <div key={p.id} onClick={() => handleProductClick(p)}>
                  <ProductCard product={p} />
                </div>
              ))}
           </div>
        </div>
      )}
      {currentPage === 'deals' && (
        <div className="max-w-7xl mx-auto px-4 py-20">
           <h2 className="text-3xl font-black mb-12">쿠폰 혜택</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {availableCoupons.map(c => (
                <div key={c.id} className="bg-red-50 p-10 rounded-[2.5rem] border-2 border-dashed border-red-200 flex justify-between items-center">
                   <div>
                      <h4 className="text-xl font-black text-red-600 mb-1">{c.title}</h4>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Expires: {c.expiryDate}</p>
                   </div>
                   <button onClick={() => claimCoupon(c)} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-600 transition-all">받기</button>
                </div>
              ))}
           </div>
        </div>
      )}
      {currentPage === 'live' && (
        <div className="bg-white min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="mb-12">
              <h2 className="text-3xl font-black flex items-center gap-3">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                라이브 방송 모아보기
              </h2>
              <p className="text-gray-400 font-bold mt-2">지금 방송 중인 생생한 쇼핑 현장</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {liveStreams.concat(liveStreams).map((live, idx) => (
                <div key={idx} className="relative group cursor-pointer overflow-hidden rounded-[2rem] aspect-[9/16] bg-gray-100 shadow-xl border border-gray-50">
                   <img src={live.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={live.title} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                   <div className="absolute top-6 left-6 flex flex-col gap-2">
                      <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full w-fit">LIVE</span>
                      <span className="bg-black/40 text-white text-[9px] px-2 py-1 rounded-md backdrop-blur-sm">{live.viewerCount.toLocaleString()}명 시청 중</span>
                   </div>
                   <div className="absolute bottom-8 left-6 right-6">
                      <h3 className="text-white font-black text-lg leading-tight mb-4">{live.title}</h3>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden"><img src={`https://i.pravatar.cc/100?u=${live.id}`} /></div>
                         <span className="text-white/70 text-xs font-bold">DutyFree Host</span>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {currentPage === 'mypage' && (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-center gap-10 mb-16 border-b border-gray-100 pb-16">
            <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl font-black shadow-xl">Y</div>
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">홍길동님 <span className="text-red-600">Premium</span></h2>
              <p className="text-gray-400 font-bold mt-2">글로벌 배송 우선권 및 단독 쿠폰 혜택 적용 중</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">MY COUPONS <span className="text-red-600 ml-2">{myCoupons.length}</span></h3>
              <div className="space-y-4">
                {myCoupons.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-red-600 font-black text-lg">{c.title}</p>
                      <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest">~ {c.expiryDate}</p>
                    </div>
                    <span className="text-2xl font-black text-gray-900">{c.isPercent ? `${c.discountValue}%` : '₩'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-8">
               <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">배송 현황</h3>
               <div className="bg-white rounded-[2rem] border border-gray-100 p-20 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">📦</div>
                  <p className="text-gray-400 font-bold">최근 주문 내역이 없습니다.</p>
               </div>
            </div>
          </div>
        </div>
      )}
      {currentPage === 'detail' && selectedProduct && (
        <ProductDetail 
          product={selectedProduct} 
          onBack={() => setCurrentPage('home')} 
          onAddToCart={() => alert('장바구니 추가!')} 
          onImmediatePurchase={(p, q) => { setCheckoutProduct(p); setCheckoutQuantity(q); }} 
        />
      )}
      {currentPage === 'login' && <LoginPage onSwitchToSignup={() => setCurrentPage('signup')} onLoginSuccess={() => setCurrentPage('home')} />}
      {currentPage === 'signup' && <SignupPage onSwitchToLogin={() => setCurrentPage('login')} onSignupSuccess={() => setCurrentPage('login')} />}
      {currentPage === 'notice' && (
        <div className="max-w-7xl mx-auto px-4 py-20">
           <h2 className="text-3xl font-black mb-10">공지사항</h2>
           <div className="border-t border-gray-900">
              {[1,2,3].map(i => (
                <div key={i} className="py-6 border-b border-gray-100 flex justify-between items-center">
                   <span className="font-bold">글로벌 배송 지역 확대 안내 ({i})</span>
                   <span className="text-gray-400 text-sm">2025.01.05</span>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full">
            <h3 className="text-2xl font-black mb-8 tracking-tighter">글로벌 주문서</h3>
            <div className="space-y-6">
              <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                <img src={checkoutProduct.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{checkoutProduct.name}</p>
                  <p className="text-xs text-gray-400">{checkoutQuantity}개 • {(checkoutProduct.price).toLocaleString()}원</p>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">보유 쿠폰 적용</label>
                <select 
                  onChange={(e) => setSelectedCheckoutCoupon(myCoupons.find(c => c.id === e.target.value) || null)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                >
                  <option value="">적용 가능한 쿠폰 선택</option>
                  {myCoupons.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">최종 결제 금액</span>
                <span className="text-2xl font-black text-red-600">{(checkoutProduct.price * checkoutQuantity).toLocaleString()}원</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button onClick={() => setCheckoutProduct(null)} className="py-4 rounded-2xl bg-gray-100 text-gray-500 font-black">취소</button>
                <button onClick={() => { setCheckoutProduct(null); setShowOrderComplete(true); }} className="py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-red-600 transition-all">결제하기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOrderComplete && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white rounded-[2rem] p-12 max-w-sm w-full text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">✅</div>
              <h3 className="text-2xl font-black mb-4">주문 완료!</h3>
              <p className="text-gray-500 font-medium mb-8">안전하게 배송해 드리겠습니다.</p>
              <button onClick={() => { setShowOrderComplete(false); navigateToPage('home'); }} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black">메인으로</button>
           </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[150] bg-gray-900/60 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black tracking-tight">System Login</h3><button onClick={() => setShowAdminLogin(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors">X</button></div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5" placeholder="admin@onecation.co.kr"/>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5" placeholder="admin123!"/>
              {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
              <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black">로그인</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
