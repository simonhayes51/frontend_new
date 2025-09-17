import { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

  // Routes that should never trigger auth checks
  const PUBLIC_ROUTES = ['/access-denied', '/login', '/landing'];

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get('/api/me');
      
      if (response.data.authenticated) {
        dispatch({ 
          type: 'SET_AUTHENTICATED', 
          payload: response.data 
        });
      } else {
        dispatch({ type: 'SET_UNAUTHENTICATED' });
        
        // Handle membership revoked case
        if (response.data.error === 'membership_revoked') {
          window.location.href = '/access-denied';
        }
      }
    } catch (error) {
      console.log('Auth check failed:', error.message);
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
    // Get current path
    const currentPath = window.location.hash.replace('#', '') || window.location.pathname;
    
    // Don't check auth on public routes
    if (PUBLIC_ROUTES.includes(currentPath)) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    // Only check auth for protected routes
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
