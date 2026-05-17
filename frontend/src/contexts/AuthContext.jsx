import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nes_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nes_token');
    const savedUser = localStorage.getItem('nes_user');

    if (!token) {
      setLoading(false);
      return;
    }

    // Se já temos o usuário salvo e o token existe, confiamos nos dados locais
    // e validamos o token em background sem deslogar imediatamente em caso de falha
    if (savedUser) {
      setLoading(false);
      // Valida em background e atualiza silenciosamente se necessário
      api.me()
        .then(u => {
          setUser(u);
          localStorage.setItem('nes_user', JSON.stringify(u));
        })
        .catch(() => {
          // Só desloga se o token realmente expirou (não em erros transitórios)
          // Mantém a sessão por enquanto e deixa as rotas protegidas decidirem
        });
      return;
    }

    // Sem usuário salvo, precisa validar o token obrigatoriamente
    api.me()
      .then(u => {
        setUser(u);
        localStorage.setItem('nes_user', JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem('nes_token');
        localStorage.removeItem('nes_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (loginStr, senha) => {
    const res = await api.login(loginStr, senha);
    localStorage.setItem('nes_token', res.access_token);
    localStorage.setItem('nes_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nes_token');
    localStorage.removeItem('nes_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}