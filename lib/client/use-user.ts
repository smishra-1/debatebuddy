"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

/** The signed-in student: `undefined` while loading, `null` when signed out. */
export function useUser(): CurrentUser | null | undefined {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    let supabase: ReturnType<typeof getBrowserSupabase>;
    try {
      supabase = getBrowserSupabase();
    } catch {
      queueMicrotask(() => setUser(null));
      return;
    }
    const toUser = (
      u: { id: string; email?: string; created_at: string; user_metadata?: Record<string, unknown> } | null | undefined,
    ): CurrentUser | null =>
      u
        ? {
            id: u.id,
            name: typeof u.user_metadata?.name === "string" ? u.user_metadata.name : "",
            email: u.email ?? "",
            createdAt: u.created_at,
          }
        : null;

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(toUser(data.user));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(toUser(session?.user));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return user;
}
