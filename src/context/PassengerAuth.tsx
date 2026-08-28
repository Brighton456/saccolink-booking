import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type Passenger = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  points: number;
};

type PassengerAuthCtx = {
  passenger: Passenger | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  addPoints: (n: number) => void;
};

const Ctx = createContext<PassengerAuthCtx>({
  passenger: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
  addPoints: () => {},
});

export function PassengerAuthProvider({ children }: { children: ReactNode }) {
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [loading, setLoading] = useState(true);

  /* Load session on mount */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? "");
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? "");
      } else {
        setPassenger(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string, email: string) => {
    try {
      /* Try to read from a passenger_profiles table; create if missing */
      const { data } = await supabase
        .from("passenger_profiles" as never)
        .select("*" as never)
        .eq("user_id" as never, userId)
        .maybeSingle();

      if (data) {
        const row = data as unknown as Record<string, unknown>;
        setPassenger({
          id: userId,
          email,
          name: String(row.name || email.split("@")[0]),
          phone: row.phone ? String(row.phone) : null,
          points: Number(row.points || 0),
        });
      } else {
        /* Auto-create profile */
        await supabase.from("passenger_profiles" as never).insert({
          user_id: userId,
          name: email.split("@")[0],
          points: 100, /* Welcome bonus */
        } as never);
        setPassenger({ id: userId, email, name: email.split("@")[0], phone: null, points: 100 });
      }
    } catch {
      setPassenger({ id: userId, email, name: email.split("@")[0], phone: null, points: 0 });
    }
    setLoading(false);
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, phone?: string) => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      await supabase.from("passenger_profiles" as never).insert({
        user_id: data.user.id,
        name,
        phone: phone || null,
        points: 100,
      } as never);
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setPassenger(null);
  }, []);

  const addPoints = useCallback((n: number) => {
    setPassenger((p) => p ? { ...p, points: p.points + n } : null);
  }, []);

  return (
    <Ctx.Provider value={{ passenger, loading, signIn, signUp, signOut, addPoints }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePassenger = () => useContext(Ctx);
