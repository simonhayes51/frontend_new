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
      }
    } catch (error) {
      console.log('❌ Auth check failed:', error.message);
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    }
  };

  const login = () => {
    window.location.href = `${api.defaults.baseURL}/api/login`;
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
