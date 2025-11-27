import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';
import './SidePanel.css';

interface NavItem {
  id: string;
  label: string;
  path: string;
}

const SidePanelComponent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t_nested } = useLanguage();

  // Memoize navItems to prevent re-creation on every render
  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'new-dashboard',
      label: t_nested('navigation.dashboard') || 'Dashboard',
      path: '/new-dashboard',
    },
    {
      id: 'practice',
      label: t_nested('navigation.practice') || 'Practice',
      path: '/tests',
    },
    {
      id: 'mock-exam',
      label: t_nested('navigation.mockExam') || 'Mock Exam',
      path: '/mock-exam',
    },
    {
      id: 'settings',
      label: t_nested('navigation.settings') || 'Settings',
      path: '/settings',
    }
  ], [t_nested]);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug('Side panel navigation:', { path, currentLocation: location.pathname });
    try {
      if (location.pathname !== path) {
        navigate(path);
      }
    } catch (error) {
      logger.error('Navigation error:', error);
    }
  };

  return (
    <aside className="side-panel" style={{ zIndex: 10000 }}>
      <div className="side-panel-content">
        {navItems.map((item) => (
          <button 
            key={item.id}
            type="button"
            className={`side-panel-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={(e) => handleClick(e, item.path)}
            aria-label={item.label}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              zIndex: 10002,
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <span className="side-panel-label">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

SidePanelComponent.displayName = 'SidePanel';

export const SidePanel = React.memo(SidePanelComponent);
