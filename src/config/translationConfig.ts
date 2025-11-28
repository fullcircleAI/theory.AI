// Translation Configuration
export const translationConfig = {
  // API Keys (set these in your environment variables)
  apiKeys: {
    google: process.env.REACT_APP_GOOGLE_API_KEY || '',
    deepl: process.env.REACT_APP_DEEPL_API_KEY || '',
    openai: process.env.REACT_APP_OPENAI_API_KEY || ''
  },
  
  // Default settings
  defaults: {
    provider: process.env.REACT_APP_DEFAULT_TRANSLATION_PROVIDER || 'libretranslate',
    qualityThreshold: parseFloat(process.env.REACT_APP_TRANSLATION_QUALITY_THRESHOLD || '7.0'),
    enableAIEnhancement: process.env.REACT_APP_ENABLE_AI_ENHANCEMENT === 'true',
    cacheDuration: parseInt(process.env.REACT_APP_TRANSLATION_CACHE_DURATION || '3600000')
  },
  
  // Analytics settings
  analytics: {
    enabled: process.env.REACT_APP_ENABLE_TRANSLATION_ANALYTICS === 'true',
    endpoint: process.env.REACT_APP_TRANSLATION_METRICS_ENDPOINT || '/api/translation-metrics'
  },
  
  // Quality thresholds
  quality: {
    excellent: 9,
    good: 7,
    fair: 5,
    poor: 1
  },
  
  // Rate limits
  rateLimits: {
    google: 100, // requests per minute
    deepl: 50,
    libretranslate: 10,
    mymemory: 5
  }
};















