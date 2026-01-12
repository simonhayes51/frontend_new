import React from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import MobileDashboard from './MobileDashboard';
import ModernDashboard from './ModernDashboard';
import MobileNavigation from './MobileNavigation';

const ResponsiveLayout = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <>
        <MobileDashboard />
        <MobileNavigation />
      </>
    );
  }

  return <ModernDashboard />;
};
