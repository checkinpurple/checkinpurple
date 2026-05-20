import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, type User } from './supabase';
import { ProfileType } from '@shared/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  impersonatedUser: User | null;
  isImpersonating: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    activeProfile: ProfileType,
    profiles: ProfileType[],
    tier: 'Basic' | 'Standard' | 'Premium'
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchProfile: (profileType: ProfileType) => Promise<void>;
  impersonateUser: (userId: string) => Promise<void>;
  stopImpersonating: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ADMIN_EMAIL = "checkinpurple@gmail.com";
  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === "admin";
  const isImpersonating = impersonatedUser !== null;

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          await fetchUserProfile(data.session.user.id);
        }
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        void fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const [profileRes, profileRowsRes, authRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('user_profiles').select('profile_type').eq('user_id', userId),
        supabase.auth.getUser(),
      ]);

      const profile = profileRes.data;
      const profileRows = Array.isArray(profileRowsRes.data) ? profileRowsRes.data : [];
      const metadata = authRes.data?.user?.user_metadata as any;
      const profileList = profileRows.map((row: any) => row.profile_type as ProfileType);
      const fallbackProfiles = Array.isArray(metadata?.profiles) ? metadata.profiles : [(metadata?.role as ProfileType) || 'fan'];
      const profiles = profileList.length ? profileList : fallbackProfiles;
      const tier = profile?.tier || metadata?.tier;

      if (!profile) {
        if (authRes.data?.user) {
          const authUser = authRes.data.user;
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            username: authUser.user_metadata?.username || 'user_' + authUser.id.slice(0, 8),
            role: (authUser.user_metadata?.role as User['role']) || 'fan',
            avatar_url: authUser.user_metadata?.avatar_url,
            bio: authUser.user_metadata?.bio,
            location: authUser.user_metadata?.location,
            website: authUser.user_metadata?.website,
            created_at: authUser.created_at || new Date().toISOString(),
            profiles,
            tier,
          });
        }
        return;
      }

      setUser({
        ...profile,
        profiles,
        tier,
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    activeProfile: ProfileType,
    profiles: ProfileType[],
    tier: 'Basic' | 'Standard' | 'Premium'
  ) => {
    try {
      setError(null);

      // Check if email is already registered by attempting a password sign-in with a dummy
      // password — the safest way is to use signUp and inspect the response carefully.
      // Supabase returns identities: [] when the email already exists (email confirmation off).
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, role: activeProfile, profiles, tier },
        },
      });

      if (signUpError) throw signUpError;

      // If identities array is empty, the email is already registered
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        throw new Error('This email is already registered. Please sign in instead.');
      }

      if (data.user) {
        setTimeout(() => fetchUserProfile(data.user!.id), 1000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('invalid login') || signInError.message.includes('Invalid')) {
          throw new Error('Invalid email or password');
        } else if (signInError.message.includes('not confirmed')) {
          throw new Error('Please confirm your email before signing in');
        } else {
          throw signInError;
        }
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    }
  };

  const switchProfile = async (profileType: ProfileType) => {
    if (!user) throw new Error('Not authenticated');

    const response = await fetch('/api/profiles/switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.id}`,
      },
      body: JSON.stringify({ profile_type: profileType }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to switch profile');
    }

    if (result.user) {
      setUser(prev => ({
        ...prev,
        role: result.user.role,
      } as User));
    }
  };

  const impersonateUser = async (userId: string) => {
    if (!isAdmin) throw new Error('Only admins can impersonate users');
    
    try {
      // Fetch the user profile to impersonate
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User not found');
      }

      // Fetch their profiles
      const { data: profileRows } = await supabase
        .from('user_profiles')
        .select('profile_type')
        .eq('user_id', userId);

      const profiles = profileRows?.map((row: any) => row.profile_type as ProfileType) || [profile.role || 'fan'];

      setImpersonatedUser({
        ...profile,
        profiles,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to impersonate user';
      throw new Error(message);
    }
  };

  const stopImpersonating = () => {
    setImpersonatedUser(null);
  };

  // Return the impersonated user if impersonating, otherwise the actual user
  const effectiveUser = impersonatedUser || user;

  return (
    <AuthContext.Provider value={{ 
      user: effectiveUser, 
      loading, 
      error, 
      impersonatedUser,
      isImpersonating,
      signUp, 
      signIn, 
      signOut, 
      switchProfile,
      impersonateUser,
      stopImpersonating 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
