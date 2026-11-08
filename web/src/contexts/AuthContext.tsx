import { useCallback, useEffect, useState, type ReactNode } from "react";

import { api, setApiAccessToken } from "../lib/api";
import { AuthContext, type AuthUser } from "./auth-context";

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

interface StoredSession {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

const SESSION_KEY = "personal-trainer-manager:session";

function clearStoredSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function readStoredSession(): StoredSession | null {
  try {
    const rawSession = sessionStorage.getItem(SESSION_KEY);

    if (!rawSession) {
      return null;
    }

    const session: unknown = JSON.parse(rawSession);

    if (
      typeof session !== "object" ||
      session === null ||
      !("accessToken" in session) ||
      typeof session.accessToken !== "string" ||
      !("expiresAt" in session) ||
      typeof session.expiresAt !== "number" ||
      !("user" in session) ||
      typeof session.user !== "object" ||
      session.user === null
    ) {
      clearStoredSession();
      return null;
    }

    if (Date.now() >= session.expiresAt) {
      clearStoredSession();
      return null;
    }

    const user = session.user as AuthUser;

    if (
      typeof user.id !== "string" ||
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      typeof user.isPlatformAdmin !== "boolean"
    ) {
      clearStoredSession();
      return null;
    }

    return {
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
      user,
    };
  } catch {
    clearStoredSession();
    return null;
  }
}

const initialSession = readStoredSession();

// Configura o token antes da montagem das páginas protegidas.
setApiAccessToken(initialSession?.accessToken ?? null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(
    initialSession?.user ?? null,
  );

  const [accessToken, setAccessToken] = useState<string | null>(
    initialSession?.accessToken ?? null,
  );

  useEffect(() => {
    setApiAccessToken(accessToken);
  }, [accessToken]);

  async function signIn(email: string, password: string) {
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });

    const { accessToken, expiresIn, user } = response.data;

    const expiresAt = Date.now() + expiresIn * 1000;

    const session: StoredSession = {
      accessToken,
      expiresAt,
      user,
    };

    // sessionStorage mantém a sessão durante recarregamentos
    // na mesma aba e a encerra quando a aba é fechada.
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    setApiAccessToken(accessToken);
    setAccessToken(accessToken);
    setUser(user);
  }

  const signOut = useCallback(() => {
    clearStoredSession();
    setApiAccessToken(null);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && accessToken),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
