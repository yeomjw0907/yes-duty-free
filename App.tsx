
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
import { Product, CartItem, Coupon, Order, LiveStream, Category } from './types';

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const products = MOCK_PRODUCTS as unknown as Product[];
  const liveStreams = MOCK_LIVES as LiveStream[];
  
  const navigateToPage = (page: string, category?: string, subCategory?: string) => {
    setCurrentPage(page);
    setActiveCategory(category);
    setActiveSubCategory(subCategory);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const renderHome = () => (
    <div className="space-y-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <HeroBanner />
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 md:grid-cols-8 gap-4">
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
              <span className="text-[12px] font-bold text-gray-700 tracking-tighter text-center leading-tight">{item.label}</span>
            </div>
          ))}
      </div>

      <LiveSection />

      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">실시간 인기 면세템</h2>
          <button onClick={() => navigateToPage('best')} className="text-xs font-black text-gray-400 hover:text-red-600">View All &gt;</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map(p => (
            <div key={p.id} onClick={() => handleProductClick(p)}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  if (isAdminLoggedIn) return <AdminPanel onClose={() => setIsAdminLoggedIn(false)} />;

  return (
    <Layout onAdminClick={() => setShowAdminLogin(true)} setCurrentPage={navigateToPage} currentPage={currentPage}>
      {currentPage === 'home' && renderHome()}
      {currentPage === 'live' && (
        <div className="h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-hide">
          {liveStreams.concat(liveStreams).map((live, idx) => (
            <div key={idx} className="h-full w-full snap-start relative flex flex-col items-center justify-center bg-zinc-900 border-b border-white/5">
              <img src={live.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60" alt={live.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
              
              <div className="relative z-10 w-full max-w-lg px-6 flex flex-col h-full justify-end pb-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full border-2 border-red-600 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${live.id}`} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">DutyFree Official</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                      <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Live Now</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-white text-2xl font-black leading-tight mb-4">{live.title}</h3>
                <p className="text-white/60 text-sm mb-10 line-clamp-2">지금 바로 입장해서 글로벌 단독 특가 상품을 만나보세요. 최대 60% 할인 혜택이 쏟아집니다.</p>
                
                <div className="flex gap-4 mb-8">
                  <button onClick={() => handleProductClick(products[0])} className="flex-grow bg-white text-black py-4 rounded-2xl font-black text-sm hover:bg-red-600 hover:text-white transition-all">실시간 혜택받기</button>
                  <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 hover:bg-white/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                  </button>
                </div>
              </div>

              {/* Sidebar controls */}
              <div className="absolute right-6 bottom-40 flex flex-col gap-8 z-20">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"><svg className="w-6 h-6 fill-red-600" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></div>
                  <span className="text-[10px] font-bold text-white/70 tracking-widest">12.4k</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></div>
                  <span className="text-[10px] font-bold text-white/70 tracking-widest">840</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {currentPage === 'all_categories' && (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-black mb-12">전체 카테고리</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Added explicit string cast for navigateToPage to match its signature */}
            {Object.values(Category).map(cat => (
              <div key={cat} onClick={() => navigateToPage('category', cat as string)} className="p-10 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center gap-4 cursor-pointer hover:border-red-500 hover:shadow-xl transition-all group">
                <span className="text-4xl group-hover:scale-110 transition-transform">📦</span>
                <span className="font-black text-lg">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {currentPage === 'category' && activeCategory && (
        <div className="bg-[#fcfcfc] min-h-screen">
          <div className="bg-white pt-10 pb-16">
             <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-4 italic">Duty Free Collection</p>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter">{activeCategory}</h2>
             </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {products
                .filter(p => p.category === activeCategory)
                .map(p => (
                  <div key={p.id} onClick={() => handleProductClick(p)}>
                    <ProductCard product={p} />
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
          <div className="bg-white rounded-[2rem] border border-gray-100 p-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">📦</div>
            <p className="text-gray-400 font-bold">최근 주문 내역이 없습니다.</p>
          </div>
        </div>
      )}
      {currentPage === 'login' && <LoginPage onSwitchToSignup={() => navigateToPage('signup')} onLoginSuccess={() => navigateToPage('home')} />}
      {currentPage === 'signup' && <SignupPage onSwitchToLogin={() => navigateToPage('login')} onSignupSuccess={() => navigateToPage('login')} />}
      {currentPage === 'detail' && selectedProduct && (
        <ProductDetail 
          product={selectedProduct} 
          onBack={() => navigateToPage('home')} 
          onAddToCart={() => alert('장바구니 추가!')} 
          onImmediatePurchase={(p, q) => { setCheckoutProduct(p); setCheckoutQuantity(q); }} 
        />
      )}
      {currentPage === 'deals' && (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
           <h2 className="text-4xl font-black mb-4 italic tracking-tighter">SPECIAL OFFERS</h2>
           <p className="text-gray-400 font-bold mb-16">한정 수량으로 만나는 글로벌 면세 특가</p>
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(p => (
                <div key={p.id} onClick={() => handleProductClick(p)}>
                  <ProductCard product={p} />
                </div>
              ))}
           </div>
        </div>
      )}
      {currentPage === 'best' && (
        <div className="max-w-7xl mx-auto px-4 py-20">
           <h2 className="text-4xl font-black mb-10 italic tracking-tighter">BEST SELLERS</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {products.map(p => (
                <div key={p.id} onClick={() => handleProductClick(p)}>
                  <ProductCard product={p} />
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Admin Login Dialog */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[300] bg-gray-900/60 flex items-center justify-center p-4 backdrop-blur-xl">
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
