import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import HeroBanner from './components/HeroBanner';
import ProductCard from './components/ProductCard';
import LiveSection from './components/LiveSection';
import AdminPanel from './components/AdminPanel';
import ProductDetail from './components/ProductDetail';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import CartPage from './components/CartPage';
import ShippingAddressPage from './components/ShippingAddressPage';
import CheckoutPage from './components/CheckoutPage';
import OrderCompletePage from './components/OrderCompletePage';
import TierBenefitsModal from './components/TierBenefitsModal';
import OrderDetailModal from './components/OrderDetailModal';
import ConfirmModal from './components/ConfirmModal';
import IntroPage from './components/IntroPage';
import MainPopupModal from './components/MainPopupModal';
import NotFoundPage from './components/NotFoundPage';
import PointHistoryPage from './components/PointHistoryPage';
import InquiriesPage from './components/InquiriesPage';
import { getPopupEvents, getEvents, getEventById } from './lib/api/events';
import { isPopupDismissedToday } from './components/MainPopupModal';
import type { EventRow } from './types';
import { getLiveStreams } from './lib/api/liveStreams';

const INTRO_STORAGE_KEY = 'yes-duty-free-intro-seen';
import { useProducts, useSearchProducts } from './lib/hooks/useProducts';
import { useCategories } from './lib/hooks/useCategories';
import { useAuth } from './lib/hooks/useAuth';
import { useCart } from './lib/hooks/useCart';
import { useShippingAddresses } from './lib/hooks/useShippingAddresses';
import { useProfile } from './lib/hooks/useProfile';
import { useOrders, useOrderDetail } from './lib/hooks/useOrders';
import { useWishlist, useToggleWishlist } from './lib/hooks/useWishlist';
import { createOrder } from './lib/api/orders';
import { initPortonePayment } from './lib/api/portone';
import { checkIsAdmin } from './lib/api/admin';
import { claimCouponByCode } from './lib/api/coupons';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Product, CartItem, Coupon, Order, LiveStream } from './types';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const initialOrderNumberFromQuery = (() => {
    if (typeof window === 'undefined') return null;
    const sp = new URLSearchParams(window.location.search);
    return sp.get('order_number') || sp.get('orderNumber') || sp.get('merchant_order_ref');
  })();

  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !initialOrderNumberFromQuery && !localStorage.getItem(INTRO_STORAGE_KEY);
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => (initialOrderNumberFromQuery ? 'order_complete' : 'home'));
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [activeSubCategory, setActiveSubCategory] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [myCoupons, setMyCoupons] = useState<Coupon[]>([]);
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [orderCompleteNumber, setOrderCompleteNumber] = useState<string | null>(initialOrderNumberFromQuery);
  const [showTierBenefitsModal, setShowTierBenefitsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [confirmWishlistRemove, setConfirmWishlistRemove] = useState<Product | null>(null);
  const [liveInitialIndex, setLiveInitialIndex] = useState<number | null>(null);
  const liveScrollRef = useRef<HTMLDivElement>(null);
  const [popupEvents, setPopupEvents] = useState<EventRow[]>([]);
  const [showMainPopup, setShowMainPopup] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const [boardEventsList, setBoardEventsList] = useState<EventRow[]>([]);
  const [boardEventsLoading, setBoardEventsLoading] = useState(false);
  const [boardEventDetail, setBoardEventDetail] = useState<EventRow | null>(null);
  const [boardEventDetailLoading, setBoardEventDetailLoading] = useState(false);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [liveStreamsLoading, setLiveStreamsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { products, isLoading: productsLoading } = useProducts();
  const { products: searchResults, isLoading: searchLoading } = useSearchProducts(searchQuery);
  const { categories } = useCategories();
  const { user, signIn, signUp, signOut, session, loading: authLoading } = useAuth();
  const {
    cartId,
    items: cartItems,
    isLoading: cartLoading,
    addToCart,
    updateQuantity,
    removeItem,
    refetch: refetchCart,
    itemCount: cartItemCount,
  } = useCart(user?.id);
  const {
    addresses: shippingAddresses,
    defaultAddress,
    isLoading: addressesLoading,
    create: createAddress,
    update: updateAddress,
    remove: removeAddress,
    setDefault: setDefaultAddress,
  } = useShippingAddresses(user?.id);
  const { profile } = useProfile(user?.id);
  const { orders: myOrders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders(user?.id);
  const { order: selectedOrderDetail, isLoading: orderDetailLoading } = useOrderDetail(selectedOrderId, user?.id);
  const { wishlist } = useWishlist(user?.id);
  const { toggle: toggleWishlist, isToggling: wishlistToggling } = useToggleWishlist(user?.id);

  const wishlistPropsFor = (p: Product) =>
    user
      ? {
          isInWishlist: wishlist.some((w) => w.id === p.id),
          onToggle: (e: React.MouseEvent) => {
            e.stopPropagation();
            if (wishlist.some((w) => w.id === p.id)) {
              setConfirmWishlistRemove(p);
            } else {
              toggleWishlist(p.id);
            }
          },
          isToggling: wishlistToggling,
        }
      : undefined;

  const handleConfirmWishlistRemove = async () => {
    if (!confirmWishlistRemove) return;
    await toggleWishlist(confirmWishlistRemove.id);
    setConfirmWishlistRemove(null);
  };

  const handleCreateOrder = async (shippingAddressId: string, cartItemIds?: string[], usedPoints?: number, userCouponId?: string) => {
    if (!user?.id || !cartId) throw new Error('로그인 후 장바구니에서 주문해 주세요.');
    const isFirstOrder = (myOrders?.length ?? 0) === 0;
    const order = await createOrder(user.id, { shippingAddressId, cartId, cartItemIds, paymentMethod: 'card', usedPoints, userCouponId });
    await queryClient.invalidateQueries({ queryKey: ['cart'] });
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    if (isFirstOrder) {
      claimCouponByCode(user.id, 'FIRSTORDER5000').catch(() => {});
    }
    setOrderCompleteNumber(order.order_number);

    if (!session?.access_token) {
      throw new Error('세션 토큰을 가져올 수 없습니다.');
    }

    const { payment_url } = await initPortonePayment({
      orderId: order.id,
      frontendBaseUrl: window.location.origin,
      supabaseUserAccessToken: session.access_token,
    });

    // PortOne 결제 페이지로 이동 (성공/실패/대기 URL로 복귀)
    window.location.href = payment_url;
  };

  const handleImmediatePurchase = async (product: Product, quantity: number, options?: Record<string, string>) => {
    if (!user) {
      navigateToPage('login');
      return;
    }
    try {
      await addToCart(product, quantity, options);
      await queryClient.refetchQueries({ queryKey: ['cart'] });
      navigateToPage('cart');
    } catch (err) {
      console.error(err);
      alert('장바구니에 담기에 실패했습니다.');
    }
  };

  const formatOrderDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const KNOWN_PAGES = new Set([
    'home',
    'search',
    'live',
    'all_categories',
    'category',
    'mypage',
    'addresses',
    'login',
    'signup',
    'detail',
    'cart',
    'checkout',
    'order_complete',
    'deals',
    'best',
    'notices',
    'notice-detail',
    'events',
    'event-detail',
    'points',
    'inquiries',
  ]);
  
  const navigateToPage = (page: string, category?: string, subCategory?: string) => {
    setCurrentPage(page);
    setActiveCategory(category);
    setActiveSubCategory(subCategory);
    if (page !== 'search') setSearchQuery('');
    if (typeof window !== 'undefined' && page !== 'order_complete') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('order_number');
        url.searchParams.delete('payment_result');
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query.trim());
    setCurrentPage('search');
    setActiveCategory(undefined);
    setActiveSubCategory(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 마이페이지는 로그인한 사용자만 접근
  useEffect(() => {
    if (!authLoading && currentPage === 'mypage' && !user) {
      navigateToPage('login');
    }
  }, [authLoading, currentPage, user]);

  // 라이브 페이지 진입 시 해당 슬라이드로 스크롤
  useEffect(() => {
    if (currentPage !== 'live' || liveInitialIndex == null || !liveScrollRef.current) return;
    const el = liveScrollRef.current;
    const slideHeight = el.clientHeight;
    el.scrollTo({ top: liveInitialIndex * slideHeight, behavior: 'smooth' });
    setLiveInitialIndex(null);
  }, [currentPage, liveInitialIndex]);

  // 메인 페이지 진입 시 팝업 공지/이벤트 조회 (오늘 하루 안 보기 체크)
  useEffect(() => {
    if (currentPage !== 'home') return;
    if (isPopupDismissedToday()) return;
    getPopupEvents(locale)
      .then((list) => {
        if (list.length > 0) {
          setPopupEvents(list);
          setPopupIndex(0);
          setShowMainPopup(true);
        }
      })
      .catch(() => {});
  }, [currentPage, locale]);

  // 라이브 방송 목록 (메인 섹션 + 라이브 페이지)
  useEffect(() => {
    setLiveStreamsLoading(true);
    getLiveStreams().then(setLiveStreams).finally(() => setLiveStreamsLoading(false));
  }, []);

  // 공지사항/이벤트 게시판 목록
  useEffect(() => {
    if (currentPage === 'notices') {
      setBoardEventsLoading(true);
      getEvents({ type: 'notice', locale }).then(setBoardEventsList).finally(() => setBoardEventsLoading(false));
    } else if (currentPage === 'events') {
      setBoardEventsLoading(true);
      getEvents({ type: 'event', locale }).then(setBoardEventsList).finally(() => setBoardEventsLoading(false));
    }
  }, [currentPage, locale]);

  // 공지/이벤트 상세
  useEffect(() => {
    if ((currentPage === 'notice-detail' || currentPage === 'event-detail') && activeCategory) {
      setBoardEventDetail(null);
      setBoardEventDetailLoading(true);
      getEventById(activeCategory, locale).then((ev) => {
        setBoardEventDetail(ev ?? null);
      }).finally(() => setBoardEventDetailLoading(false));
    }
  }, [currentPage, activeCategory, locale]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { error: signInError, user: signedInUser } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message || '로그인 정보가 올바르지 않습니다.');
        return;
      }
      if (!signedInUser?.id) {
        setError('로그인에 실패했습니다.');
        return;
      }
      const isAdmin = await checkIsAdmin(signedInUser.id);
      if (isAdmin) {
        setIsAdminLoggedIn(true);
        setShowAdminLogin(false);
      } else {
        setError('관리자 계정이 아닙니다.');
        await signOut();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '관리자 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (product: Product, quantity: number, selectedOptions?: Record<string, string>) => {
    if (!user) {
      navigateToPage('login');
      return;
    }
    try {
      await addToCart(product, quantity, selectedOptions);
      navigateToPage('cart');
    } catch (err) {
      console.error(err);
      alert('장바구니 담기에 실패했습니다.');
    }
  };

  const renderHome = () => (
    <div className="space-y-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <HeroBanner />
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 md:grid-cols-8 gap-4">
         {[
            { label: '면세 에디션', icon: '🍳', color: 'bg-red-50', page: 'best' },
            { label: '글로벌 트렌드', icon: '📈', color: 'bg-blue-50', page: 'best' },
            { label: '프리주문', icon: '✈️', color: 'bg-teal-50', page: 'all_categories' },
            { label: '로컬마켓', icon: '🛍️', color: 'bg-orange-50', page: 'category', cat: '푸드' },
            { label: '라방 모아보기', icon: '📺', color: 'bg-purple-50', page: 'live' },
            { label: '메이커스', icon: '✨', color: 'bg-pink-50', page: 'all_categories' },
            { label: '멤버십 쿠폰', icon: '🎫', color: 'bg-green-50', page: 'deals' },
            { label: '한정특가', icon: '⌛', color: 'bg-amber-50', page: 'deals' }
          ].map((item, idx) => (
            <div key={idx} onClick={() => navigateToPage(item.page, item.cat)} className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-2xl group-hover:-translate-y-1 transition-all shadow-sm`}>
                {item.icon}
              </div>
              <span className="text-[12px] font-bold text-gray-700 tracking-tighter text-center leading-tight">{item.label}</span>
            </div>
          ))}
      </div>

      <LiveSection
        liveStreams={liveStreams}
        isLoading={liveStreamsLoading}
        onNavigateToLive={(index) => {
          setLiveInitialIndex(index ?? 0);
          navigateToPage('live');
        }}
      />

      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{t('home.popularTitle')}</h2>
          <button onClick={() => navigateToPage('best')} className="text-xs font-black text-gray-400 hover:text-red-600">{t('home.viewAllCta')} &gt;</button>
        </div>
        {productsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {products.map(p => (
              <div key={p.id} onClick={() => handleProductClick(p)}>
                <ProductCard product={p} wishlist={wishlistPropsFor(p)} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const handleIntroComplete = React.useCallback(() => {
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch (_) {}
    setShowIntro(false);
  }, []);

  if (showIntro) {
    return <IntroPage onComplete={handleIntroComplete} />;
  }

  if (isAdminLoggedIn) {
    return (
      <AdminPanel
        onClose={async () => {
          try {
            await signOut();
          } finally {
            setIsAdminLoggedIn(false);
          }
        }}
      />
    );
  }

  return (
    <Layout
      setCurrentPage={navigateToPage}
      currentPage={currentPage}
      products={products}
      productsLoading={productsLoading}
      activeCategory={activeCategory}
      user={user}
      profile={profile ?? undefined}
      onLogout={signOut}
      authLoading={authLoading}
      cartItemCount={cartItemCount}
      onSearchSubmit={handleSearchSubmit}
      onOpenAdminLogin={() => setShowAdminLogin(true)}
    >
      {currentPage === 'home' && renderHome()}
      {currentPage === 'search' && (
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {t('search.resultTitle')} {searchQuery && <span className="text-red-600">&quot;{searchQuery}&quot;</span>}
          </h2>
          {!searchQuery.trim() ? (
            <p className="text-gray-500 py-8">{t('search.enterQuery')}</p>
          ) : searchLoading ? (
            <p className="text-gray-400 py-8">{t('search.searching')}</p>
          ) : searchResults.length === 0 ? (
            <p className="text-gray-500 py-8">{t('search.noResults')}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
              {searchResults.map((p) => (
                <div key={p.id} onClick={() => handleProductClick(p)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleProductClick(p)}>
                  <ProductCard product={p} wishlist={user ? wishlistPropsFor(p) : undefined} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {currentPage === 'live' && (
        <div
          ref={liveScrollRef}
          className="h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-hide"
        >
          {liveStreams.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/60 px-4">
              <p className="text-lg font-bold">{t('live.noLiveNow')}</p>
              <button type="button" onClick={() => navigateToPage('home')} className="mt-4 px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20">{t('actions.goHome')}</button>
            </div>
          ) : (
            liveStreams.map((live, idx) => {
              const linkProduct = live.productId ? products.find((p) => p.id === live.productId) : null;
              return (
                <div key={live.id} className="h-full min-h-full w-full snap-start relative flex flex-col items-center justify-center bg-zinc-900 border-b border-white/5">
                  {live.thumbnail ? (
                    <img src={live.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                  {live.videoEmbedUrl && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-32">
                      <iframe
                        src={live.videoEmbedUrl}
                        title={live.title}
                        className="w-full max-w-2xl aspect-video rounded-xl bg-black shadow-2xl"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                      />
                    </div>
                  )}
                  <div className="relative z-10 w-full max-w-lg px-4 sm:px-6 flex flex-col h-full justify-end pb-28 lg:pb-24">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-red-600 overflow-hidden shrink-0 bg-gray-700">
                        <img src={`https://i.pravatar.cc/150?u=${live.id}`} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-black text-xs sm:text-sm">DutyFree Official</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shrink-0" />
                          <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{live.isLive ? 'Live Now' : live.startTime ? `예정 ${live.startTime.slice(0, 10)}` : '방송'}</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-white text-xl sm:text-2xl font-black leading-tight mb-3 sm:mb-4">{live.title}</h3>
                    <p className="text-white/60 text-xs sm:text-sm mb-6 sm:mb-10 line-clamp-2">{t('live.benefitDesc')}</p>
                    <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8">
                      <button
                        type="button"
                        onClick={() => (linkProduct ? handleProductClick(linkProduct) : products[0] && handleProductClick(products[0]))}
                        className="flex-1 min-w-0 bg-white text-black py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm hover:bg-red-600 hover:text-white transition-all"
                      >
                        {t('live.benefitCta')}
                      </button>
                    </div>
                  </div>
                  <div className="absolute right-3 sm:right-6 bottom-24 lg:bottom-40 flex flex-col gap-4 lg:gap-8 z-20">
                    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-red-600" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-white/70 tracking-widest">{live.viewerCount > 0 ? `${(live.viewerCount / 1000).toFixed(1)}k` : '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {currentPage === 'all_categories' && (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-black mb-12">{t('category.all')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((c) => (
              <div key={c.id} onClick={() => navigateToPage('category', c.id)} className="p-10 bg-white border border-gray-100 rounded-[2rem] flex flex-col items-center gap-4 cursor-pointer hover:border-red-500 hover:shadow-xl transition-all group">
                <span className="text-4xl group-hover:scale-110 transition-transform">📦</span>
                <span className="font-black text-lg">{c.name}</span>
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
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter">{categories.find((c) => c.id === activeCategory)?.name ?? activeCategory}</h2>
             </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {products
                .filter((p) => p.categoryId === activeCategory)
                .map(p => (
                  <div key={p.id} onClick={() => handleProductClick(p)}>
                    <ProductCard product={p} wishlist={wishlistPropsFor(p)} />
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {currentPage === 'mypage' && (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-center gap-10 mb-16 border-b border-gray-100 pb-16">
            <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center text-white text-3xl font-black shadow-xl">
              {(profile?.name ?? user?.email ?? 'Y').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
                {profile?.name ?? user?.email ?? t('product.member')}{t('mypage.nameSuffix')}{' '}
                <span className="text-red-600">{profile?.membership_tier === 'vip' ? 'VIP' : profile?.membership_tier === 'premium' ? 'Premium' : 'Basic'}</span>
              </h2>
              <p className="text-gray-400 font-bold mt-2">
                {profile?.membership_tier === 'vip'
                  ? '무료배송 · 3% 적립 · 전담 CS'
                  : profile?.membership_tier === 'premium'
                    ? '무료배송 · 2% 적립'
                    : '1% 적립 (월 20만원 이상 구매 시 Premium)'}
              </p>
              {profile != null && (
                <p className="text-sm font-bold text-gray-500 mt-1">적립금 {profile.points.toLocaleString()}P</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              type="button"
              onClick={() => navigateToPage('addresses')}
              className="px-6 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-red-200 hover:text-red-600 transition-all"
            >
              📍 배송지 관리
            </button>
            <button
              type="button"
              onClick={() => navigateToPage('points')}
              className="px-6 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-emerald-200 hover:text-emerald-700 transition-all"
            >
              💰 포인트 내역
            </button>
            <button
              type="button"
              onClick={() => navigateToPage('inquiries')}
              className="px-6 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
            >
              💬 1:1 문의
            </button>
            <button
              type="button"
              onClick={() => setShowTierBenefitsModal(true)}
              className="px-6 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-amber-200 hover:text-amber-700 transition-all"
            >
              🏆 등급별 혜택 보기
            </button>
          </div>
          {user && (
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden mb-8">
              <h3 className="px-6 py-4 border-b border-gray-100 text-lg font-black text-gray-900">{t('mypage.wishlistTitle')}</h3>
              {wishlist.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 text-2xl">❤️</div>
                  <p className="text-gray-400 font-bold">{t('mypage.wishlistEmpty')}</p>
                  <button type="button" onClick={() => navigateToPage('home')} className="text-sm font-bold text-red-600 hover:underline">{t('mypage.shopNow')}</button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {wishlist.map((p) => (
                      <div key={p.id} onClick={() => handleProductClick(p)}>
                        <ProductCard product={p} wishlist={wishlistPropsFor(p)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
            <h3 className="px-6 py-4 border-b border-gray-100 text-lg font-black text-gray-900">{t('mypage.orderHistory')}</h3>
            {ordersLoading ? (
              <div className="p-12 flex justify-center">
                <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ) : myOrders.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">📦</div>
                <p className="text-gray-400 font-bold">{t('mypage.noOrders')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {myOrders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(o.id)}
                      className="w-full px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">{o.order_number}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{formatOrderDate(o.created_at)} · {o.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-red-600">{o.total_amount.toLocaleString()}원</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t('mypage.viewDetail')} →</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {currentPage === 'points' && (
        <PointHistoryPage
          user={user ?? null}
          profile={profile ?? null}
          orders={myOrders}
          isLoading={ordersLoading}
          onNavigateToLogin={() => navigateToPage('login')}
          onBack={() => navigateToPage('mypage')}
        />
      )}
      {currentPage === 'inquiries' && (
        <InquiriesPage
          user={user ?? null}
          onNavigateToLogin={() => navigateToPage('login')}
          onBack={() => navigateToPage('mypage')}
        />
      )}
      {showTierBenefitsModal && <TierBenefitsModal onClose={() => setShowTierBenefitsModal(false)} />}
      {showMainPopup && popupEvents.length > 0 && popupEvents[popupIndex] && (
        <MainPopupModal
          event={popupEvents[popupIndex]}
          onClose={() => setShowMainPopup(false)}
          onDismissToday={() => setShowMainPopup(false)}
        />
      )}
      <ConfirmModal
        open={!!confirmWishlistRemove}
        title={t('product.wishlistRemoveTitle')}
        message={t('product.wishlistRemoveMessage')}
        confirmLabel={t('actions.delete')}
        cancelLabel={t('actions.cancel')}
        onConfirm={handleConfirmWishlistRemove}
        onCancel={() => setConfirmWishlistRemove(null)}
        loading={wishlistToggling}
      />
      {selectedOrderId && (
        <OrderDetailModal
          key={selectedOrderId}
          orderId={selectedOrderId}
          order={selectedOrderDetail ?? null}
          isLoading={orderDetailLoading}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
      {currentPage === 'addresses' && (
        <ShippingAddressPage
          user={user ?? null}
          addresses={shippingAddresses}
          isLoading={addressesLoading}
          onCreate={createAddress}
          onUpdate={updateAddress}
          onDelete={removeAddress}
          onSetDefault={setDefaultAddress}
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToPage={navigateToPage}
        />
      )}
      {currentPage === 'login' && (
        <LoginPage
          onSwitchToSignup={() => navigateToPage('signup')}
          onLoginSuccess={() => navigateToPage('home')}
          onSignIn={signIn}
        />
      )}
      {currentPage === 'signup' && (
        <SignupPage
          onSwitchToLogin={() => navigateToPage('login')}
          onSignupSuccess={() => navigateToPage('login')}
          onSignUp={signUp}
        />
      )}
      {currentPage === 'detail' && selectedProduct && (
        <ProductDetail 
          product={selectedProduct}
          products={products}
          onBack={() => navigateToPage('home')} 
          onAddToCart={handleAddToCart} 
          onImmediatePurchase={handleImmediatePurchase}
          onProductClick={handleProductClick}
        />
      )}
      {currentPage === 'cart' && (
        <CartPage
          user={user ?? null}
          items={cartItems}
          isLoading={cartLoading}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToPage={(page) => navigateToPage(page)}
          onProductClick={handleProductClick}
        />
      )}
      {currentPage === 'checkout' && (
        <CheckoutPage
          user={user ?? null}
          profile={profile ?? null}
          items={cartItems}
          cartId={cartId}
          addresses={shippingAddresses}
          defaultAddress={defaultAddress ?? null}
          onCreateOrder={handleCreateOrder}
          onNavigateToLogin={() => navigateToPage('login')}
          onNavigateToPage={(page) => navigateToPage(page)}
        />
      )}
      {currentPage === 'order_complete' && (
        <OrderCompletePage
          orderNumber={orderCompleteNumber}
          userId={user?.id ?? null}
          onNavigateToPage={(page) => {
            setOrderCompleteNumber(null);
            navigateToPage(page);
          }}
        />
      )}
      {currentPage === 'deals' && (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
           <h2 className="text-4xl font-black mb-4 italic tracking-tighter">SPECIAL OFFERS</h2>
           <p className="text-gray-400 font-bold mb-16">한정 수량으로 만나는 글로벌 면세 특가</p>
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(p => (
                <div key={p.id} onClick={() => handleProductClick(p)}>
                  <ProductCard product={p} wishlist={wishlistPropsFor(p)} />
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
                  <ProductCard product={p} wishlist={wishlistPropsFor(p)} />
                </div>
              ))}
           </div>
        </div>
      )}

      {currentPage === 'notices' && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-black text-gray-900 mb-8">{t('notices.title')}</h2>
          {boardEventsLoading ? (
            <div className="py-12 text-center text-gray-400 font-bold">{t('notices.loading')}</div>
          ) : boardEventsList.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold">{t('notices.empty')}</div>
          ) : (
            <ul className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {boardEventsList.map((ev) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => navigateToPage('notice-detail', ev.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-bold text-gray-900 truncate pr-4">{ev.title}</span>
                    <span className="text-sm text-gray-400 shrink-0">
                      {ev.created_at ? formatOrderDate(ev.created_at) : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {currentPage === 'notice-detail' && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <button type="button" onClick={() => navigateToPage('notices')} className="text-sm font-bold text-gray-500 hover:text-red-600 mb-6">{t('notices.backList')}</button>
          {boardEventDetailLoading ? (
            <div className="py-12 text-center text-gray-400 font-bold">{t('notices.loadingDetail')}</div>
          ) : !boardEventDetail ? (
            <div className="py-12 text-center text-gray-400 font-bold">{t('notices.notFound')}</div>
          ) : (
            <article className="prose prose-gray max-w-none">
              <h1 className="text-2xl font-black text-gray-900 mb-2">{boardEventDetail.title}</h1>
              <p className="text-sm text-gray-500 mb-6">{boardEventDetail.created_at ? formatOrderDate(boardEventDetail.created_at) : ''}</p>
              <div className="text-gray-700 whitespace-pre-wrap">{boardEventDetail.content || t('notices.noContent')}</div>
            </article>
          )}
        </div>
      )}

      {currentPage === 'events' && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-black text-gray-900 mb-8">{t('events.title')}</h2>
          {boardEventsLoading ? (
            <div className="py-12 text-center text-gray-400 font-bold">{t('events.loading')}</div>
          ) : boardEventsList.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold">{t('events.empty')}</div>
          ) : (
            <ul className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {boardEventsList.map((ev) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => navigateToPage('event-detail', ev.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-bold text-gray-900 truncate pr-4">{ev.title}</span>
                    <span className="text-sm text-gray-400 shrink-0">
                      {ev.created_at ? formatOrderDate(ev.created_at) : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {currentPage === 'event-detail' && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <button type="button" onClick={() => navigateToPage('events')} className="text-sm font-bold text-gray-500 hover:text-red-600 mb-6">{t('events.backList')}</button>
          {boardEventDetailLoading ? (
            <div className="py-12 text-center text-gray-400 font-bold">{t('notices.loadingDetail')}</div>
          ) : !boardEventDetail ? (
            <div className="py-12 text-center text-gray-400 font-bold">{t('notices.notFound')}</div>
          ) : (
            <article className="prose prose-gray max-w-none">
              <h1 className="text-2xl font-black text-gray-900 mb-2">{boardEventDetail.title}</h1>
              <p className="text-sm text-gray-500 mb-6">{boardEventDetail.created_at ? formatOrderDate(boardEventDetail.created_at) : ''}</p>
              {boardEventDetail.popup_image_url && (
                <img src={boardEventDetail.popup_image_url} alt={boardEventDetail.title} className="w-full rounded-xl mb-6 object-contain" />
              )}
              <div className="text-gray-700 whitespace-pre-wrap">{boardEventDetail.content || t('notices.noContent')}</div>
              {boardEventDetail.link_url?.trim() && (
                <a href={boardEventDetail.link_url.trim()} target="_blank" rel="noopener noreferrer" className="inline-block mt-6 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">
                  {t('actions.viewDetails')}
                </a>
              )}
            </article>
          )}
        </div>
      )}

      {!KNOWN_PAGES.has(currentPage) && (
        <NotFoundPage onGoHome={() => navigateToPage('home')} />
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
              <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black">{t('auth.login')}</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
