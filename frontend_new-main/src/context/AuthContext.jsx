import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../axios';
import { getTraderMe } from '../api/traders';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
        error: null
      };
    case 'SET_UNAUTHENTICATED':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status...');
      dispatch({ type: 'SET_LOADING', payload: true });
      const tryCheck = async (path) => {
        try {
          const response = await api.get(path, {
            validateStatus: (status) => status < 500,
            __skipAuthRedirect: true,
            headers: {
              "Cache-Control": "no-cache",
            },
            params: {
              _ts: Date.now(),
            },
          });
          if (response.status === 401) {
            return { authenticated: false };
          }
          if (response.status >= 400) {
            return null;
          }
          return response.data || {};
        } catch (error) {
          return null;
        }
      };

      const authData = (await tryCheck('/api/auth/me')) || (await tryCheck('/api/me'));

      if (!authData) {
        console.log('❌ Auth check failed: no usable response');
        dispatch({ type: 'SET_UNAUTHENTICATED' });
        return;
      }

      const authenticated =
        authData.authenticated === true ||
        !!authData.user_id ||
        !!authData.user ||
        !!authData.id;

      if (authenticated) {
        let userData = authData;
        if (authData.user && typeof authData.user === 'object') {
          userData = { ...authData, ...authData.user };
        }

        try {
          const traderRes = await getTraderMe();
          if (traderRes?.data) {
            const trader = traderRes.data || {};
            const merged = { ...userData, ...trader };
            if (!merged.account_type && (trader.account_type || trader.tier)) {
              merged.account_type = trader.account_type || 'trader';
            }
            if (!merged.is_trader) {
              merged.is_trader = true;
            }
            if (!merged.avatar_url) {
              merged.avatar_url =
                trader.avatar_url ||
                trader.avatar ||
                userData.avatar_url ||
                userData.avatar ||
                '';
            }
            userData = merged;
          }
        } catch {
        }

        if (!userData.avatar_url) {
          userData = {
            ...userData,
            avatar_url:
              userData.avatar ||
              userData.user_avatar ||
              userData.image ||
              userData.picture ||
              '',
          };
        }

        console.log('✅ User authenticated:', userData.user_id || userData.id);
        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: userData
        });
      } else {
        console.log('❌ User not authenticated, reason:', authData.error);
        dispatch({ type: 'SET_UNAUTHENTICATED' });
      }
    } catch (error) {
      console.log('❌ Auth check failed:', error.message);
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    }
  };

  const login = () => {
    const explicitApi =
      (import.meta.env?.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/$/, "")) ||
      "";
    const loginBase = explicitApi || api.defaults.baseURL;
    window.location.href = `${loginBase}/api/login`;
  };

  const logout = async () => {
    try {
      await api.get('/api/logout');
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    }
  };

  useEffect(() => {
    console.log('🔍 AuthProvider mounted');
    console.log('🔍 Current pathname:', window.location.pathname);
    console.log('🔍 Current hash:', window.location.hash);
    
    // CRITICAL: Don't run auth checks if we're on /access-denied
    if (window.location.pathname === '/access-denied' || 
        window.location.pathname.includes('access-denied')) {
      console.log('🔍 On access-denied page, skipping all auth checks');
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    // Only check auth for other routes
    checkAuthStatus();
  }, []);

  const value = {
    ...state,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
