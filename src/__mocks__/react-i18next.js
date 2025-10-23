// Mock for react-i18next
export const useTranslation = () => ({
  t: (key) => key,
  i18n: {
    language: 'en',
    changeLanguage: jest.fn(),
  },
});

export const initReactI18next = {
  type: '3rdParty',
  init: jest.fn(),
};


