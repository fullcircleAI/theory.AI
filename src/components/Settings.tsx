import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';
import './Settings.css';

interface FAQ {
  question: string;
  answer: string;
}

const getFAQs = (t_nested: (key: string) => string): FAQ[] => [
  {
    question: t_nested('settings.faqData.progressTracking.question'),
    answer: t_nested('settings.faqData.progressTracking.answer')
  },
  {
    question: t_nested('settings.faqData.dataSecurity.question'),
    answer: t_nested('settings.faqData.dataSecurity.answer')
  },
  {
    question: t_nested('settings.faqData.offlineUse.question'),
    answer: t_nested('settings.faqData.offlineUse.answer')
  },
  {
    question: t_nested('settings.faqData.aiCoach.question'),
    answer: t_nested('settings.faqData.aiCoach.answer')
  },
  {
    question: t_nested('settings.faqData.dataLoss.question'),
    answer: t_nested('settings.faqData.dataLoss.answer')
  }
];

export const Settings: React.FC = () => {
  const { t_nested } = useLanguage();
  const faqs = getFAQs(t_nested);
  const [activePage, setActivePage] = useState<'main' | 'account' | 'language' | 'privacy' | 'terms' | 'faq' | 'support'>('main');
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('AI Learner');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('preferredLanguage') || 'en';
  });

  useEffect(() => {
    // Load username
    const username = localStorage.getItem('username');
    if (username) {
      setEditUsername(username);
    }
  }, []);


  const handleUpdateProfile = async () => {
    if (editUsername.trim()) {
      localStorage.setItem('username', editUsername);
      setIsEditing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSendSupportEmail = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      alert('Please fill in both subject and message fields.');
      return;
    }

    setIsSending(true);
    try {
      const mailtoLink = `mailto:support@theorycoach.com?subject=${encodeURIComponent(supportSubject)}&body=${encodeURIComponent(`From: ${editUsername}\n\n${supportMessage}`)}`;
      window.open(mailtoLink);
      setSendSuccess(true);
      setSupportSubject('');
      setSupportMessage('');
      
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      logger.error('Error sending support email:', error);
      alert('Failed to open email client. Please send an email manually to support@theorycoach.com');
    } finally {
      setIsSending(false);
    }
  };


  const handleBackToMain = () => {
    setActivePage('main');
  };

  // Main Settings Menu
  const renderMainMenu = () => (
    <div className="settings-page">
      <div className="tests-header">
        <div className="header-content">
          <div className="header-text">
            <h1>{t_nested('settings.title')}</h1>
          </div>
        </div>
      </div>

      <div className="settings-main-menu">
        <div className="settings-btn-wrapper">
          <button className="settings-main-menu-btn" onClick={() => setActivePage('account')}>
            <span>{t_nested('settings.account')}</span>
            <span className="settings-arrow">›</span>
          </button>
        </div>

        <div className="settings-btn-wrapper">
          <button className="settings-main-menu-btn" onClick={() => setActivePage('language')}>
            <span>{t_nested('settings.language')}</span>
            <span className="settings-arrow">›</span>
          </button>
        </div>

        <div className="settings-btn-wrapper">
          <button className="settings-main-menu-btn" onClick={() => setActivePage('privacy')}>
            <span>{t_nested('settings.privacy')}</span>
            <span className="settings-arrow">›</span>
          </button>
        </div>

        <div className="settings-btn-wrapper">
          <button className="settings-main-menu-btn" onClick={() => setActivePage('terms')}>
            <span>{t_nested('settings.terms')}</span>
            <span className="settings-arrow">›</span>
          </button>
        </div>

        <div className="settings-btn-wrapper">
          <button className="settings-main-menu-btn" onClick={() => setActivePage('faq')}>
            <span>{t_nested('settings.faq')}</span>
            <span className="settings-arrow">›</span>
          </button>
        </div>

        <div className="settings-btn-wrapper">
          <button className="settings-main-menu-btn" onClick={() => setActivePage('support')}>
            <span>{t_nested('settings.support')}</span>
            <span className="settings-arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Account Sub-Page
  const renderAccountPage = () => (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <button className="settings-back-btn" onClick={handleBackToMain}>
          ←
        </button>
        <h2 className="settings-subpage-title">{t_nested('settings.account')}</h2>
      </div>

      <div className="settings-subpage-content">
        <div className="settings-section">
          <h3>Profile</h3>
          <div className="profile-field">
            <label>Username</label>
            {isEditing ? (
              <div className="edit-field">
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder={t_nested('settings.enterUsername')}
                />
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleUpdateProfile}>Save</button>
                  <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="display-field">
                <span>{editUsername}</span>
                <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
              </div>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h3>Data Management</h3>
          <div className="data-actions">
            <button className="data-btn export-btn">Export Data</button>
            <button className="data-btn import-btn">Import Data</button>
          </div>
        </div>

        <div className="settings-section danger-zone">
          <h3>Danger Zone</h3>
          <button className="delete-account-btn" onClick={handleDeleteAccount}>
            Delete Account
          </button>
          <p className="delete-warning">This will permanently delete all your data</p>
        </div>
      </div>
    </div>
  );

  // Language Selection Sub-Page
  const renderLanguagePage = () => {
    const handleLanguageSelect = (language: string) => {
      setSelectedLanguage(language);
      localStorage.setItem('preferredLanguage', language);
      // Show success message
      alert(`Language changed to ${language === 'en' ? 'English' : language === 'nl' ? 'Dutch' : 'Arabic'}`);
    };

    return (
      <div className="settings-subpage">
        <div className="settings-subpage-header">
          <button className="settings-back-btn" onClick={handleBackToMain}>
            ←
          </button>
          <h2 className="settings-subpage-title">Language</h2>
        </div>

        <div className="settings-subpage-content">
          <div className="language-section">
            <p className="language-description">Select your preferred language for the app interface</p>
            
            <div className="language-options-settings">
              <button
                className={`language-option-settings ${selectedLanguage === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageSelect('en')}
                aria-label="Select English language"
              >
                <div className="language-content-settings">
                  <span className="flag-settings">🇬🇧</span>
                  <span className="language-name-settings">English</span>
                  {selectedLanguage === 'en' && <span className="checkmark">✓</span>}
                </div>
              </button>
              
              <button
                className={`language-option-settings ${selectedLanguage === 'nl' ? 'active' : ''}`}
                onClick={() => handleLanguageSelect('nl')}
                aria-label="Select Dutch language"
              >
                <div className="language-content-settings">
                  <span className="flag-settings">🇳🇱</span>
                  <span className="language-name-settings">Dutch</span>
                  {selectedLanguage === 'nl' && <span className="checkmark">✓</span>}
                </div>
              </button>

              <button
                className={`language-option-settings ${selectedLanguage === 'ar' ? 'active' : ''}`}
                onClick={() => handleLanguageSelect('ar')}
                aria-label="Select Arabic language"
              >
                <div className="language-content-settings">
                  <span className="flag-settings">🇸🇦</span>
                  <span className="language-name-settings">Arabic</span>
                  {selectedLanguage === 'ar' && <span className="checkmark">✓</span>}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Privacy Policy Sub-Page
  const renderPrivacyPage = () => (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <button className="settings-back-btn" onClick={handleBackToMain}>
          ←
        </button>
        <h2 className="settings-subpage-title">Privacy Policy</h2>
      </div>

      <div className="settings-subpage-content">
        <div className="policy-content">
          <h3>Data Collection</h3>
          <p>We collect minimal data necessary to provide our services. This includes your study progress, test results, and preferences.</p>

          <h3>Data Storage</h3>
          <p>Your data is stored securely in the cloud and is encrypted both in transit and at rest. We use industry-standard security measures to protect your information.</p>

          <h3>Data Usage</h3>
          <p>Your data is used solely to provide and improve our AI Learning Coach services. We analyze your study patterns to give you personalized recommendations.</p>

          <h3>Data Sharing</h3>
          <p>We do not share, sell, or rent your personal data to third parties. Your information remains private and confidential.</p>

          <h3>Your Rights</h3>
          <p>You have the right to access, export, and delete your data at any time. You can manage your data through the Account settings.</p>

          <h3>Contact</h3>
          <p>For privacy concerns, contact us at privacy@theorycoach.com</p>
        </div>
      </div>
    </div>
  );

  // Terms of Service Sub-Page
  const renderTermsPage = () => (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <button className="settings-back-btn" onClick={handleBackToMain}>
          ←
        </button>
        <h2 className="settings-subpage-title">Terms of Service</h2>
      </div>

      <div className="settings-subpage-content">
        <div className="policy-content">
          <h3>1. Acceptance of Terms</h3>
          <p>By using Theory.AI, you agree to these Terms of Service. If you do not agree, please do not use the app.</p>

          <h3>2. Service Description</h3>
          <p>Theory.AI is an educational platform designed to help users prepare for the Dutch driving theory exam through AI-powered learning.</p>

          <h3>3. User Responsibilities</h3>
          <p>You are responsible for maintaining the confidentiality of your account and for all activities under your account. You must provide accurate information.</p>

          <h3>4. Acceptable Use</h3>
          <p>You agree to use the service only for lawful purposes and in accordance with these Terms. You may not use the service to cheat or gain unfair advantages.</p>

          <h3>5. Intellectual Property</h3>
          <p>All content, features, and functionality are owned by Theory.AI and are protected by copyright and other intellectual property laws.</p>

          <h3>6. Disclaimer</h3>
          <p>The service is provided "as is" without warranties of any kind. We do not guarantee that the service will be error-free or uninterrupted.</p>

          <h3>7. Limitation of Liability</h3>
          <p>We are not liable for any damages arising from your use of the service, including but not limited to direct, indirect, or consequential damages.</p>

          <h3>8. Changes to Terms</h3>
          <p>We reserve the right to modify these Terms at any time. Continued use of the service constitutes acceptance of modified Terms.</p>

          <h3>9. Contact</h3>
          <p>For questions about these Terms, contact legal@theorycoach.com</p>
        </div>
      </div>
    </div>
  );

  // FAQ Sub-Page
  const renderFAQPage = () => (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <button className="settings-back-btn" onClick={handleBackToMain}>
          ←
        </button>
        <h2 className="settings-subpage-title">FAQ</h2>
      </div>

      <div className="settings-subpage-content">
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h3 className="faq-question">{faq.question}</h3>
              <p className="faq-answer">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Support Sub-Page
  const renderSupportPage = () => (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <button className="settings-back-btn" onClick={handleBackToMain}>
          ←
        </button>
        <h2 className="settings-subpage-title">Support</h2>
      </div>

      <div className="settings-subpage-content">
        <div className="support-content">
          <h3>Get Help</h3>
          <p>Need assistance? Send us a message and we'll get back to you as soon as possible.</p>

          {sendSuccess && (
            <div className="success-message">✅ Message sent successfully!</div>
          )}

          <div className="support-form">
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder={t_nested('settings.supportSubject')}
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder={t_nested('settings.supportMessage')}
                rows={6}
              />
            </div>

            <button
              className="send-support-btn"
              onClick={handleSendSupportEmail}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
          </div>

          <div className="support-info">
            <h3>Other Ways to Reach Us</h3>
            <p>📧 Email: support@theorycoach.com</p>
            <p>🌐 Website: www.theorycoach.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="main-layout">
      <main className="main-content settings-page">
        <div className="settings-container">
          {activePage === 'main' && renderMainMenu()}
          {activePage === 'account' && renderAccountPage()}
          {activePage === 'language' && renderLanguagePage()}
          {activePage === 'privacy' && renderPrivacyPage()}
          {activePage === 'terms' && renderTermsPage()}
          {activePage === 'faq' && renderFAQPage()}
          {activePage === 'support' && renderSupportPage()}
        </div>
      </main>
    </div>
  );
};
