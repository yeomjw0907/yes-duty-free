import React, { useState, useEffect, useCallback } from 'react';
import type { OrderWithItems } from '../lib/api/orders';
import {
  getAdminOrders,
  updateOrderByAdmin,
  ORDER_STATUSES,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  updateAdminProductStock,
  getAdminMembers,
  getAdminMemberDetail,
  updateMemberByAdmin,
  getAdminDashboardStats,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  getAdminReviews,
  updateAdminReviewHidden,
  type AdminProductRow,
  type AdminProductCreate,
  type AdminMemberRow,
  type AdminMemberDetail,
  type AdminDashboardStats,
  type AdminCouponRow,
  type AdminCouponCreate,
  type AdminReviewRow,
} from '../lib/api/admin';
import { getCategories } from '../lib/api/categories';
import type { CategoryRow } from '../lib/api/categories';
import {
  getAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type EventInsert,
} from '../lib/api/events';
import {
  getAdminLiveStreams,
  createLiveStream,
  updateLiveStream,
  deleteLiveStream,
  type LiveStreamInsert,
} from '../lib/api/liveStreams';
import {
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  type BannerInsert,
} from '../lib/api/banners';
import { getSearchKeywords, getSalesTrend, type DailyTrendRow } from '../lib/api/insights';
import { exportOrdersToExcel } from '../lib/exportOrdersToExcel';
import type { EventRow } from '../types';
import type { LiveStreamRow } from '../types';
import type { BannerRow } from '../types';
import { uploadProductImage, uploadDetailImage, uploadEventImage, uploadLiveThumbnail, uploadBannerImage } from '../lib/upload';

const COURIER_OPTIONS = ['', 'CJ대한통운', '한진택배', '롯데택배', 'DHL', 'FedEx', 'UPS', 'EMS'];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const orderStatusesForFilter = ['전체', '결제대기', '상품준비중', '배송대기', '배송중', '현지집하완료', '해외배송중', '통관진행중', '배송완료', '취소접수', '반품접수'];

