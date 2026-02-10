import { useState, useEffect, useCallback } from 'react';
import { getReviewsByProductId, createReview, getMyReview } from '../api/reviews';
import type { Review } from '../../types';

export function useReviews(productId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getReviewsByProductId(productId);
      setReviews(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('리뷰를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { reviews, loading, error, refetch };
}

export function useMyReview(productId: string | null, userId: string | null) {
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId || !userId) {
      setMyReview(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMyReview(productId, userId)
      .then((r) => {
        if (!cancelled) setMyReview(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId, userId]);

  return { myReview, loading };
}

export function useCreateReview(productId: string, userId: string | null, onSuccess?: () => void) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (params: { rating: number; title?: string; content: string }) => {
      if (!userId) {
        setError(new Error('로그인이 필요합니다.'));
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await createReview({
          product_id: productId,
          user_id: userId,
          rating: params.rating,
          title: params.title,
          content: params.content,
        });
        onSuccess?.();
      } catch (e) {
        setError(e instanceof Error ? e : new Error('리뷰 등록에 실패했습니다.'));
      } finally {
        setSubmitting(false);
      }
    },
    [productId, userId, onSuccess]
  );

  return { submit, submitting, error };
}
