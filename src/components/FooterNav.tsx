import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';
import './FooterNav.css';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
}

const FooterNavComponent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t_nested } = useLanguage();

  // Memoize navItems to prevent re-creation on every render
  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'new-dashboard',
      label: t_nested('navigation.dashboard') || 'Dashboard',
      path: '/new-dashboard',
      icon: '📊',
    },
    {
      id: 'practice',
      label: t_nested('navigation.practice') || 'Practice',
      path: '/tests',
      icon: '📚',
    },
    {
      id: 'mock-exam',
      label: t_nested('navigation.mockExam') || 'Mock Exam',
      path: '/mock-exam',
      icon: '📝',
    },
    {
      id: 'settings',
      label: t_nested('navigation.settings') || 'Settings',
      path: '/settings',
      icon: '⚙️',
    }
  ], [t_nested]);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug('Footer navigation:', path);
    try {
      if (location.pathname !== path) {
        navigate(path);
      }
    } catch (error) {
      logger.error('Navigation error:', error);
    }
  };

  return (
    <div className="footer-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`footer-nav-btn ${isActive(item.path) ? 'active' : ''}`}
          onClick={(e) => handleClick(e, item.path)}
          onTouchStart={(e) => {
            e.preventDefault();
            handleClick(e, item.path);
          }}
          aria-label={item.label}
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
        >
          <span className="footer-nav-icon">{item.icon}</span>
        </button>
      ))}
    </div>
  );
};

FooterNavComponent.displayName = 'FooterNav';

export const FooterNav = React.memo(FooterNavComponent);