const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [activeStatusFilter, setActiveStatusFilter] = useState('전체');
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [formByOrderId, setFormByOrderId] = useState<Record<string, { status: string; courier_company: string; tracking_number: string; admin_memo: string }>>({});
  const [bulkTrackingOpen, setBulkTrackingOpen] = useState(false);
  const [bulkTrackingText, setBulkTrackingText] = useState('');
  const [bulkTrackingLoading, setBulkTrackingLoading] = useState(false);
  const [bulkTrackingResult, setBulkTrackingResult] = useState<{ success: number; failed: { orderNumber: string; reason: string }[] } | null>(null);

  // 면세상품 관리
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryId, setProductCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [productModal, setProductModal] = useState<'add' | { type: 'edit'; product: AdminProductRow } | null>(null);
  const [productForm, setProductForm] = useState<AdminProductCreate & { id?: string; detail_html?: string | null }>({
    name: '',
    brand: '',
    price: 0,
    original_price: 0,
    image_url: '',
    category_id: null,
    stock_quantity: 0,
    is_active: true,
    detail_html: '',
  });
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [stockEdit, setStockEdit] = useState<Record<string, number>>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [detailImageUploading, setDetailImageUploading] = useState(false);
  const detailTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // 회원 관리
  const [members, setMembers] = useState<AdminMemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<AdminMemberDetail | null>(null);
  const [memberDetailLoading, setMemberDetailLoading] = useState(false);
  const [passwordModalUserId, setPasswordModalUserId] = useState<string | null>(null);
  const [withdrawConfirmUserId, setWithdrawConfirmUserId] = useState<string | null>(null);
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  // 대시보드
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // 쿠폰 관리
  const [coupons, setCoupons] = useState<AdminCouponRow[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponModal, setCouponModal] = useState<'add' | { type: 'edit'; coupon: AdminCouponRow } | null>(null);
  const [couponForm, setCouponForm] = useState<AdminCouponCreate & { id?: string }>({
    code: '',
    title: '',
    discount_type: 'fixed',
    discount_value: 0,
    min_order_amount: 0,
    max_discount_amount: null,
    valid_until: '',
    usage_limit: null,
    is_active: true,
  });
  const [savingCouponId, setSavingCouponId] = useState<string | null>(null);

  // 리뷰 관리
  const [reviewsList, setReviewsList] = useState<AdminReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilterRating, setReviewFilterRating] = useState<string>('');
  const [reviewHiddenFilter, setReviewHiddenFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);

  // 공지/이벤트 관리
  const [eventsList, setEventsList] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventModal, setEventModal] = useState<'add' | { type: 'edit'; event: EventRow } | null>(null);
  const [eventForm, setEventForm] = useState<{
    title: string;
    content: string;
    type: 'notice' | 'event';
    popup_image_url: string | null;
    link_url: string | null;
    is_popup: boolean;
    starts_at: string | null;
    ends_at: string | null;
    display_order: number;
    is_active: boolean;
  }>({
    title: '',
    content: '',
    type: 'notice',
    popup_image_url: null,
    link_url: null,
    is_popup: false,
    starts_at: null,
    ends_at: null,
    display_order: 0,
    is_active: true,
  });
  const [savingEventId, setSavingEventId] = useState<string | null>(null);
  const [eventImageUploading, setEventImageUploading] = useState(false);
  const [eventDeleteConfirmId, setEventDeleteConfirmId] = useState<string | null>(null);

  // 라이브 방송 관리
  const [liveList, setLiveList] = useState<LiveStreamRow[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveProducts, setLiveProducts] = useState<AdminProductRow[]>([]);
  const [liveModal, setLiveModal] = useState<'add' | { type: 'edit'; row: LiveStreamRow } | null>(null);
  const [liveForm, setLiveForm] = useState<{
    title: string;
    thumbnail_url: string | null;
    video_embed_url: string | null;
    product_id: string | null;
    scheduled_at: string | null;
    status: 'scheduled' | 'live' | 'ended';
    display_order: number;
    is_active: boolean;
    viewer_count: number;
  }>({
    title: '',
    thumbnail_url: null,
    video_embed_url: null,
    product_id: null,
    scheduled_at: null,
    status: 'scheduled',
    display_order: 0,
    is_active: true,
    viewer_count: 0,
  });
  const [savingLiveId, setSavingLiveId] = useState<string | null>(null);
  const [liveThumbnailUploading, setLiveThumbnailUploading] = useState(false);
  const [liveDeleteConfirmId, setLiveDeleteConfirmId] = useState<string | null>(null);

  // 배너 관리
  const [bannersList, setBannersList] = useState<BannerRow[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannerModal, setBannerModal] = useState<'add' | { type: 'edit'; row: BannerRow } | null>(null);
  const [bannerForm, setBannerForm] = useState<{
    title: string;
    subtitle: string | null;
    description: string | null;
    image_url: string;
    link_url: string | null;
    position: 'main' | 'sub';
    display_order: number;
    valid_from: string | null;
    valid_until: string | null;
    tag_text: string | null;
    is_active: boolean;
  }>({
    title: '',
    subtitle: null,
    description: null,
    image_url: '',
    link_url: null,
    position: 'main',
    display_order: 0,
    valid_from: null,
    valid_until: null,
    tag_text: null,
    is_active: true,
  });
  const [savingBannerId, setSavingBannerId] = useState<string | null>(null);
  const [bannerImageUploading, setBannerImageUploading] = useState(false);
  const [bannerDeleteConfirmId, setBannerDeleteConfirmId] = useState<string | null>(null);

  // 인사이트 관리
  const [insightsKeywords, setInsightsKeywords] = useState<{ id: string; keyword: string; search_count: number; last_searched_at: string }[]>([]);
  const [insightsKeywordsLoading, setInsightsKeywordsLoading] = useState(false);
  const [insightsTrendPeriod, setInsightsTrendPeriod] = useState<'7d' | '30d'>('7d');
  const [insightsTrendData, setInsightsTrendData] = useState<DailyTrendRow[]>([]);
  const [insightsTrendLoading, setInsightsTrendLoading] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'orders', label: '주문/해외배송 관리' },
    { id: 'products', label: '면세상품 관리' },
    { id: 'members', label: '회원 관리' },
    { id: 'notices', label: '공지/이벤트 관리' },
    { id: 'live', label: '라이브 방송 관리' },
    { id: 'banners', label: '배너 관리' },
    { id: 'insights', label: '인사이트 관리' },
    { id: 'coupons', label: '글로벌 쿠폰 관리' },
    { id: 'reviews', label: '리뷰 관리' },
  ];

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const list = await getAdminOrders(activeStatusFilter === '전체' ? null : activeStatusFilter);
      setOrders(list);
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [activeStatusFilter]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, fetchOrders]);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const list = await getAdminProducts({
        categoryId: productCategoryId || undefined,
        search: productSearch.trim() || undefined,
      });
      setProducts(list);
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [productCategoryId, productSearch]);

  const fetchCategories = useCallback(async () => {
    try {
      const list = await getCategories();
      setCategories(list);
    } catch (e) {
      console.error(e);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchCategories();
    }
  }, [activeTab, fetchProducts, fetchCategories]);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const list = await getAdminMembers(memberSearch.trim() || undefined);
      setMembers(list);
    } catch (e) {
      console.error(e);
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [memberSearch]);

  useEffect(() => {
    if (activeTab === 'members') fetchMembers();
  }, [activeTab, fetchMembers]);

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const stats = await getAdminDashboardStats();
      setDashboardStats(stats);
    } catch (e) {
      console.error(e);
      setDashboardStats(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
  }, [activeTab, fetchDashboard]);

  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const list = await getAdminCoupons();
      setCoupons(list);
    } catch (e) {
      console.error(e);
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'coupons') fetchCoupons();
  }, [activeTab, fetchCoupons]);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const list = await getAdminEvents();
      setEventsList(list);
    } catch (e) {
      console.error(e);
      setEventsList([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'notices') fetchEvents();
  }, [activeTab, fetchEvents]);

  const fetchLive = useCallback(async () => {
    setLiveLoading(true);
    try {
      const list = await getAdminLiveStreams();
      setLiveList(list);
    } catch (e) {
      console.error(e);
      setLiveList([]);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'live') {
      fetchLive();
      getAdminProducts({}).then(setLiveProducts).catch(() => setLiveProducts([]));
    }
  }, [activeTab, fetchLive]);

  const fetchBanners = useCallback(async () => {
    setBannersLoading(true);
    try {
      const list = await getAdminBanners();
      setBannersList(list);
    } catch (e) {
      console.error(e);
      setBannersList([]);
    } finally {
      setBannersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'banners') fetchBanners();
  }, [activeTab, fetchBanners]);

  const fetchInsightsKeywords = useCallback(async () => {
    setInsightsKeywordsLoading(true);
    try {
      const kw = await getSearchKeywords(50);
      setInsightsKeywords(kw);
    } catch (e) {
      console.error(e);
      setInsightsKeywords([]);
    } finally {
      setInsightsKeywordsLoading(false);
    }
  }, []);

  const fetchInsightsTrend = useCallback(async (period: '7d' | '30d') => {
    setInsightsTrendLoading(true);
    try {
      const trend = await getSalesTrend(period);
      setInsightsTrendData(trend);
    } catch (e) {
      console.error(e);
      setInsightsTrendData([]);
    } finally {
      setInsightsTrendLoading(false);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    fetchInsightsKeywords();
    fetchInsightsTrend(insightsTrendPeriod);
  }, [insightsTrendPeriod, fetchInsightsKeywords, fetchInsightsTrend]);

  useEffect(() => {
    if (activeTab === 'insights') fetchInsights();
  }, [activeTab, fetchInsights]);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const list = await getAdminReviews({
        rating: reviewFilterRating ? parseInt(reviewFilterRating, 10) : undefined,
        includeHidden: reviewHiddenFilter === 'all' ? undefined : reviewHiddenFilter === 'hidden',
      });
      setReviewsList(list);
    } catch (e) {
      console.error(e);
      setReviewsList([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewFilterRating, reviewHiddenFilter]);

  useEffect(() => {
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab, fetchReviews]);

  const handleReviewHidden = async (reviewId: string, isHidden: boolean) => {
    setReviewActionId(reviewId);
    try {
      await updateAdminReviewHidden(reviewId, isHidden);
      await fetchReviews();
    } catch (e) {
      console.error(e);
    } finally {
      setReviewActionId(null);
    }
  };

  const openAddEvent = () => {
    setEventForm({
      title: '',
      content: '',
      type: 'notice',
      popup_image_url: null,
      link_url: null,
      is_popup: false,
      starts_at: null,
      ends_at: null,
      display_order: 0,
      is_active: true,
    });
    setEventModal('add');
  };

  const openEditEvent = (ev: EventRow) => {
    setEventForm({
      title: ev.title,
      content: ev.content ?? '',
      type: ev.type,
      popup_image_url: ev.popup_image_url ?? null,
      link_url: ev.link_url ?? null,
      is_popup: ev.is_popup ?? false,
      starts_at: ev.starts_at ? ev.starts_at.slice(0, 16) : null,
      ends_at: ev.ends_at ? ev.ends_at.slice(0, 16) : null,
      display_order: ev.display_order ?? 0,
      is_active: ev.is_active ?? true,
    });
    setEventModal({ type: 'edit', event: ev });
  };

  const handleEventImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEventImageUploading(true);
    try {
      const url = await uploadEventImage(file);
      setEventForm((prev) => ({ ...prev, popup_image_url: url }));
    } catch (err) {
      console.error(err);
    } finally {
      setEventImageUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) return;
    const id = eventModal?.type === 'edit' ? eventModal.event.id : null;
    setSavingEventId(id ?? 'new');
    try {
      const payload: EventInsert = {
        title: eventForm.title.trim(),
        content: eventForm.content || undefined,
        type: eventForm.type,
        popup_image_url: eventForm.popup_image_url || null,
        link_url: eventForm.link_url?.trim() || null,
        is_popup: eventForm.is_popup,
        starts_at: eventForm.starts_at ? new Date(eventForm.starts_at).toISOString() : null,
        ends_at: eventForm.ends_at ? new Date(eventForm.ends_at).toISOString() : null,
        display_order: eventForm.display_order,
        is_active: eventForm.is_active,
      };
      if (eventModal === 'add') {
        await createEvent(payload);
      } else if (id) {
        await updateEvent(id, payload);
      }
      setEventModal(null);
      await fetchEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingEventId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEventDeleteConfirmId(null);
      await fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  const openAddLive = () => {
    setLiveForm({
      title: '',
      thumbnail_url: null,
      video_embed_url: null,
      product_id: null,
      scheduled_at: null,
      status: 'scheduled',
      display_order: 0,
      is_active: true,
      viewer_count: 0,
    });
    setLiveModal('add');
  };

  const openEditLive = (row: LiveStreamRow) => {
    setLiveForm({
      title: row.title,
      thumbnail_url: row.thumbnail_url ?? null,
      video_embed_url: row.video_embed_url ?? null,
      product_id: row.product_id ?? null,
      scheduled_at: row.scheduled_at ? row.scheduled_at.slice(0, 16) : null,
      status: row.status,
      display_order: row.display_order ?? 0,
      is_active: row.is_active ?? true,
      viewer_count: row.viewer_count ?? 0,
    });
    setLiveModal({ type: 'edit', row });
  };

  const handleLiveThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLiveThumbnailUploading(true);
    try {
      const url = await uploadLiveThumbnail(file);
      setLiveForm((prev) => ({ ...prev, thumbnail_url: url }));
    } catch (err) {
      console.error(err);
    } finally {
      setLiveThumbnailUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveLive = async () => {
    if (!liveForm.title.trim()) return;
    const id = liveModal?.type === 'edit' ? liveModal.row.id : null;
    setSavingLiveId(id ?? 'new');
    try {
      const payload: LiveStreamInsert = {
        title: liveForm.title.trim(),
        thumbnail_url: liveForm.thumbnail_url || null,
        video_embed_url: liveForm.video_embed_url?.trim() || null,
        product_id: liveForm.product_id || null,
        scheduled_at: liveForm.scheduled_at ? new Date(liveForm.scheduled_at).toISOString() : null,
        status: liveForm.status,
        display_order: liveForm.display_order,
        is_active: liveForm.is_active,
        viewer_count: liveForm.viewer_count,
      };
      if (liveModal === 'add') {
        await createLiveStream(payload);
      } else if (id) {
        await updateLiveStream(id, payload);
      }
      setLiveModal(null);
      await fetchLive();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingLiveId(null);
    }
  };

  const handleDeleteLive = async (liveId: string) => {
    try {
      await deleteLiveStream(liveId);
      setLiveDeleteConfirmId(null);
      await fetchLive();
    } catch (e) {
      console.error(e);
    }
  };

  const openAddBanner = () => {
    setBannerForm({
      title: '',
      subtitle: null,
      description: null,
      image_url: '',
      link_url: null,
      position: 'main',
      display_order: 0,
      valid_from: null,
      valid_until: null,
      tag_text: null,
      is_active: true,
    });
    setBannerModal('add');
  };

  const openEditBanner = (row: BannerRow) => {
    setBannerForm({
      title: row.title,
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      image_url: row.image_url,
      link_url: row.link_url ?? null,
      position: row.position,
      display_order: row.display_order ?? 0,
      valid_from: row.valid_from ? row.valid_from.slice(0, 16) : null,
      valid_until: row.valid_until ? row.valid_until.slice(0, 16) : null,
      tag_text: row.tag_text ?? null,
      is_active: row.is_active ?? true,
    });
    setBannerModal({ type: 'edit', row });
  };

  const handleBannerImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerImageUploading(true);
    try {
      const url = await uploadBannerImage(file);
      setBannerForm((prev) => ({ ...prev, image_url: url }));
    } catch (err) {
      console.error(err);
    } finally {
      setBannerImageUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.image_url) return;
    const id = bannerModal?.type === 'edit' ? bannerModal.row.id : null;
    setSavingBannerId(id ?? 'new');
    try {
      const payload: BannerInsert = {
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle?.trim() || null,
        description: bannerForm.description?.trim() || null,
        image_url: bannerForm.image_url,
        link_url: bannerForm.link_url?.trim() || null,
        position: bannerForm.position,
        display_order: bannerForm.display_order,
        valid_from: bannerForm.valid_from ? new Date(bannerForm.valid_from).toISOString() : null,
        valid_until: bannerForm.valid_until ? new Date(bannerForm.valid_until).toISOString() : null,
        tag_text: bannerForm.tag_text?.trim() || null,
        is_active: bannerForm.is_active,
      };
      if (bannerModal === 'add') {
        await createBanner(payload);
      } else if (id) {
        await updateBanner(id, payload);
      }
      setBannerModal(null);
      await fetchBanners();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBannerId(null);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await deleteBanner(bannerId);
      setBannerDeleteConfirmId(null);
      await fetchBanners();
    } catch (e) {
      console.error(e);
    }
  };

  const openAddCoupon = () => {
    setCouponForm({
      code: '',
      title: '',
      discount_type: 'fixed',
      discount_value: 0,
      min_order_amount: 0,
      max_discount_amount: null,
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      usage_limit: null,
      is_active: true,
    });
    setCouponModal('add');
  };

  const openEditCoupon = (coupon: AdminCouponRow) => {
    setCouponForm({
      id: coupon.id,
      code: coupon.code,
      title: coupon.title,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount,
      valid_until: coupon.valid_until.slice(0, 16),
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active,
    });
    setCouponModal({ type: 'edit', coupon });
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim() || !couponForm.title.trim() || couponForm.discount_value <= 0) return;
    const id = couponForm.id;
    setSavingCouponId(id ?? 'new');
    try {
      if (couponModal === 'add') {
        await createAdminCoupon({
          code: couponForm.code.trim().toUpperCase(),
          title: couponForm.title.trim(),
          discount_type: couponForm.discount_type,
          discount_value: couponForm.discount_value,
          min_order_amount: couponForm.min_order_amount ?? 0,
          max_discount_amount: couponForm.max_discount_amount ?? null,
          valid_until: new Date(couponForm.valid_until).toISOString(),
          usage_limit: couponForm.usage_limit ?? null,
          is_active: couponForm.is_active ?? true,
        });
      } else if (couponModal?.type === 'edit' && id) {
        await updateAdminCoupon(id, {
          title: couponForm.title.trim(),
          discount_type: couponForm.discount_type,
          discount_value: couponForm.discount_value,
          min_order_amount: couponForm.min_order_amount ?? 0,
          max_discount_amount: couponForm.max_discount_amount ?? null,
          valid_until: new Date(couponForm.valid_until).toISOString(),
          usage_limit: couponForm.usage_limit ?? null,
          is_active: couponForm.is_active,
        });
      }
      setCouponModal(null);
      await fetchCoupons();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCouponId(null);
    }
  };

  const openMemberDetail = useCallback(async (userId: string) => {
    setMemberDetailLoading(true);
    setSelectedMemberDetail(null);
    try {
      const detail = await getAdminMemberDetail(userId);
      setSelectedMemberDetail(detail ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setMemberDetailLoading(false);
    }
  }, []);

  const handleWithdrawMember = async (userId: string) => {
    setMemberActionLoading(true);
    try {
      await updateMemberByAdmin(userId, { is_active: false });
      setWithdrawConfirmUserId(null);
      setSelectedMemberDetail((prev) =>
        prev ? { ...prev, user: { ...prev.user, is_active: false } } : null
      );
      await fetchMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setMemberActionLoading(false);
    }
  };

  const getForm = (order: OrderWithItems) => {
    return formByOrderId[order.id] ?? {
      status: order.status,
      courier_company: order.courier_company ?? '',
      tracking_number: order.tracking_number ?? '',
      admin_memo: order.admin_memo ?? '',
    };
  };

  const setForm = (order: OrderWithItems, patch: Partial<{ status: string; courier_company: string; tracking_number: string; admin_memo: string }>) => {
    setFormByOrderId((prev) => {
      const base = prev[order.id] ?? {
        status: order.status,
        courier_company: order.courier_company ?? '',
        tracking_number: order.tracking_number ?? '',
        admin_memo: order.admin_memo ?? '',
      };
      return { ...prev, [order.id]: { ...base, ...patch } };
    });
  };

  const handleBulkTrackingSubmit = async () => {
    const lines = bulkTrackingText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const orderByNumber = new Map(orders.map((o) => [o.order_number.trim(), o]));
    const failed: { orderNumber: string; reason: string }[] = [];
    let success = 0;
    setBulkTrackingLoading(true);
    setBulkTrackingResult(null);
    try {
      for (const line of lines) {
        const parts = line.split(/[\t,]+/).map((s) => s.trim()).filter(Boolean);
        const orderNumber = parts[0];
        if (!orderNumber) {
          failed.push({ orderNumber: line.slice(0, 20), reason: '주문번호 없음' });
          continue;
        }
        const order = orderByNumber.get(orderNumber);
        if (!order) {
          failed.push({ orderNumber, reason: '현재 목록에 없음 (필터 확인)' });
          continue;
        }
        const courier = parts.length >= 3 ? parts[1] : null;
        const tracking = parts.length >= 2 ? (parts.length >= 3 ? parts[2] : parts[1]) : null;
        if (!tracking) {
          failed.push({ orderNumber, reason: '송장번호 없음' });
          continue;
        }
        try {
          await updateOrderByAdmin(order.id, {
            courier_company: courier || null,
            tracking_number: tracking,
          });
          success++;
        } catch (_) {
          failed.push({ orderNumber, reason: '저장 실패' });
        }
      }
      setBulkTrackingResult({ success, failed });
      await fetchOrders();
    } finally {
      setBulkTrackingLoading(false);
    }
  };

  const handleSaveLogistics = async (order: OrderWithItems) => {
    const form = getForm(order);
    setSavingOrderId(order.id);
    try {
      await updateOrderByAdmin(order.id, {
        status: form.status,
        courier_company: form.courier_company || null,
        tracking_number: form.tracking_number.trim() || null,
        admin_memo: form.admin_memo.trim() || null,
      });
      await fetchOrders();
      setFormByOrderId((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingOrderId(null);
    }
  };

  const openAddProduct = () => {
    setProductForm({
      name: '',
      brand: '',
      price: 0,
      original_price: 0,
      image_url: '',
      category_id: null,
      stock_quantity: 0,
      is_active: true,
      detail_html: '',
    });
    setProductModal('add');
    setImageError(null);
  };

  const openEditProduct = (product: AdminProductRow) => {
    setProductForm({
      name: product.name,
      brand: product.brand,
      price: product.price,
      original_price: product.original_price,
      image_url: product.image_url,
      category_id: product.category_id ?? null,
      sub_category: product.sub_category ?? null,
      tags: product.tags ?? [],
      stock_quantity: product.stock_quantity,
      is_active: product.is_active,
      id: product.id,
      detail_html: product.detail_html ?? '',
    });
    setProductModal({ type: 'edit', product });
    setImageError(null);
  };

  const handleMainImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('이미지 파일만 업로드 가능합니다 (JPG, PNG, GIF, WebP).');
      return;
    }
    setImageError(null);
    setImageUploading(true);
    try {
      const url = await uploadProductImage(file);
      setProductForm((prev) => ({ ...prev, image_url: url }));
    } catch (e) {
      console.error(e);
      setImageError('업로드에 실패했습니다. Storage 버킷 설정을 확인하세요.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleDetailImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    setDetailImageUploading(true);
    try {
      const url = await uploadDetailImage(file);
      const imgTag = `<img src="${url}" alt="" style="max-width:100%;" />`;
      setProductForm((prev) => {
        const current = prev.detail_html ?? '';
        const textarea = detailTextareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const before = current.slice(0, start);
          const after = current.slice(end);
          const next = before + imgTag + after;
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + imgTag.length, start + imgTag.length);
          }, 0);
          return { ...prev, detail_html: next };
        }
        return { ...prev, detail_html: current + imgTag };
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDetailImageUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !productForm.brand.trim() || productForm.price < 0) return;
    const id = productForm.id;
    setSavingProductId(id ?? 'new');
    try {
      if (productModal === 'add') {
        await createAdminProduct({
          name: productForm.name.trim(),
          brand: productForm.brand.trim(),
          price: productForm.price,
          original_price: productForm.original_price ?? productForm.price,
          image_url: productForm.image_url.trim() || 'https://placehold.co/400x400?text=No+Image',
          category_id: productForm.category_id || null,
          sub_category: productForm.sub_category || null,
          tags: productForm.tags,
          stock_quantity: productForm.stock_quantity ?? 0,
          is_active: productForm.is_active ?? true,
          detail_html: productForm.detail_html?.trim() || null,
        });
      } else if (productModal?.type === 'edit' && id) {
        await updateAdminProduct(id, {
          name: productForm.name.trim(),
          brand: productForm.brand.trim(),
          price: productForm.price,
          original_price: productForm.original_price ?? productForm.price,
          image_url: productForm.image_url.trim() || 'https://placehold.co/400x400?text=No+Image',
          category_id: productForm.category_id || null,
          sub_category: productForm.sub_category || null,
          tags: productForm.tags,
          stock_quantity: productForm.stock_quantity,
          is_active: productForm.is_active,
          detail_html: productForm.detail_html?.trim() || null,
        });
      }
      setProductModal(null);
      await fetchProducts();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProductId(null);
    }
  };

  const handleSaveStock = async (product: AdminProductRow) => {
    const value = stockEdit[product.id];
    if (value === undefined) return;
    setSavingProductId(product.id);
    try {
      await updateAdminProductStock(product.id, value);
      setStockEdit((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      await fetchProducts();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProductId(null);
    }
  };

  const renderOrders = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {orderStatusesForFilter.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatusFilter(status)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black transition-all ${activeStatusFilter === status ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {status}
              {status === '전체' && <span className="ml-1 opacity-50">({orders.length})</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setBulkTrackingOpen(true); setBulkTrackingResult(null); setBulkTrackingText(''); }}
            className="px-4 py-2 rounded-lg text-xs font-black bg-amber-600 text-white hover:bg-amber-700 shadow-md"
          >
            송장 일괄 등록
          </button>
          <button
            type="button"
            onClick={() => exportOrdersToExcel(orders)}
            disabled={orders.length === 0}
            className="px-4 py-2 rounded-lg text-xs font-black bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none shadow-md"
          >
            엑셀 다운로드
          </button>
        </div>
      </div>

      {bulkTrackingOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => !bulkTrackingLoading && setBulkTrackingOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-2">송장 일괄 등록</h3>
            <p className="text-xs text-gray-500 mb-4">한 줄에 하나씩 입력. 구분: 탭 또는 쉼표. (주문번호, 택배사, 송장번호) 또는 (주문번호, 송장번호)</p>
            <textarea
              value={bulkTrackingText}
              onChange={(e) => setBulkTrackingText(e.target.value)}
              placeholder={'주문번호\t택배사\t송장번호\n예: ORD-2025-001  CJ대한통운  1234567890'}
              rows={8}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono resize-y"
              disabled={bulkTrackingLoading}
            />
            {bulkTrackingResult && (
              <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm">
                <p className="font-black text-gray-900">적용 결과</p>
                <p className="text-green-600 font-bold mt-1">성공 {bulkTrackingResult.success}건</p>
                {bulkTrackingResult.failed.length > 0 && (
                  <>
                    <p className="text-red-600 font-bold mt-2">실패 {bulkTrackingResult.failed.length}건</p>
                    <ul className="mt-2 space-y-1 text-gray-700">
                      {bulkTrackingResult.failed.map((f, i) => (
                        <li key={i} className="text-xs"><span className="font-mono font-bold">{f.orderNumber}</span> — {f.reason}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleBulkTrackingSubmit}
                disabled={bulkTrackingLoading || !bulkTrackingText.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-black bg-gray-900 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {bulkTrackingLoading ? '적용 중…' : '적용'}
              </button>
              <button
                type="button"
                onClick={() => setBulkTrackingOpen(false)}
                disabled={bulkTrackingLoading}
                className="px-6 py-3 rounded-xl text-sm font-black border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-2">주문/계정 정보</div>
          <div className="col-span-3 text-center">면세 품목 · 수량</div>
          <div className="col-span-2 text-center">물류 · 메모</div>
          <div className="col-span-2 text-center">결제 정보</div>
          <div className="col-span-3 text-center">배송지 · 메모</div>
        </div>

        {ordersLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">주문 목록 불러오는 중…</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">해당 조건의 주문이 없습니다.</div>
        ) : (
          orders.map((order) => {
            const form = getForm(order);
            const items = order.order_items ?? [];
            return (
              <div key={order.id} className="grid grid-cols-12 p-6 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <div className="col-span-2 space-y-2">
                  <span className="font-black text-sm tracking-tighter text-gray-900">{order.order_number}</span>
                  <p className="text-[11px] text-gray-400 font-bold">{formatDate(order.created_at)}</p>
                  <p className="font-black text-xs text-gray-700">{order.recipient_name}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{order.recipient_phone}</p>
                </div>

                <div className="col-span-3 border-x border-gray-100 px-4 space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-2 py-1">
                      {item.product_image_url && (
                        <img src={item.product_image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-gray-800 leading-tight line-clamp-2">{item.product_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{item.product_brand}</p>
                        <p className="text-[11px] text-gray-600">{item.quantity}개 × {item.price.toLocaleString()}원</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="col-span-2 px-4 space-y-2">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">상태</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(order, { status: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:border-red-500 outline-none"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">택배사</label>
                    <select
                      value={form.courier_company}
                      onChange={(e) => setForm(order, { courier_company: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:border-red-500 outline-none"
                    >
                      {COURIER_OPTIONS.map((c) => (
                        <option key={c || 'empty'} value={c}>{c || '-'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">송장번호</label>
                    <input
                      type="text"
                      value={form.tracking_number}
                      onChange={(e) => setForm(order, { tracking_number: e.target.value })}
                      placeholder="Waybill No."
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">관리자 메모</label>
                    <input
                      type="text"
                      value={form.admin_memo}
                      onChange={(e) => setForm(order, { admin_memo: e.target.value })}
                      placeholder="내부 메모"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveLogistics(order)}
                    disabled={savingOrderId === order.id}
                    className="w-full bg-gray-900 text-white py-1.5 rounded-lg text-[10px] font-black hover:bg-red-600 transition-colors uppercase tracking-widest disabled:opacity-50"
                  >
                    {savingOrderId === order.id ? '저장 중…' : '저장'}
                  </button>
                </div>

                <div className="col-span-2 border-x border-gray-100 px-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-red-500 uppercase">총 결제</span>
                    <span className="text-sm font-black text-red-600">{order.total_amount.toLocaleString()}원</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">상품 {order.subtotal.toLocaleString()}원</p>
                  {order.shipping_fee > 0 && <p className="text-[10px] text-gray-500 font-bold">배송비 {order.shipping_fee.toLocaleString()}원</p>}
                  <p className="text-[10px] text-blue-600 font-bold mt-1">{order.payment_method}</p>
                </div>

                <div className="col-span-3 px-4">
                  <p className="font-black text-xs text-gray-900">{order.recipient_name}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed break-words mt-0.5">{order.shipping_address}</p>
                  {order.delivery_memo && (
                    <div className="bg-gray-50 p-2 rounded-lg mt-2 border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">배송 메모</p>
                      <p className="text-[11px] font-bold text-gray-700 leading-tight">{order.delivery_memo}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="상품명·브랜드 검색"
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 w-56"
          />
          <select
            value={productCategoryId}
            onChange={(e) => setProductCategoryId(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">전체 카테고리</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchProducts}
            className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-black hover:bg-red-600 transition-colors"
          >
            검색
          </button>
        </div>
        <button
          type="button"
          onClick={openAddProduct}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-black hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
        >
          + 상품 등록
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-1">이미지</div>
          <div className="col-span-2">상품명 · 브랜드</div>
          <div className="col-span-1 text-center">카테고리</div>
          <div className="col-span-2 text-right">가격 · 할인</div>
          <div className="col-span-1 text-center">재고</div>
          <div className="col-span-1 text-center">판매</div>
          <div className="col-span-1 text-center">노출</div>
          <div className="col-span-3 text-center">관리</div>
        </div>

        {productsLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">상품 목록 불러오는 중…</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">등록된 상품이 없거나 검색 결과가 없습니다.</div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="grid grid-cols-12 p-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors items-center">
              <div className="col-span-1">
                <img src={p.image_url || 'https://placehold.co/80x80?text=No'} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100" />
              </div>
              <div className="col-span-2 min-w-0">
                <p className="text-sm font-black text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-500 font-bold">{p.brand}</p>
              </div>
              <div className="col-span-1 text-center text-xs font-bold text-gray-600">{p.categories?.name ?? '-'}</div>
              <div className="col-span-2 text-right">
                <p className="text-sm font-black text-gray-900">{p.price.toLocaleString()}원</p>
                {p.discount != null && p.discount > 0 && (
                  <p className="text-[10px] text-red-500 font-bold">{p.discount}% 할인</p>
                )}
              </div>
              <div className="col-span-1 flex items-center justify-center gap-1 flex-wrap">
                {stockEdit[p.id] !== undefined ? (
                  <>
                    <input
                      type="number"
                      min={0}
                      value={stockEdit[p.id]}
                      onChange={(e) => setStockEdit((prev) => ({ ...prev, [p.id]: parseInt(e.target.value, 10) || 0 }))}
                      className="w-14 bg-white border border-gray-200 rounded px-2 py-1 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveStock(p)}
                      disabled={savingProductId === p.id}
                      className="text-[10px] font-black text-red-600 hover:underline disabled:opacity-50"
                    >
                      {savingProductId === p.id ? '…' : '저장'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockEdit((prev) => { const n = { ...prev }; delete n[p.id]; return n; })}
                      className="text-[10px] font-black text-gray-400 hover:underline"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold text-gray-700">{p.stock_quantity}</span>
                    <button
                      type="button"
                      onClick={() => setStockEdit((prev) => ({ ...prev, [p.id]: p.stock_quantity }))}
                      className="text-[10px] font-black text-gray-400 hover:text-red-600"
                    >
                      수정
                    </button>
                  </>
                )}
              </div>
              <div className="col-span-1 text-center text-sm font-bold text-gray-600">{p.sold_count}</div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-black ${p.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  {p.is_active ? '노출' : '비노출'}
                </span>
              </div>
              <div className="col-span-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditProduct(p)}
                  className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-red-600"
                >
                  수정
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {productModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setProductModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-4">
              {productModal === 'add' ? '상품 등록' : '상품 수정'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">상품명</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">브랜드</label>
                <input
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, brand: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">판매가(원)</label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, price: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">정가(원)</label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.original_price ?? productForm.price ?? ''}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, original_price: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">대표 이미지</label>
                <p className="text-[10px] text-gray-500 font-bold mb-2">권장: 800×800px (1:1 비율), JPG/PNG/WebP</p>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    imageUploading ? 'border-gray-200 bg-gray-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50/30'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const f = e.dataTransfer.files[0];
                    if (f) handleMainImageFile(f);
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    id="product-main-image"
                    disabled={imageUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMainImageFile(f);
                      e.target.value = '';
                    }}
                  />
                  {productForm.image_url ? (
                    <div className="space-y-2">
                      <img src={productForm.image_url} alt="" className="w-32 h-32 object-cover rounded-lg mx-auto bg-gray-100" />
                      <label htmlFor="product-main-image" className="inline-block text-xs font-black text-red-600 cursor-pointer hover:underline">
                        이미지 변경
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="product-main-image" className="cursor-pointer block">
                      <span className="text-4xl text-gray-300 block mb-2">📷</span>
                      <span className="text-sm font-bold text-gray-500 block">
                        {imageUploading ? '업로드 중…' : '클릭하거나 이미지를 여기에 드래그'}
                      </span>
                    </label>
                  )}
                </div>
                {imageError && <p className="text-xs text-red-600 font-bold mt-1">{imageError}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">카테고리</label>
                <select
                  value={productForm.category_id ?? ''}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, category_id: e.target.value || null }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                >
                  <option value="">선택 안 함</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">재고</label>
                <input
                  type="number"
                  min={0}
                  value={productForm.stock_quantity ?? 0}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, stock_quantity: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="product-is-active"
                  checked={productForm.is_active ?? true}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="product-is-active" className="text-sm font-bold text-gray-700">노출 (사이트에 표시)</label>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">상세 페이지 (상품 상세 내용)</label>
                <p className="text-[10px] text-gray-500 font-bold mb-2">HTML 입력 가능. 아래 &quot;이미지 추가&quot;로 업로드하면 자동 삽입됩니다.</p>
                <div className="flex gap-2 mb-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-xs font-black text-gray-700 cursor-pointer hover:bg-gray-200 disabled:opacity-50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={detailImageUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleDetailImageFile(f);
                        e.target.value = '';
                      }}
                    />
                    {detailImageUploading ? '업로드 중…' : '📷 이미지 추가'}
                  </label>
                </div>
                <textarea
                  ref={detailTextareaRef}
                  value={productForm.detail_html ?? ''}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, detail_html: e.target.value }))}
                  placeholder="<p>상품 설명</p> 또는 일반 텍스트 입력..."
                  rows={10}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-red-500 outline-none resize-y"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={savingProductId !== null}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-black hover:bg-red-600 disabled:opacity-50"
              >
                {savingProductId ? '저장 중…' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => setProductModal(null)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMembers = () => (
    <div className="flex gap-6 h-full">
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex gap-3 bg-white p-4 rounded-xl border border-gray-200">
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="이메일·이름·전화번호 검색"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="button"
            onClick={fetchMembers}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-black hover:bg-red-600"
          >
            검색
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-1 min-h-0">
          <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-3 uppercase tracking-wider">
            <div className="col-span-3">이메일</div>
            <div className="col-span-2">이름</div>
            <div className="col-span-2">등급</div>
            <div className="col-span-1 text-right">포인트</div>
            <div className="col-span-2 text-center">가입일</div>
            <div className="col-span-2 text-center">상태</div>
          </div>
          {membersLoading ? (
            <div className="p-8 text-center text-gray-400 font-bold">회원 목록 불러오는 중…</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-bold">검색 결과가 없습니다.</div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
              {members.map((m) => (
                <div
                  key={m.id}
                  onClick={() => openMemberDetail(m.id)}
                  className={`grid grid-cols-12 p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedMemberDetail?.user.id === m.id ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
                >
                  <div className="col-span-3 truncate text-sm font-bold text-gray-900">{m.email}</div>
                  <div className="col-span-2 truncate text-sm text-gray-700">{m.name}</div>
                  <div className="col-span-2 text-xs font-bold text-gray-600">{m.membership_tier}</div>
                  <div className="col-span-1 text-right text-sm font-bold text-gray-700">{m.points}</div>
                  <div className="col-span-2 text-center text-xs text-gray-500">{formatDate(m.created_at)}</div>
                  <div className="col-span-2 text-center">
                    <span className={`text-xs font-black ${m.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {m.is_active ? '활동' : '탈퇴'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-[480px] shrink-0 flex flex-col gap-4 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {!selectedMemberDetail ? (
          <div className="p-10 text-center text-gray-400 font-bold">
            {memberDetailLoading ? '회원 정보 불러오는 중…' : '회원을 선택하면 주문 내역을 볼 수 있습니다.'}
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="text-lg font-black text-gray-900">{selectedMemberDetail.user.name}</h3>
                  <p className="text-sm text-gray-600 font-bold mt-0.5">{selectedMemberDetail.user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedMemberDetail.user.phone || '-'}</p>
                  <p className="text-xs font-bold text-gray-600 mt-2">
                    등급 {selectedMemberDetail.user.membership_tier} · 포인트 {selectedMemberDetail.user.points}P
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    가입 {formatDate(selectedMemberDetail.user.created_at)}
                    {selectedMemberDetail.user.last_login_at && ` · 최근 로그인 ${formatDate(selectedMemberDetail.user.last_login_at)}`}
                  </p>
                </div>
                <span className={`text-xs font-black px-2 py-1 rounded ${selectedMemberDetail.user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {selectedMemberDetail.user.is_active ? '활동' : '탈퇴'}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setPasswordModalUserId(selectedMemberDetail.user.id)}
                  className="px-3 py-2 rounded-lg text-xs font-black bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  비밀번호 재설정
                </button>
                {selectedMemberDetail.user.is_active && (
                  <button
                    type="button"
                    onClick={() => setWithdrawConfirmUserId(selectedMemberDetail.user.id)}
                    className="px-3 py-2 rounded-lg text-xs font-black bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    회원 탈퇴 처리
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <h4 className="text-xs font-black text-gray-400 uppercase mb-3">주문 내역</h4>
              {selectedMemberDetail.orders.length === 0 ? (
                <p className="text-sm text-gray-500 font-bold">주문 내역이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {selectedMemberDetail.orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-sm text-gray-900">{order.order_number}</span>
                        <span className="text-xs font-black text-red-600">{order.status}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-2">{formatDate(order.created_at)} · 총 {order.total_amount.toLocaleString()}원</p>
                      <ul className="space-y-1.5">
                        {(order.order_items ?? []).map((item) => (
                          <li key={item.id} className="flex gap-2 text-xs">
                            {item.product_image_url && (
                              <img src={item.product_image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 truncate">{item.product_name}</p>
                              <p className="text-gray-500">{item.quantity}개 × {item.price.toLocaleString()}원 · {order.status}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {passwordModalUserId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setPasswordModalUserId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-2">비밀번호 재설정</h3>
            {selectedMemberDetail?.user.id === passwordModalUserId && (
              <p className="text-xs font-bold text-gray-500 mb-2">회원: {selectedMemberDetail.user.email}</p>
            )}
            <p className="text-sm text-gray-600 mb-4">
              회원 비밀번호는 Supabase Auth에서만 변경 가능합니다. Supabase 대시보드에서 아래 순서로 진행하세요.
            </p>
            <ol className="text-sm text-gray-700 list-decimal list-inside space-y-2 mb-6">
              <li>Supabase 대시보드 로그인</li>
              <li>Authentication → Users 메뉴</li>
              <li>해당 회원 이메일로 사용자 찾기</li>
              <li>사용자 행의 ⋮ 메뉴 → &quot;Send password recovery&quot; 또는 직접 비밀번호 수정</li>
            </ol>
            <button
              type="button"
              onClick={() => setPasswordModalUserId(null)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-black hover:bg-red-600"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {withdrawConfirmUserId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => !memberActionLoading && setWithdrawConfirmUserId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-2">회원 탈퇴 처리</h3>
            <p className="text-sm text-gray-600 mb-6">이 회원을 탈퇴 처리하시겠습니까? (비활성화 후 로그인이 제한됩니다)</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleWithdrawMember(withdrawConfirmUserId)}
                disabled={memberActionLoading}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-black hover:bg-red-700 disabled:opacity-50"
              >
                {memberActionLoading ? '처리 중…' : '탈퇴 처리'}
              </button>
              <button
                type="button"
                onClick={() => setWithdrawConfirmUserId(null)}
                disabled={memberActionLoading}
                className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="flex flex-col gap-8">
      {dashboardLoading ? (
        <div className="p-12 text-center text-gray-400 font-bold">통계 불러오는 중…</div>
      ) : dashboardStats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">오늘</p>
              <p className="text-2xl font-black text-gray-900">{dashboardStats.todayOrders}건</p>
              <p className="text-lg font-bold text-red-600 mt-1">{dashboardStats.todayRevenue.toLocaleString()}원</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">이번 주 (7일)</p>
              <p className="text-2xl font-black text-gray-900">{dashboardStats.weekOrders}건</p>
              <p className="text-lg font-bold text-red-600 mt-1">{dashboardStats.weekRevenue.toLocaleString()}원</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">이번 달</p>
              <p className="text-2xl font-black text-gray-900">{dashboardStats.monthOrders}건</p>
              <p className="text-lg font-bold text-red-600 mt-1">{dashboardStats.monthRevenue.toLocaleString()}원</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h4 className="text-sm font-black text-gray-400 uppercase mb-4">상태별 주문</h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(dashboardStats.statusCounts).map(([status, count]) => (
                <span key={status} className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-bold text-gray-700">
                  {status} <span className="text-red-600">{count}</span>건
                </span>
              ))}
              {Object.keys(dashboardStats.statusCounts).length === 0 && (
                <p className="text-gray-500 font-bold">주문 없음</p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <h4 className="text-sm font-black text-gray-400 uppercase p-6 pb-0">최근 주문</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase p-4">
                    <th className="p-4">주문번호</th>
                    <th className="p-4">일시</th>
                    <th className="p-4">상태</th>
                    <th className="p-4 text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboardStats.recentOrders ?? []).map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 font-bold text-gray-900">{o.order_number}</td>
                      <td className="p-4 text-sm text-gray-600">{formatDate(o.created_at)}</td>
                      <td className="p-4 text-xs font-bold text-red-600">{o.status}</td>
                      <td className="p-4 text-right font-bold text-gray-900">{Number(o.total_amount ?? 0).toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!dashboardStats.recentOrders || dashboardStats.recentOrders.length === 0) && (
              <p className="p-8 text-center text-gray-500 font-bold">최근 주문 없음</p>
            )}
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-gray-400 font-bold">통계를 불러올 수 없습니다.</div>
      )}
    </div>
  );

  const renderCoupons = () => (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAddCoupon}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-black hover:bg-red-700 shadow-lg shadow-red-500/20"
        >
          + 쿠폰 생성
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-2">코드</div>
          <div className="col-span-3">제목</div>
          <div className="col-span-2 text-center">할인</div>
          <div className="col-span-1 text-right">최소주문</div>
          <div className="col-span-2 text-center">유효기간</div>
          <div className="col-span-1 text-center">사용</div>
          <div className="col-span-1 text-center">상태</div>
          <div className="col-span-1 text-center">관리</div>
        </div>
        {couponsLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">쿠폰 목록 불러오는 중…</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">등록된 쿠폰이 없습니다.</div>
        ) : (
          coupons.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-12 p-4 border-b border-gray-100 hover:bg-gray-50/50 items-center"
            >
              <div className="col-span-2 font-mono font-bold text-gray-900">{c.code}</div>
              <div className="col-span-3 text-sm text-gray-800 truncate">{c.title}</div>
              <div className="col-span-2 text-center text-sm font-bold">
                {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.discount_value.toLocaleString()}원`}
                {c.max_discount_amount != null && c.discount_type === 'percent' && (
                  <span className="block text-[10px] text-gray-500">최대 {c.max_discount_amount.toLocaleString()}원</span>
                )}
              </div>
              <div className="col-span-1 text-right text-xs font-bold text-gray-600">{c.min_order_amount.toLocaleString()}원</div>
              <div className="col-span-2 text-center text-xs text-gray-500">{formatDate(c.valid_until)}</div>
              <div className="col-span-1 text-center text-xs font-bold text-gray-600">{c.used_count}{c.usage_limit != null ? `/${c.usage_limit}` : ''}</div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-black ${c.is_active ? 'text-green-600' : 'text-gray-400'}`}>{c.is_active ? '활성' : '비활성'}</span>
              </div>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => openEditCoupon(c)}
                  className="text-xs font-black text-red-600 hover:underline"
                >
                  수정
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {couponModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setCouponModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-4">{couponModal === 'add' ? '쿠폰 생성' : '쿠폰 수정'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">쿠폰 코드</label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="WELCOME3000"
                  disabled={couponModal !== 'add'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono font-bold disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">제목</label>
                <input
                  type="text"
                  value={couponForm.title}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">할인 유형</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm((prev) => ({ ...prev, discount_type: e.target.value as 'percent' | 'fixed' }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  >
                    <option value="fixed">정액</option>
                    <option value="percent">정률</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">할인값</label>
                  <input
                    type="number"
                    min={1}
                    value={couponForm.discount_value || ''}
                    onChange={(e) => setCouponForm((prev) => ({ ...prev, discount_value: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                  <span className="text-[10px] text-gray-500">{couponForm.discount_type === 'percent' ? '%' : '원'}</span>
                </div>
              </div>
              {couponForm.discount_type === 'percent' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">최대 할인금액 (원, 선택)</label>
                  <input
                    type="number"
                    min={0}
                    value={couponForm.max_discount_amount ?? ''}
                    onChange={(e) => setCouponForm((prev) => ({ ...prev, max_discount_amount: e.target.value === '' ? null : parseInt(e.target.value, 10) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">최소 주문금액 (원)</label>
                <input
                  type="number"
                  min={0}
                  value={couponForm.min_order_amount ?? 0}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, min_order_amount: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">유효기간</label>
                <input
                  type="datetime-local"
                  value={couponForm.valid_until?.slice(0, 16) ?? ''}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, valid_until: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">사용 한도 (건, 비워두면 무제한)</label>
                <input
                  type="number"
                  min={0}
                  value={couponForm.usage_limit ?? ''}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, usage_limit: e.target.value === '' ? null : parseInt(e.target.value, 10) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="coupon-is-active"
                  checked={couponForm.is_active ?? true}
                  onChange={(e) => setCouponForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="coupon-is-active" className="text-sm font-bold text-gray-700">활성 (사용 가능)</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleSaveCoupon}
                disabled={savingCouponId !== null}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-black hover:bg-red-600 disabled:opacity-50"
              >
                {savingCouponId ? '저장 중…' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => setCouponModal(null)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotices = () => (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAddEvent}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-black hover:bg-red-700 shadow-lg shadow-red-500/20"
        >
          + 공지/이벤트 등록
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-1">유형</div>
          <div className="col-span-3">제목</div>
          <div className="col-span-2 text-center">기간</div>
          <div className="col-span-1 text-center">팝업</div>
          <div className="col-span-1 text-center">노출</div>
          <div className="col-span-1 text-center">순서</div>
          <div className="col-span-3 text-right">관리</div>
        </div>
        {eventsLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">목록 불러오는 중…</div>
        ) : eventsList.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">등록된 공지/이벤트가 없습니다.</div>
        ) : (
          eventsList.map((ev) => (
            <div
              key={ev.id}
              className="grid grid-cols-12 p-4 border-b border-gray-100 hover:bg-gray-50/50 items-center"
            >
              <div className="col-span-1">
                <span className={`text-xs font-black ${ev.type === 'event' ? 'text-amber-600' : 'text-gray-700'}`}>
                  {ev.type === 'event' ? '이벤트' : '공지'}
                </span>
              </div>
              <div className="col-span-3 text-sm text-gray-800 truncate">{ev.title}</div>
              <div className="col-span-2 text-center text-xs text-gray-500">
                {ev.starts_at ? formatDate(ev.starts_at).slice(0, 10) : '-'} ~ {ev.ends_at ? formatDate(ev.ends_at).slice(0, 10) : '-'}
              </div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-black ${ev.is_popup ? 'text-red-600' : 'text-gray-400'}`}>{ev.is_popup ? 'Y' : '-'}</span>
              </div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-black ${ev.is_active ? 'text-green-600' : 'text-gray-400'}`}>{ev.is_active ? 'Y' : 'N'}</span>
              </div>
              <div className="col-span-1 text-center text-xs font-bold text-gray-600">{ev.display_order}</div>
              <div className="col-span-3 text-right flex justify-end gap-2">
                <button type="button" onClick={() => openEditEvent(ev)} className="text-xs font-black text-red-600 hover:underline">수정</button>
                {eventDeleteConfirmId === ev.id ? (
                  <>
                    <span className="text-xs text-gray-500">삭제할까요?</span>
                    <button type="button" onClick={() => handleDeleteEvent(ev.id)} className="text-xs font-black text-red-600">확인</button>
                    <button type="button" onClick={() => setEventDeleteConfirmId(null)} className="text-xs font-bold text-gray-500">취소</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setEventDeleteConfirmId(ev.id)} className="text-xs font-bold text-gray-500 hover:underline">삭제</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {eventModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setEventModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-4">{eventModal === 'add' ? '공지/이벤트 등록' : '공지/이벤트 수정'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">유형</label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, type: e.target.value as 'notice' | 'event' }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                >
                  <option value="notice">공지사항</option>
                  <option value="event">이벤트</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">제목</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="제목"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">본문 (선택)</label>
                <textarea
                  value={eventForm.content}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  placeholder="게시판 상세에 표시할 내용"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">메인 팝업 이미지 (파일 업로드)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEventImageSelect}
                    disabled={eventImageUploading}
                    className="text-sm"
                  />
                  {eventImageUploading && <span className="text-xs text-gray-500">업로드 중…</span>}
                </div>
                {eventForm.popup_image_url && (
                  <div className="mt-2">
                    <img src={eventForm.popup_image_url} alt="팝업 미리보기" className="max-h-32 rounded-lg border border-gray-200 object-contain" />
                    <button type="button" onClick={() => setEventForm((prev) => ({ ...prev, popup_image_url: null }))} className="mt-1 text-xs text-red-600 font-bold">이미지 제거</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">클릭 시 이동 URL (도메인/링크)</label>
                <input
                  type="url"
                  value={eventForm.link_url ?? ''}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, link_url: e.target.value.trim() || null }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="event-is-popup"
                  checked={eventForm.is_popup}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, is_popup: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="event-is-popup" className="text-sm font-bold text-gray-700">메인 페이지 팝업으로 노출</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">노출 시작일시</label>
                  <input
                    type="datetime-local"
                    value={eventForm.starts_at ?? ''}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, starts_at: e.target.value || null }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">노출 종료일시</label>
                  <input
                    type="datetime-local"
                    value={eventForm.ends_at ?? ''}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, ends_at: e.target.value || null }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">표시 순서 (숫자 작을수록 먼저)</label>
                  <input
                    type="number"
                    min={0}
                    value={eventForm.display_order}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, display_order: parseInt(e.target.value, 10) || 0 }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="event-is-active"
                    checked={eventForm.is_active}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="event-is-active" className="text-sm font-bold text-gray-700">노출 활성</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleSaveEvent}
                disabled={savingEventId !== null}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-black hover:bg-red-600 disabled:opacity-50"
              >
                {savingEventId ? '저장 중…' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => setEventModal(null)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLive = () => (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAddLive}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-black hover:bg-red-700 shadow-lg shadow-red-500/20"
        >
          + 라이브 등록
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-1">썸네일</div>
          <div className="col-span-3">제목</div>
          <div className="col-span-1 text-center">상태</div>
          <div className="col-span-2 text-center">예정일</div>
          <div className="col-span-1 text-center">순서</div>
          <div className="col-span-1 text-center">노출</div>
          <div className="col-span-3 text-right">관리</div>
        </div>
        {liveLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">목록 불러오는 중…</div>
        ) : liveList.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">등록된 라이브가 없습니다.</div>
        ) : (
          liveList.map((row) => (
            <div key={row.id} className="grid grid-cols-12 p-4 border-b border-gray-100 hover:bg-gray-50/50 items-center">
              <div className="col-span-1">
                {row.thumbnail_url ? (
                  <img src={row.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">없음</div>
                )}
              </div>
              <div className="col-span-3 text-sm text-gray-800 truncate">{row.title}</div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-black ${
                  row.status === 'live' ? 'text-red-600' : row.status === 'ended' ? 'text-gray-500' : 'text-amber-600'
                }`}>
                  {row.status === 'live' ? '진행중' : row.status === 'ended' ? '종료' : '예정'}
                </span>
              </div>
              <div className="col-span-2 text-center text-xs text-gray-500">
                {row.scheduled_at ? formatDate(row.scheduled_at) : '-'}
              </div>
              <div className="col-span-1 text-center text-xs font-bold text-gray-600">{row.display_order}</div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-black ${row.is_active ? 'text-green-600' : 'text-gray-400'}`}>{row.is_active ? 'Y' : 'N'}</span>
              </div>
              <div className="col-span-3 text-right flex justify-end gap-2">
                <button type="button" onClick={() => openEditLive(row)} className="text-xs font-black text-red-600 hover:underline">수정</button>
                {liveDeleteConfirmId === row.id ? (
                  <>
                    <span className="text-xs text-gray-500">삭제할까요?</span>
                    <button type="button" onClick={() => handleDeleteLive(row.id)} className="text-xs font-black text-red-600">확인</button>
                    <button type="button" onClick={() => setLiveDeleteConfirmId(null)} className="text-xs font-bold text-gray-500">취소</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setLiveDeleteConfirmId(row.id)} className="text-xs font-bold text-gray-500 hover:underline">삭제</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {liveModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setLiveModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-4">{liveModal === 'add' ? '라이브 등록' : '라이브 수정'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">제목</label>
                <input
                  type="text"
                  value={liveForm.title}
                  onChange={(e) => setLiveForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="라이브 제목"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">썸네일 (파일 업로드)</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={handleLiveThumbnailSelect} disabled={liveThumbnailUploading} className="text-sm" />
                  {liveThumbnailUploading && <span className="text-xs text-gray-500">업로드 중…</span>}
                </div>
                {liveForm.thumbnail_url && (
                  <div className="mt-2">
                    <img src={liveForm.thumbnail_url} alt="썸네일" className="max-h-24 rounded-lg border border-gray-200 object-contain" />
                    <button type="button" onClick={() => setLiveForm((prev) => ({ ...prev, thumbnail_url: null }))} className="mt-1 text-xs text-red-600 font-bold">제거</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">영상 임베드 URL (페이스북/유튜브 등 iframe src)</label>
                <input
                  type="url"
                  value={liveForm.video_embed_url ?? ''}
                  onChange={(e) => setLiveForm((prev) => ({ ...prev, video_embed_url: e.target.value.trim() || null }))}
                  placeholder="https://www.facebook.com/plugins/video.php?href=..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">연결 상품 (선택)</label>
                <select
                  value={liveForm.product_id ?? ''}
                  onChange={(e) => setLiveForm((prev) => ({ ...prev, product_id: e.target.value || null }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                >
                  <option value="">없음</option>
                  {liveProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">예정일시</label>
                <input
                  type="datetime-local"
                  value={liveForm.scheduled_at ?? ''}
                  onChange={(e) => setLiveForm((prev) => ({ ...prev, scheduled_at: e.target.value || null }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">상태</label>
                <select
                  value={liveForm.status}
                  onChange={(e) => setLiveForm((prev) => ({ ...prev, status: e.target.value as 'scheduled' | 'live' | 'ended' }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                >
                  <option value="scheduled">예정</option>
                  <option value="live">진행중</option>
                  <option value="ended">종료</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">표시 순서</label>
                  <input
                    type="number"
                    min={0}
                    value={liveForm.display_order}
                    onChange={(e) => setLiveForm((prev) => ({ ...prev, display_order: parseInt(e.target.value, 10) || 0 }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">시청자 수 (표시용)</label>
                  <input
                    type="number"
                    min={0}
                    value={liveForm.viewer_count}
                    onChange={(e) => setLiveForm((prev) => ({ ...prev, viewer_count: parseInt(e.target.value, 10) || 0 }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="live-is-active"
                    checked={liveForm.is_active}
                    onChange={(e) => setLiveForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="live-is-active" className="text-sm font-bold text-gray-700">노출</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={handleSaveLive} disabled={savingLiveId !== null} className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-black hover:bg-red-600 disabled:opacity-50">
                {savingLiveId ? '저장 중…' : '저장'}
              </button>
              <button type="button" onClick={() => setLiveModal(null)} className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBanners = () => (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button type="button" onClick={openAddBanner} className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-black hover:bg-red-700 shadow-lg shadow-red-500/20">
          + 배너 등록
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-1">이미지</div>
          <div className="col-span-3">제목</div>
          <div className="col-span-1 text-center">위치</div>
          <div className="col-span-1 text-center">순서</div>
          <div className="col-span-2 text-center">노출 기간</div>
          <div className="col-span-1 text-center">노출</div>
          <div className="col-span-3 text-right">관리</div>
        </div>
        {bannersLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">목록 불러오는 중…</div>
        ) : bannersList.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">등록된 배너가 없습니다.</div>
        ) : (
          bannersList.map((row) => (
            <div key={row.id} className="grid grid-cols-12 p-4 border-b border-gray-100 hover:bg-gray-50/50 items-center">
              <div className="col-span-1">
                <img src={row.image_url} alt="" className="w-14 h-10 rounded-lg object-cover" />
              </div>
              <div className="col-span-3 text-sm text-gray-800 truncate">{row.title}</div>
              <div className="col-span-1 text-center text-xs font-bold">{row.position === 'main' ? '메인' : '서브'}</div>
              <div className="col-span-1 text-center text-xs font-bold text-gray-600">{row.display_order}</div>
              <div className="col-span-2 text-center text-xs text-gray-500">
                {row.valid_from ? formatDate(row.valid_from).slice(0, 10) : '-'} ~ {row.valid_until ? formatDate(row.valid_until).slice(0, 10) : '-'}
              </div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-black ${row.is_active ? 'text-green-600' : 'text-gray-400'}`}>{row.is_active ? 'Y' : 'N'}</span>
              </div>
              <div className="col-span-3 text-right flex justify-end gap-2">
                <button type="button" onClick={() => openEditBanner(row)} className="text-xs font-black text-red-600 hover:underline">수정</button>
                {bannerDeleteConfirmId === row.id ? (
                  <>
                    <span className="text-xs text-gray-500">삭제할까요?</span>
                    <button type="button" onClick={() => handleDeleteBanner(row.id)} className="text-xs font-black text-red-600">확인</button>
                    <button type="button" onClick={() => setBannerDeleteConfirmId(null)} className="text-xs font-bold text-gray-500">취소</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setBannerDeleteConfirmId(row.id)} className="text-xs font-bold text-gray-500 hover:underline">삭제</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {bannerModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setBannerModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-4">{bannerModal === 'add' ? '배너 등록' : '배너 수정'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">제목</label>
                <input type="text" value={bannerForm.title} onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="배너 제목" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">태그 텍스트 (상단 뱃지)</label>
                <input type="text" value={bannerForm.tag_text ?? ''} onChange={(e) => setBannerForm((prev) => ({ ...prev, tag_text: e.target.value.trim() || null }))} placeholder="D-1 글로벌 쇼핑 위크" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">설명 (서브타이틀/본문)</label>
                <textarea value={bannerForm.description ?? ''} onChange={(e) => setBannerForm((prev) => ({ ...prev, description: e.target.value.trim() || null }))} rows={2} placeholder="배너 설명" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">배너 이미지 (파일 업로드) *필수</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={handleBannerImageSelect} disabled={bannerImageUploading} className="text-sm" />
                  {bannerImageUploading && <span className="text-xs text-gray-500">업로드 중…</span>}
                </div>
                {bannerForm.image_url && <img src={bannerForm.image_url} alt="미리보기" className="mt-2 max-h-28 rounded-lg border border-gray-200 object-contain" />}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">클릭 시 이동 URL</label>
                <input type="url" value={bannerForm.link_url ?? ''} onChange={(e) => setBannerForm((prev) => ({ ...prev, link_url: e.target.value.trim() || null }))} placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">위치</label>
                <select value={bannerForm.position} onChange={(e) => setBannerForm((prev) => ({ ...prev, position: e.target.value as 'main' | 'sub' }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold">
                  <option value="main">메인 (히어로)</option>
                  <option value="sub">서브</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">노출 시작</label>
                  <input type="datetime-local" value={bannerForm.valid_from ?? ''} onChange={(e) => setBannerForm((prev) => ({ ...prev, valid_from: e.target.value || null }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">노출 종료</label>
                  <input type="datetime-local" value={bannerForm.valid_until ?? ''} onChange={(e) => setBannerForm((prev) => ({ ...prev, valid_until: e.target.value || null }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">표시 순서</label>
                  <input type="number" min={0} value={bannerForm.display_order} onChange={(e) => setBannerForm((prev) => ({ ...prev, display_order: parseInt(e.target.value, 10) || 0 }))} className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="banner-is-active" checked={bannerForm.is_active} onChange={(e) => setBannerForm((prev) => ({ ...prev, is_active: e.target.checked }))} className="rounded border-gray-300" />
                  <label htmlFor="banner-is-active" className="text-sm font-bold text-gray-700">노출</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={handleSaveBanner} disabled={savingBannerId !== null || !bannerForm.image_url} className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-black hover:bg-red-600 disabled:opacity-50">
                {savingBannerId ? '저장 중…' : '저장'}
              </button>
              <button type="button" onClick={() => setBannerModal(null)} className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInsights = () => (
    <div className="flex flex-col gap-8">
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <h3 className="px-6 py-4 border-b border-gray-100 text-lg font-black text-gray-900">인기 검색어</h3>
        {insightsKeywordsLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">불러오는 중…</div>
        ) : insightsKeywords.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">검색 기록이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="text-left p-4">순위</th>
                  <th className="text-left p-4">키워드</th>
                  <th className="text-right p-4">검색 횟수</th>
                  <th className="text-right p-4">최근 검색</th>
                </tr>
              </thead>
              <tbody>
                {insightsKeywords.map((row, idx) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="p-4 font-bold text-gray-900">{row.keyword}</td>
                    <td className="p-4 text-right font-black text-red-600">{row.search_count.toLocaleString()}</td>
                    <td className="p-4 text-right text-gray-500">{row.last_searched_at ? formatDate(row.last_searched_at) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-black text-gray-900">매출 트렌드</h3>
          <select
            value={insightsTrendPeriod}
            onChange={(e) => setInsightsTrendPeriod(e.target.value as '7d' | '30d')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
          >
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
          </select>
        </div>
        {insightsTrendLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">불러오는 중…</div>
        ) : insightsTrendData.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">데이터가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="text-left p-4">날짜</th>
                  <th className="text-right p-4">주문 건수</th>
                  <th className="text-right p-4">매출</th>
                </tr>
              </thead>
              <tbody>
                {insightsTrendData.map((row) => (
                  <tr key={row.date} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">{row.date}</td>
                    <td className="p-4 text-right font-bold text-gray-700">{row.orders}건</td>
                    <td className="p-4 text-right font-black text-red-600">{row.revenue.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );

  const renderReviews = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <span className="text-xs font-black text-gray-400 uppercase">필터</span>
        <select
          value={reviewFilterRating}
          onChange={(e) => setReviewFilterRating(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
        >
          <option value="">전체 평점</option>
          <option value="5">5점</option>
          <option value="4">4점</option>
          <option value="3">3점</option>
          <option value="2">2점</option>
          <option value="1">1점</option>
        </select>
        <select
          value={reviewHiddenFilter}
          onChange={(e) => setReviewHiddenFilter(e.target.value as 'all' | 'visible' | 'hidden')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
        >
          <option value="all">전체</option>
          <option value="visible">노출 중</option>
          <option value="hidden">숨김</option>
        </select>
        <button
          type="button"
          onClick={fetchReviews}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-black hover:bg-red-600"
        >
          검색
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-2">상품</div>
          <div className="col-span-2">작성자</div>
          <div className="col-span-1 text-center">평점</div>
          <div className="col-span-4">내용</div>
          <div className="col-span-2 text-center">작성일</div>
          <div className="col-span-1 text-center">상태</div>
        </div>
        {reviewsLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">리뷰 목록 불러오는 중…</div>
        ) : reviewsList.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">조건에 맞는 리뷰가 없습니다.</div>
        ) : (
          reviewsList.map((r) => (
            <div
              key={r.id}
              className={`grid grid-cols-12 p-4 border-b border-gray-100 hover:bg-gray-50/50 items-start ${r.is_hidden ? 'opacity-60 bg-gray-50' : ''}`}
            >
              <div className="col-span-2 text-sm font-bold text-gray-800 truncate">{r.products?.name ?? '-'}</div>
              <div className="col-span-2 text-xs">
                <p className="font-bold text-gray-700">{r.users?.name ?? '-'}</p>
                <p className="text-gray-500 truncate">{r.users?.email ?? '-'}</p>
              </div>
              <div className="col-span-1 text-center">
                <span className="text-sm font-black text-amber-500">{r.rating}점</span>
              </div>
              <div className="col-span-4 min-w-0">
                <p className="text-xs font-bold text-gray-800 line-clamp-2">{r.title || r.content}</p>
                {r.is_verified_purchase && <span className="text-[10px] text-blue-600 font-bold">구매확정</span>}
              </div>
              <div className="col-span-2 text-center text-xs text-gray-500">{formatDate(r.created_at)}</div>
              <div className="col-span-1 flex flex-col gap-1 items-center">
                <span className={`text-xs font-black ${r.is_hidden ? 'text-gray-400' : 'text-green-600'}`}>
                  {r.is_hidden ? '숨김' : '노출'}
                </span>
                <button
                  type="button"
                  disabled={reviewActionId === r.id}
                  onClick={() => handleReviewHidden(r.id, !r.is_hidden)}
                  className="text-[10px] font-black text-red-600 hover:underline disabled:opacity-50"
                >
                  {reviewActionId === r.id ? '…' : r.is_hidden ? '복구' : '숨김'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-[#f8f9fa] flex overflow-hidden font-sans">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-8 flex flex-col items-center gap-2 mb-8">
          <div className="w-14 h-14 bg-[#E52D27] rounded-3xl flex items-center justify-center font-black text-white text-2xl shadow-2xl shadow-red-500/30">Y</div>
          <span className="font-black tracking-tighter text-gray-900 text-xl mt-2 uppercase">Yes Duty Admin</span>
        </div>
        <nav className="flex-grow px-4 space-y-1">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-4 mb-4">Operations</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-4 rounded-2xl text-[13px] font-black transition-all ${
                activeTab === item.id ? 'bg-gray-900 text-white shadow-2xl translate-x-1' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6">
          <button onClick={onClose} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl text-[13px] hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/10">
            LOGOUT SYSTEM
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-red-600 rounded-full" />
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
              {menuItems.find((i) => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-sm font-black text-gray-900 tracking-tight">System Master Agent</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-10 bg-[#fcfcfc]">
          {activeTab === 'orders' ? renderOrders() : activeTab === 'products' ? renderProducts() : activeTab === 'members' ? renderMembers() : activeTab === 'dashboard' ? renderDashboard() : activeTab === 'notices' ? renderNotices() : activeTab === 'live' ? renderLive() : activeTab === 'banners' ? renderBanners() : activeTab === 'insights' ? renderInsights() : activeTab === 'coupons' ? renderCoupons() : activeTab === 'reviews' ? renderReviews() : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-xl font-black italic tracking-tighter text-gray-400">Under Construction</p>
              <p className="text-sm font-bold mt-2 text-gray-400">이 모듈은 순차 업데이트 중입니다.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
