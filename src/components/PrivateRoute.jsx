import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Check if we're on access denied page
  const hash = window.location.hash;
  const isAccessDenied = hash.includes('/access-denied');
  
  if (isAccessDenied) {
    // Don't show loading or redirect for access denied page
    return children;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    window.location.hash = '/login';
    return null;
  }

  return children;
};

export default PrivateRoute;
