import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './SidePanel.css';

interface NavItem {
  id: string;
  label: string;
  path: string;
}

export const SidePanel: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t_nested } = useLanguage();

  const navItems: NavItem[] = [
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
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleClick = (path: string) => {
    console.log('Side panel navigation clicked:', path);
    console.log('Current location:', location.pathname);
    try {
      navigate(path);
      console.log('Navigation successful to:', path);
    } catch (error) {
      console.error('Navigation error:', error);
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
            onClick={() => handleClick(item.path)}
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
