import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabase } from '../supabase';
import { upsertUserProfile, updateLastLogin, getProfile } from '../api/users';
import { createShippingAddress, type ShippingAddressInput } from '../api/shippingAddresses';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupabase().auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user) {
        const profile = await getProfile(s.user.id);
        if (profile && profile.is_active === false) {
          await getSupabase().auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        if (profile && profile.is_active === false) {
          await getSupabase().auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null; user?: User }> => {
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) return { error };
    if (data.user) {
      const profile = await getProfile(data.user.id);
      if (profile && profile.is_active === false) {
        await getSupabase().auth.signOut();
        return { error: { message: '탈퇴 처리된 계정입니다. 로그인할 수 없습니다.', name: 'UserDeactivated', status: 403 } as AuthError };
      }
      await updateLastLogin(data.user.id);
    }
    return { error: null, user: data.user };
  };

  const signUp = async (
    email: string,
    password: string,
    options?: { name?: string; phone?: string; address?: ShippingAddressInput }
  ): Promise<{ error: AuthError | null }> => {
    const { data, error } = await getSupabase().auth.signUp({ email, password });
    if (error) return { error };
    if (data.user) {
      await upsertUserProfile({
        id: data.user.id,
        email: data.user.email ?? email,
        name: options?.name ?? data.user.email?.split('@')[0] ?? '회원',
        phone: options?.phone ?? undefined,
      });
      if (options?.address) {
        await createShippingAddress(data.user.id, { ...options.address, is_default: true });
      }
    }
    return { error: null };
  };

  const signOut = async (): Promise<void> => {
    await getSupabase().auth.signOut();
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isLoggedIn: !!user,
  };
}
