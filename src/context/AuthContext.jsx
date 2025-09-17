import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../axios';

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
    // Check if we're on a public route (HashRouter uses hash)
    const hash = window.location.hash;
    const isAccessDenied = hash.includes('/access-denied') || hash.includes('access-denied');
    const isLogin = hash.includes('/login') || hash.includes('login');
    const isLanding = hash.includes('/landing') || hash.includes('landing');
    
    if (isAccessDenied || isLogin || isLanding) {
      console.log('🔍 On public route, skipping auth check:', hash);
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      console.log('🔍 Checking auth status...');
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get('/api/me');
      
      if (response.data.authenticated) {
        console.log('✅ User authenticated:', response.data.user_id);
        dispatch({ 
          type: 'SET_AUTHENTICATED', 
          payload: response.data 
        });
      } else {
        console.log('❌ User not authenticated, reason:', response.data.error);
        dispatch({ type: 'SET_UNAUTHENTICATED' });
        
        // Handle membership revoked case
        if (response.data.error === 'membership_revoked') {
          console.log('🚫 Redirecting to access denied - membership revoked');
          window.location.hash = '/access-denied';
        } else {
          console.log('🔄 Redirecting to login');
          window.location.hash = '/login';
        }
      }
    } catch (error) {
      console.log('❌ Auth check failed:', error.message);
      dispatch({ type: 'SET_UNAUTHENTICATED' });
      
      // Only redirect if not already on public route
      const hash = window.location.hash;
      if (!hash.includes('/access-denied') && !hash.includes('/login') && !hash.includes('/landing')) {
        window.location.hash = '/login';
      }
    }
  };

  const login = () => {
    window.location.href = `${api.defaults.baseURL}/api/login`;
  };

  const logout = async () => {
    try {
      await api.get('/api/logout');
      dispatch({ type: 'SET_UNAUTHENTICATED' });
      window.location.hash = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'SET_UNAUTHENTICATED' });
      window.location.hash = '/login';
    }
  };

  useEffect(() => {
    console.log('🔍 AuthProvider mounted, current hash:', window.location.hash);
    checkAuthStatus();

    // Listen for hash changes
    const handleHashChange = () => {
      console.log('🔍 Hash changed to:', window.location.hash);
      // Don't re-check auth when navigating to public routes
      const hash = window.location.hash;
      const isPublicRoute = hash.includes('/access-denied') || hash.includes('/login') || hash.includes('/landing');
      if (!isPublicRoute && !state.isAuthenticated) {
        checkAuthStatus();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
