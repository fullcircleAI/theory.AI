// Free AI Service - No credit card required!
// Uses Hugging Face Inference API (completely free)

export interface AIExplanation {
  explanation: string;
  personalizedTips: string[];
  relatedConcepts: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIStudyPlan {
  personalizedPath: string[];
  estimatedTimeToPass: number;
  dailyGoals: string[];
  focusAreas: string[];
  motivation: string;
}

export interface AIAnalytics {
  examReadinessScore: number;
  predictedPassProbability: number;
  timeToExamReadiness: number;
  riskFactors: string[];
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface AITutorResponse {
  message: string;
  tone: 'encouraging' | 'motivational' | 'analytical' | 'supportive';
  actionItems: string[];
  nextSteps: string[];
}

class FreeAIService {
  // Upgraded to better free AI model - Google Flan-T5 for better instruction following
  private huggingFaceUrl = 'https://api-inference.huggingface.co/models/google/flan-t5-base';
  private fallbackModel = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
  
  // Conversation memory for context awareness
  private conversationHistory: Array<{role: 'user' | 'ai', message: string, timestamp: Date}> = [];
  private maxHistoryLength = 10; // Keep last 10 exchanges
  
  // Check if AI is available
  isAIAvailable(): boolean {
    return true; // Always available, no API key needed
  }

  // Add conversation to memory
  private addToHistory(role: 'user' | 'ai', message: string): void {
    this.conversationHistory.push({
      role,
      message,
      timestamp: new Date()
    });
    
    // Keep only recent history
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  // Get conversation context for AI
  private getConversationContext(): string {
    if (this.conversationHistory.length === 0) return '';
    
    const recentHistory = this.conversationHistory.slice(-5); // Last 5 exchanges
    return recentHistory.map(entry => 
      `${entry.role === 'user' ? 'User' : 'AI'}: ${entry.message}`
    ).join('\n');
  }

  // Clear conversation history
  clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  // Get conversation statistics
  getConversationStats(): {totalExchanges: number, lastInteraction: Date | null} {
    return {
      totalExchanges: this.conversationHistory.length,
      lastInteraction: this.conversationHistory.length > 0 ? this.conversationHistory[this.conversationHistory.length - 1].timestamp : null
    };
  }

  // Generate AI explanation for a question
  async generateExplanation(
    question: string,
    userAnswer: string,
    correctAnswer: string,
    explanation: string,
    userHistory: any[]
  ): Promise<AIExplanation> {
    try {
      // Use Hugging Face for AI response
      const prompt = `Question: ${question}
User Answer: ${userAnswer}
Correct Answer: ${correctAnswer}
Basic Explanation: ${explanation}

Provide a helpful explanation with tips.`;

      const aiResponse = await this.callHuggingFace(prompt);
      
      return {
        explanation: aiResponse || explanation,
        personalizedTips: [
          'Keep practicing similar questions',
          'Review the theory behind this topic',
          'Take notes on key concepts'
        ],
        relatedConcepts: ['Related traffic rules', 'Similar scenarios'],
        difficulty: 'medium'
      };
    } catch (error) {
      console.error('Free AI explanation error:', error);
      return this.getFallbackExplanation(explanation);
    }
  }

  // Generate personalized study plan
  async generateStudyPlan(userProgress: any): Promise<AIStudyPlan> {
    try {
      const prompt = `Create a study plan for Dutch driving theory based on this progress: ${JSON.stringify(userProgress)}`;
      const aiResponse = await this.callHuggingFace(prompt);
      
      return {
        personalizedPath: ['traffic-rules-signs', 'priority-rules', 'hazard-perception'],
        estimatedTimeToPass: 24,
        dailyGoals: [
          'Complete 1 practice test',
          'Review weak areas',
          'Take notes on mistakes'
        ],
        focusAreas: ['Priority rules', 'Traffic signs'],
        motivation: aiResponse || 'You\'re making great progress! Keep practicing to learn Dutch driving theory.'
      };
    } catch (error) {
      console.error('Free AI study plan error:', error);
      return this.getFallbackStudyPlan();
    }
  }

  // Generate AI analytics and predictions
  async generateAnalytics(userProgress: any): Promise<AIAnalytics> {
    // For now, return static analytics - can be enhanced with AI later
      return {
        examReadinessScore: 65,
        predictedPassProbability: 70,
        timeToExamReadiness: 12,
        riskFactors: ['Need more practice with priority rules'],
        recommendations: ['Focus on weak areas', 'Take more practice tests'],
        strengths: ['Good understanding of basic concepts'],
        weaknesses: ['Priority rules need improvement']
      };
  }

  // AI Tutor conversation - Enhanced with context awareness and smarter responses
  async getTutorResponse(userMessage: string, context: any): Promise<AITutorResponse> {
    // Add user message to conversation history
    this.addToHistory('user', userMessage);
    
    // Get current language from context or default to English
    // const currentLanguage = context?.language || 'en';
    
    try {
      // Enhanced Dutch driving theory keywords - More comprehensive (now unused but kept for future use)
      /*
      const dutchDrivingKeywords = [
        // CBR & Dutch Exam System
        'cbr', 'driving', 'theory', 'exam', 'test', 'practice', 'study', 'learn',
        'license', 'permit', 'rijbewijs', 'theorie', 'praktijk', 'rijexamen',
        'nederland', 'dutch', 'netherlands', 'holland', 'amsterdam', 'rotterdam',
        'cost', 'price', 'fee', 'how much', 'money', 'euro', '€', 'booking',
        'appointment', 'schedule', 'date', 'time', 'location', 'center',
        
        // Dutch Traffic Rules (Specific)
        'verkeer', 'verkeersregels', 'voorrang', 'voorrang verlenen', 'voorrang krijgen',
        'rechts gaat voor', 'rechtsaf', 'linksaf', 'rechtdoor', 'kruispunt',
        'rotonde', 'rotonde regels', 'rotonde voorrang', 'rotonde richtingaanwijzer',
        'snelheid', 'snelheidslimiet', 'bebouwde kom', 'buiten bebouwde kom',
        'autosnelweg', 'rijksweg', 'provinciale weg', 'gemeentelijke weg',
        
        // Dutch Road Signs & Markings
        'verkeersbord', 'verkeersborden', 'wegmarkering', 'wegmarkeringen',
        'waarschuwingsbord', 'verbodsbord', 'gebodsbord', 'informatiebord',
        'stopbord', 'voorrangsbord', 'snelheidsbord', 'parkeerbord',
        'witte lijn', 'gele lijn', 'onderbroken lijn', 'doorgetrokken lijn',
        'haaientanden', 'driehoek', 'driehoek bord', 'voorrang verlenen',
        
        // Dutch Traffic Lights & Signals
        'verkeerslicht', 'stoplicht', 'rood licht', 'oranje licht', 'groen licht',
        'geel licht', 'amber licht', 'knipperend licht', 'knipperend oranje',
        'verkeersregelinstallatie', 'vri', 'intelligente verkeerslichten',
        
        // Dutch Road Types & Infrastructure
        'autoweg', 'autosnelweg', 'rijksweg', 'provinciale weg', 'gemeentelijke weg',
        'woonerf', 'zone 30', 'zone 50', 'zone 60', 'zone 80', 'zone 100',
        'fietspad', 'voetpad', 'trottoir', 'rijbaan', 'rijstrook', 'spitsstrook',
        'vluchtstrook', 'pechstrook', 'invoegstrook', 'uitvoegstrook',
        
        // Dutch Priority & Right of Way
        'voorrang', 'voorrang verlenen', 'voorrang krijgen', 'rechts gaat voor',
        'rechtsaf gaat voor', 'linksaf gaat voor', 'rechtdoor gaat voor',
        'kruispunt voorrang', 'rotonde voorrang', 'tram voorrang',
        'voetganger voorrang', 'fietser voorrang', 'bus voorrang',
        
        // Dutch Speed Limits & Zones
        'snelheidslimiet', 'maximum snelheid', 'zone 30', 'zone 50', 'zone 60',
        'zone 80', 'zone 100', 'zone 130', 'bebouwde kom', 'buiten bebouwde kom',
        'autosnelweg snelheid', 'rijksweg snelheid', 'woonerf snelheid',
        'schoolzone', 'schoolomgeving', 'kinderen', 'spelende kinderen',
        
        // Dutch Parking & Stopping
        'parkeren', 'stilstaan', 'parkeerplaats', 'parkeerzone', 'betaald parkeren',
        'gratis parkeren', 'parkeerschijf', 'parkeermeter', 'parkeerautomaat',
        'gehandicaptenparkeerplaats', 'laadpaal', 'elektrisch parkeren',
        
        // Dutch Vehicle Types & Rules
        'auto', 'personenauto', 'bestelauto', 'vrachtwagen', 'bus', 'tram',
        'fiets', 'bromfiets', 'snorfiets', 'motor', 'motorfiets', 'scooter',
        'elektrische fiets', 'e-bike', 'speed pedelec', 'bakfiets', 'cargo bike',
        
        // Dutch Safety & Behavior
        'veiligheid', 'verkeersveiligheid', 'gordel', 'veiligheidsgordel',
        'helm', 'fietshelm', 'motorhelm', 'spiegel', 'buitenspiegel', 'binnenspiegel',
        'dode hoek', 'dodehoek', 'uitkijken', 'kijken', 'spiegelen',
        'alcohol', 'alcoholpromillage', 'drank', 'drugs', 'vermoeidheid',
        'concentratie', 'afleiding', 'telefoon', 'mobiel', 'app', 'whatsapp',
        
        // Dutch Weather & Conditions
        'weer', 'weersomstandigheden', 'regen', 'sneeuw', 'ijzel', 'mist',
        'zicht', 'zichtbaarheid', 'nat wegdek', 'glad wegdek', 'winterbanden',
        'zomerbanden', 'all season banden', 'bandenspanning', 'profiel',
        
        // Dutch Documents & Legal
        'documenten', 'rijbewijs', 'kenteken', 'kentekenbewijs', 'apk',
        'verzekering', 'wa verzekering', 'casco verzekering', 'boete',
        'verkeersboete', 'parkeerboete', 'snelheidsboete', 'politie',
        'handhaving', 'verkeershandhaving', 'camera', 'flitspaal', 'snelheidscamera'
      ];
      */
      
      // Get lowercase message for easier matching
      const lowerMessage = userMessage.toLowerCase();
      
      // FIRST: Check for specific CBR exam questions (HIGHEST PRIORITY)
      if (lowerMessage.includes('how much') || lowerMessage.includes('cost') || lowerMessage.includes('price') || 
          lowerMessage.includes('fee') || lowerMessage.includes('money') || lowerMessage.includes('euro') || 
          lowerMessage.includes('€') || lowerMessage.includes('cbr exam cost') || lowerMessage.includes('exam price')) {
        return {
          message: "💰 CBR Exam Cost & Pricing:\n\n**Theory Exam Cost:**\n• **€37.50** (2024 price)\n• Pay online when booking\n• No additional fees\n\n**What's Included:**\n• 25 multiple choice questions\n• 30 minutes exam time\n• Immediate results\n• Certificate valid for 1.5 years\n\n**Payment Methods:**\n• Credit card (Visa, Mastercard)\n• Debit card (Maestro)\n• iDEAL (Dutch online banking)\n• PayPal\n\n**Retake Costs:**\n• Each retake: €37.50\n• No limit on retakes\n• Wait 2 weeks between attempts\n\n**Pro Tip**: Book early to get your preferred date - popular slots fill up quickly!",
          tone: 'encouraging',
          actionItems: ['Check cbr.nl for current prices', 'Prepare payment method', 'Book your preferred date'],
          nextSteps: ['Book your exam', 'Continue practicing', 'Prepare for success']
        };
      }
      
      // Check for other CBR exam questions
      if (lowerMessage.includes('cbr exam') || lowerMessage.includes('exam format') || lowerMessage.includes('how many questions') || 
          lowerMessage.includes('exam time') || lowerMessage.includes('pass mark') || lowerMessage.includes('exam structure')) {
        return {
          message: "📋 CBR Theory Exam Format:\n\n**Structure:**\n• 25 multiple choice questions\n• 30 minutes total time\n• Computer-based at CBR test center\n\n**Pass Requirements:**\n• Need 13+ correct answers (52%+)\n• But aim for 80%+ for confidence!\n\n**Question Types:**\n• Traffic rules & regulations\n• Road signs & markings\n• Priority & right of way\n• Safety & hazard perception\n\n**Tips:**\n• Read questions carefully\n• Use elimination method\n• Don't rush - you have time\n• Trust your preparation!",
          tone: 'encouraging',
          actionItems: ['Practice with 25-question tests', 'Time yourself on practice tests', 'Review all question types'],
          nextSteps: ['Take mock exams', 'Build exam confidence', 'Book your real exam when ready']
        };
      }
      
      // REMOVED FALLBACK - Let the chatbot answer all questions like ChatGPT
      
      // Use smart contextual responses FIRST (more reliable than Hugging Face)
      const currentPage = context?.currentTest || 'dashboard';
      const userProgress = context?.userProgress || {};
      
      // Get smart response based on user message
      const smartResponse = this.getSmartFallbackResponse(userMessage, currentPage, userProgress);
      
      // Add response to conversation history
      this.addToHistory('ai', smartResponse.message);
      
      return smartResponse;
      
    } catch (error) {
      console.error('Free AI tutor error:', error);
      return this.getSmartFallbackResponse(userMessage, context?.currentTest || 'dashboard', context?.userProgress || {});
    }
  }

  // Call Hugging Face API (FREE!) - Enhanced with fallback model
  private async callHuggingFace(prompt: string): Promise<string> {
    try {
      // Try primary model first
      const response = await this.tryHuggingFaceModel(this.huggingFaceUrl, prompt);
      if (response) return response;
      
      // If primary fails, try fallback model
      console.log('Primary model failed, trying fallback...');
      return await this.tryHuggingFaceModel(this.fallbackModel, prompt);
      
    } catch (error) {
      console.error('Both AI models failed:', error);
      return '';
    }
  }

  // Try a specific Hugging Face model
  private async tryHuggingFaceModel(modelUrl: string, prompt: string): Promise<string> {
    try {
      // Add timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CBR-AI-Coach/1.0'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 120, // Shorter for CBR focus
            temperature: 0.6, // Lower for more consistent responses
            do_sample: true,
            top_p: 0.9,
            repetition_penalty: 1.1
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 503) {
          // Model is loading, return empty to try fallback
          return '';
        }
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Enhanced text extraction
      let generatedText = '';
      
      if (Array.isArray(data) && data.length > 0) {
        generatedText = data[0].generated_text || data[0].text || '';
      } else if (data.generated_text) {
        generatedText = data.generated_text;
      } else if (data.text) {
        generatedText = data.text;
      }
      
      // Clean up the response
      if (generatedText) {
        // Remove the original prompt from the response
        generatedText = generatedText.replace(prompt, '').trim();
        
        // Ensure it's CBR-related
        if (this.isCBRRelated(generatedText)) {
          return generatedText;
        }
      }
      
      return ''; // Return empty if not CBR-related
    } catch (error) {
      console.error('Hugging Face model failed:', error);
      return ''; // Return empty string to try fallback
    }
  }

  // Check if generated text is CBR-related
  private isCBRRelated(text: string): boolean {
    const cbrIndicators = [
      'traffic', 'road', 'sign', 'rule', 'driving', 'cbr', 'vehicle', 'safety',
      'priority', 'speed', 'parking', 'roundabout', 'intersection', 'highway',
      'license', 'exam', 'test', 'practice', 'theory', 'regulation'
    ];
    
    const lowerText = text.toLowerCase();
    return cbrIndicators.some(indicator => lowerText.includes(indicator));
  }

  // Fallback methods when AI is not available
  private getFallbackExplanation(explanation: string): AIExplanation {
    return {
      explanation: explanation,
      personalizedTips: ['Keep practicing similar questions', 'Review the theory behind this topic'],
      relatedConcepts: ['Related traffic rules', 'Similar scenarios'],
      difficulty: 'medium'
    };
  }

  private getFallbackStudyPlan(): AIStudyPlan {
    return {
      personalizedPath: ['traffic-rules-signs', 'priority-rules', 'hazard-perception'],
      estimatedTimeToPass: 24,
      dailyGoals: ['Complete 1 practice test', 'Review weak areas', 'Take notes on mistakes'],
      focusAreas: ['Priority rules', 'Traffic signs'],
      motivation: 'You\'re making great progress! Keep practicing to learn Dutch driving theory.'
    };
  }

  private getFallbackAnalytics(): AIAnalytics {
    return {
      examReadinessScore: 65,
      predictedPassProbability: 70,
      timeToExamReadiness: 12,
      riskFactors: ['Need more practice with priority rules'],
      recommendations: ['Focus on weak areas', 'Take more practice tests'],
      strengths: ['Good understanding of basic concepts'],
      weaknesses: ['Priority rules need improvement']
    };
  }

  private getFallbackTutorResponse(): AITutorResponse {
    return {
      message: 'Keep practicing your driving theory! Focus on traffic rules, road signs, and CBR exam preparation. You\'re making great progress!',
      tone: 'encouraging',
      actionItems: ['Complete today\'s practice test', 'Review traffic rules', 'Study road signs'],
      nextSteps: ['Focus on weak areas', 'Take a mock exam', 'Practice priority rules']
    };
  }

  // Enhanced fallback with mock exam motivation
  private getMockExamMotivatedResponse(): AITutorResponse {
    return {
      message: 'Excellent progress! You\'re ready to test your knowledge with a mock exam. This will help you see how well you\'ve mastered the material!',
      tone: 'motivational',
      actionItems: ['Start a mock exam', 'Review your strong areas', 'Practice any weak spots'],
      nextSteps: ['Take Mock Exam 1', 'Focus on exam readiness', 'Build confidence']
    };
  }

  // Enhanced response processing
  private enhanceResponse(aiResponse: string, currentPage: string, userProgress: any): string {
    if (!aiResponse || aiResponse.trim().length < 10) {
      return this.getContextualFallbackMessage(currentPage);
    }

    // Clean up the response
    let cleanedResponse = aiResponse.trim();
    
    // Remove any non-CBR content
    if (this.containsNonCBRContent(cleanedResponse)) {
      return this.getContextualFallbackMessage(currentPage);
    }

    // Add contextual encouragement
    const encouragement = this.getContextualEncouragement(currentPage, userProgress);
    
    return `${cleanedResponse}\n\n${encouragement}`;
  }

  // Check if response contains non-CBR content
  private containsNonCBRContent(response: string): boolean {
    const nonCBRTerms = [
      'cooking', 'recipe', 'food', 'movie', 'music', 'sports', 'politics',
      'weather forecast', 'news', 'entertainment', 'shopping', 'travel',
      'health advice', 'medical', 'relationship', 'dating', 'personal'
    ];
    
    return nonCBRTerms.some(term => 
      response.toLowerCase().includes(term.toLowerCase())
    );
  }

  // Get contextual action items based on current page
  private getContextualActionItems(currentPage: string): string[] {
    switch (currentPage) {
      case 'dashboard':
        return ['Check your progress', 'Start a practice test', 'Review weak areas'];
      case 'practice-tests':
      case 'tests-page':
        return ['Choose a practice test', 'Focus on weak topics', 'Take a mock exam'];
      default:
        if (currentPage.startsWith('practice-')) {
          return ['Continue this test', 'Review explanations', 'Take notes'];
        }
        return ['Practice more', 'Review theory', 'Take a test'];
    }
  }

  // Get contextual next steps based on page and progress
  private getContextualNextSteps(currentPage: string, userProgress: any): string[] {
    const averageScore = userProgress?.averageScore || 0;
    
    if (averageScore < 60) {
      return ['Focus on basic concepts', 'Take easier tests first', 'Review theory thoroughly'];
    } else if (averageScore < 80) {
      return ['Practice weak areas', 'Take mock exams', 'Review mistakes'];
    } else {
      return ['Take advanced tests', 'Practice mock exams', 'Prepare for real exam'];
    }
  }

  // Get localized responses based on language
  private getLocalizedResponse(language: string, messageType: string, userProgress?: any): AITutorResponse {
    const averageScore = userProgress?.averageScore || 0;
    
    switch (language) {
      case 'nl': // Dutch
        return this.getDutchResponse(messageType, averageScore);
      case 'ar': // Arabic
        return this.getArabicResponse(messageType, averageScore);
      default: // English
        return this.getEnglishResponse(messageType, averageScore);
    }
  }

  // Dutch responses
  private getDutchResponse(messageType: string, averageScore: number): AITutorResponse {
    if (messageType === 'help' || messageType === 'general') {
      if (averageScore < 30) {
        return {
          message: `Hoi! Ik ben je persoonlijke theorie coach! Omdat je net begint (${averageScore}% gemiddeld), kan ik je helpen met:\n\n🎯 **Start Slim**: Begin met Verkeersregels & Borden - dit is de basis\n🎯 **Bouw Geleidelijk**: Beheers één onderwerp op 80%+ voordat je verder gaat\n🎯 **Oefen Dagelijks**: 10-15 vragen per dag is beter dan blokken\n\n**Je persoonlijke doel**: Bereik 70%+ gemiddeld om oefenexamens te ontgrendelen!\n\nWelk specifiek onderwerp wil je hulp bij?`,
          tone: 'encouraging',
          actionItems: ['Start met Verkeersregels & Borden', 'Stel een dagelijks oefendoel', 'Volg je voortgang'],
          nextSteps: ['Doe je eerste oefentoets', 'Focus op begrip, niet op snelheid', 'Bouw consistentie op']
        };
      } else if (averageScore < 70) {
        return {
          message: `Uitstekende voortgang! Je zit op ${averageScore}% gemiddeld - goed op weg! Hier is hoe ik je kan helpen naar 70%+:\n\n🎯 **Focus op Zwakke Gebieden**: Bekijk je dashboard voor persoonlijke aanbevelingen\n🎯 **Beheers Elk Onderwerp**: Streef naar 80%+ in elk gebied voordat je verder gaat\n🎯 **Bouw Consistentie**: Oefen dagelijks om momentum te behouden\n\n**Je bent ${70 - averageScore}% verwijderd van het ontgrendelen van oefenexamens!**\n\nWelk specifiek gebied wil je verbeteren?`,
          tone: 'motivational',
          actionItems: ['Bekijk je dashboard inzichten', 'Focus op je zwakste gebied', 'Oefen dagelijks'],
          nextSteps: ['Doe een oefentoets', 'Bekijk je fouten', 'Bouw naar 70%+']
        };
      } else {
        return {
          message: `Uitstekend! Je zit op ${averageScore}% gemiddeld - klaar voor het volgende niveau! 🎉\n\n🎯 **Je bent klaar voor oefenexamens!** - Dit is waar je je echte examengereedheid test\n🎯 **Focus op examenstategie** - Tijdmanagement en drukbehandeling\n🎯 **Polijst je zwakke punten** - Zelfs kleine verbeteringen tellen\n\n**Je doel**: Sla alle 3 oefenexamens om echt examengereed te zijn!\n\nWaar wil je volgende aan werken?`,
          tone: 'motivational',
          actionItems: ['Start een oefenexamen', 'Bekijk je sterke gebieden', 'Polijst eventuele zwakke punten'],
          nextSteps: ['Doe Oefenexamen 1', 'Bouw examenzelfvertrouwen', 'Bereid je voor op het echte ding']
        };
      }
    }
    
    return {
      message: "Ik ben hier om te helpen met je theoriestudie! Ik kan uitleggen:\n\n• Verkeersregels en voorschriften\n• Wegmarkeringen en borden\n• Voorrang en voorrang verlenen\n• Snelheidslimieten en veiligheid\n• Rotondes en kruispunten\n\nWelk specifiek onderwerp wil je hulp bij?",
      tone: 'supportive',
      actionItems: ['Vraag over specifieke onderwerpen', 'Doe oefentoetsen'],
      nextSteps: ['Studieer zwakke gebieden', 'Oefen regelmatig']
    };
  }

  // Arabic responses
  private getArabicResponse(messageType: string, averageScore: number): AITutorResponse {
    if (messageType === 'help' || messageType === 'general') {
      if (averageScore < 30) {
        return {
          message: `مرحباً! أنا مدربك الشخصي في النظرية! بما أنك تبدأ للتو (${averageScore}% متوسط)، يمكنني مساعدتك في:\n\n🎯 **ابدأ بذكاء**: ابدأ بقواعد المرور والعلامات - هذا هو الأساس\n🎯 **ابن تدريجياً**: أتقن موضوعاً واحداً بنسبة 80%+ قبل الانتقال\n🎯 **تدرب يومياً**: 10-15 سؤال يومياً أفضل من الحفظ\n\n**هدفك الشخصي**: وصل إلى 70%+ متوسط لفتح الامتحانات التجريبية!\n\nما الموضوع المحدد الذي تريد المساعدة فيه؟`,
          tone: 'encouraging',
          actionItems: ['ابدأ بقواعد المرور والعلامات', 'ضع هدف تدريب يومي', 'تتبع تقدمك'],
          nextSteps: ['خذ أول اختبار تدريبي', 'ركز على الفهم، ليس السرعة', 'ابن الثبات']
        };
      } else if (averageScore < 70) {
        return {
          message: `تقدم ممتاز! أنت على ${averageScore}% متوسط - في الطريق الصحيح! إليك كيف يمكنني مساعدتك للوصول إلى 70%+:\n\n🎯 **ركز على المناطق الضعيفة**: تحقق من لوحة التحكم للحصول على توصيات شخصية\n🎯 **أتقن كل موضوع**: اهدف إلى 80%+ في كل منطقة قبل الانتقال\n🎯 **ابن الثبات**: تدرب يومياً للحفاظ على الزخم\n\n**أنت على بعد ${70 - averageScore}% من فتح الامتحانات التجريبية!**\n\nما المنطقة المحددة التي تريد تحسينها؟`,
          tone: 'motivational',
          actionItems: ['تحقق من رؤى لوحة التحكم', 'ركز على أضعف منطقة', 'تدرب يومياً'],
          nextSteps: ['خذ اختبار تدريبي', 'راجع أخطاءك', 'ابن نحو 70%+']
        };
      } else {
        return {
          message: `ممتاز! أنت على ${averageScore}% متوسط - جاهز للمستوى التالي! 🎉\n\n🎯 **أنت جاهز للامتحانات التجريبية!** - هذا حيث تختبر جاهزيتك الحقيقية للامتحان\n🎯 **ركز على استراتيجية الامتحان** - إدارة الوقت والتعامل مع الضغط\n🎯 **صقل نقاط ضعفك** - حتى التحسينات الصغيرة مهمة\n\n**هدفك**: اجتاز جميع الامتحانات التجريبية الثلاثة لتكون جاهزاً حقاً للامتحان!\n\nما الذي تريد العمل عليه بعد ذلك؟`,
          tone: 'motivational',
          actionItems: ['ابدأ امتحان تجريبي', 'راجع مناطق قوتك', 'صقل أي نقاط ضعف'],
          nextSteps: ['خذ الامتحان التجريبي 1', 'ابن ثقة الامتحان', 'استعد للشيء الحقيقي']
        };
      }
    }
    
    return {
      message: "أنا هنا للمساعدة في دراستك النظرية! يمكنني شرح:\n\n• قواعد المرور واللوائح\n• علامات الطريق والرموز\n• الأولوية وحق المرور\n• حدود السرعة والسلامة\n• الدوارات والتقاطعات\n\nما الموضوع المحدد الذي تريد المساعدة فيه؟",
      tone: 'supportive',
      actionItems: ['اسأل عن مواضيع محددة', 'خذ اختبارات تدريبية'],
      nextSteps: ['ادرس المناطق الضعيفة', 'تدرب بانتظام']
    };
  }

  // English responses (existing logic)
  private getEnglishResponse(messageType: string, averageScore: number): AITutorResponse {
    // This will use the existing English responses
    return {
      message: "I'm here to help with your driving theory! I can explain:\n\n• Traffic rules and regulations\n• Road signs and markings\n• Priority and right of way\n• Speed limits and safety\n• Roundabouts and intersections\n\nWhat specific topic would you like help with?",
      tone: 'supportive',
      actionItems: ['Ask about specific topics', 'Take practice tests'],
      nextSteps: ['Study weak areas', 'Practice regularly']
    };
  }

  // Get contextual encouragement based on page
  private getContextualEncouragement(currentPage: string, userProgress: any): string {
    const averageScore = userProgress?.averageScore || 0;
    
    if (averageScore < 60) {
      return "Don't worry! Everyone starts somewhere. Keep practicing and you'll improve!";
    } else if (averageScore < 80) {
      return "Great progress! You're on the right track. Keep practicing to reach 80%+";
    } else {
      return "Excellent work! You're almost ready for the real CBR exam!";
    }
  }

  // Get contextual fallback message
  private getContextualFallbackMessage(currentPage: string): string {
    switch (currentPage) {
      case 'dashboard':
        return "I can help you understand your progress and suggest what to study next. What specific area would you like help with?";
      case 'practice-tests':
      case 'tests-page':
        return "I can help you choose the right practice test or explain any driving theory concepts. What would you like to know?";
      default:
        if (currentPage.startsWith('practice-')) {
          return "I can help explain this question or any driving theory concept. What would you like to know?";
        }
        return "I'm here to help with your driving theory studies. What can I help you with?";
    }
  }

  // Smart fallback responses for common driving theory questions
  private getSmartFallbackResponse(userMessage: string, currentPage: string, userProgress: any): AITutorResponse {
    const lowerMessage = userMessage.toLowerCase();
    const averageScore = userProgress?.averageScore || 0;
    
    // Personalized responses based on user progress
    if (lowerMessage.includes('focus') || lowerMessage.includes('start') || lowerMessage.includes('begin')) {
      if (averageScore < 30) {
        return {
          message: `Perfect! Let's build your foundation. Since you're just starting (${averageScore}% average), I recommend:\n\n🎯 **Start with Traffic Rules & Signs** - This is the foundation of everything\n🎯 **Then Priority Rules** - Essential for Dutch driving\n🎯 **Practice 10-15 questions daily** - Consistency beats intensity\n\nYour goal: Reach 70%+ in these basics, then unlock mock exams!`,
          tone: 'encouraging',
          actionItems: ['Start with Traffic Rules & Signs', 'Set daily practice goal', 'Track your progress'],
          nextSteps: ['Take your first practice test', 'Focus on understanding, not speed']
        };
      } else if (averageScore < 70) {
        return {
          message: `Great progress! You're at ${averageScore}% average. Here's your personalized path:\n\n🎯 **Focus on your weakest area** - Check your dashboard insights\n🎯 **Aim for 80%+ in each topic** - Mastery before moving on\n🎯 **Take practice tests daily** - Build consistency\n\nYou're ${70 - averageScore}% away from unlocking mock exams!`,
          tone: 'motivational',
          actionItems: ['Check your dashboard insights', 'Focus on weak areas', 'Practice daily'],
          nextSteps: ['Take a practice test', 'Review your mistakes', 'Build toward 70%+']
        };
      } else {
        return this.getMockExamMotivatedResponse();
      }
    }
    
    // Check if user is ready for mock exams and provide motivation
    if (averageScore >= 70) {
      // User is ready for mock exams - provide motivation
      if (lowerMessage.includes('ready') || lowerMessage.includes('exam') || lowerMessage.includes('test') || 
          lowerMessage.includes('mock') || lowerMessage.includes('practice') || lowerMessage.includes('next')) {
        return this.getMockExamMotivatedResponse();
      }
    }
    
    // Dutch Traffic Lights - ChatGPT style
    if (lowerMessage.includes('traffic light') || lowerMessage.includes('red light') || lowerMessage.includes('amber') || 
        lowerMessage.includes('verkeerslicht') || lowerMessage.includes('stoplicht') || lowerMessage.includes('rood licht')) {
      return {
        message: `Ah, verkeerslichten! 🚦 These are crucial for Dutch driving theory. Let me explain the Dutch system:\n\n**Dutch Traffic Light Rules:**\n• **ROOD (Red)**: Stop completely behind the stop line - no exceptions!\n• **ORANJE (Amber)**: Prepare to stop unless it's unsafe to brake\n• **GROEN (Green)**: You may proceed if safe and clear\n\n**Special Dutch Features:**\n• **Rood + Oranje together**: Stop - groen is coming next (unique to Netherlands!)\n• **Knipperend oranje**: Proceed with caution (often at pedestrian crossings)\n• **Intelligente verkeerslichten**: Smart lights that adapt to traffic flow\n\n**Pro Tip**: Dutch drivers are very strict about red lights - never run them! The fines are steep (€370) and you'll fail your exam instantly.\n\n**For your CBR exam**: Focus on the timing - you have 1.2 minutes per question, so don't overthink traffic lights!`,
        tone: 'encouraging',
        actionItems: ['Practice traffic light scenarios', 'Study the red+amber combination', 'Learn about smart traffic lights'],
        nextSteps: ['Take a practice test on traffic lights', 'Review priority rules', 'Build confidence with timing']
      };
    }
    
    // Dutch Priority Rules - ChatGPT style
    if (lowerMessage.includes('priority') || lowerMessage.includes('right of way') || lowerMessage.includes('give way') || 
        lowerMessage.includes('voorrang') || lowerMessage.includes('rechts gaat voor') || lowerMessage.includes('kruispunt')) {
      return {
        message: `Voorrang! 🚗 This is the heart of Dutch driving theory. Let me break it down for you:\n\n**The Golden Rule: "Rechts gaat voor" (Right goes first)**\n• **At equal intersections**: Traffic from your RIGHT has priority\n• **Exception**: When signs or markings say otherwise\n• **Remember**: "Rechts gaat voor" is the default rule!\n\n**Dutch Priority Hierarchy:**\n1. **Emergency vehicles** (ambulance, police, fire) - always!\n2. **Trams** - they have their own tracks and rules\n3. **Traffic from the right** - the fundamental rule\n4. **Main road traffic** - when you're on a side road\n5. **Pedestrians at crossings** - they have priority\n\n**Key Dutch Signs:**\n• **Driehoek (triangle)**: Give way - voorrang verlenen\n• **Stop bord**: Complete stop required\n• **Voorrangsbord**: You have priority on this road\n\n**Pro Tip**: Dutch drivers are very predictable - they follow the rules strictly. Learn the patterns and you'll be fine!\n\n**For your CBR exam**: This is 30% of all questions - master this and you're halfway there!`,
        tone: 'encouraging',
        actionItems: ['Practice "rechts gaat voor" scenarios', 'Study Dutch priority signs', 'Learn tram priority rules'],
        nextSteps: ['Take priority rules practice test', 'Review intersection scenarios', 'Build confidence with Dutch rules']
      };
    }
    
    // Dutch Speed Limits - ChatGPT style
    if (lowerMessage.includes('speed') || lowerMessage.includes('limit') || lowerMessage.includes('km/h') || 
        lowerMessage.includes('snelheid') || lowerMessage.includes('snelheidslimiet') || lowerMessage.includes('zone')) {
      return {
        message: `Snelheidslimieten! 🏁 Dutch speed limits are quite specific and different from other countries. Here's the complete guide:\n\n**Dutch Speed Limit System:**\n• **Bebouwde kom (Built-up areas)**: 50 km/h default\n• **Buiten bebouwde kom (Outside built-up)**: 80 km/h default\n• **Autosnelweg (Motorway)**: 100-130 km/h (check signs!)\n• **Zone 30**: Residential areas, schools, hospitals\n• **Zone 50**: Urban areas, city centers\n• **Zone 60**: Some rural roads\n• **Zone 80**: Country roads, provincial roads\n\n**Special Dutch Zones:**\n• **Woonerf**: 15 km/h (residential areas with shared space)\n• **Schoolomgeving**: 30 km/h (school zones)\n• **Zone 30**: Often in residential areas\n\n**Key Dutch Rules:**\n• **Signs override everything** - always check for speed limit signs\n• **Flitspaal (speed camera)**: Very common - they're everywhere!\n• **Handhaving**: Traffic enforcement is strict\n• **Boete**: Fines start at €35 and go up to €370+\n\n**Pro Tip**: Dutch drivers are very conscious of speed limits. Follow them religiously - it's not just about the fine, it's about safety!\n\n**For your CBR exam**: Speed questions are 20% of the test - know your zones!`,
        tone: 'encouraging',
        actionItems: ['Learn all Dutch speed zones', 'Study speed limit signs', 'Practice speed calculation questions'],
        nextSteps: ['Take speed & safety practice test', 'Review Dutch road types', 'Build confidence with speed limits']
      };
    }
    
    // Dutch Roundabouts - ChatGPT style
    if (lowerMessage.includes('roundabout') || lowerMessage.includes('rotonde') || lowerMessage.includes('rotonde regels')) {
      return {
        message: `Rotondes! 🔄 These are everywhere in the Netherlands and have very specific rules. Let me explain the Dutch system:\n\n**Dutch Roundabout Rules (Rotonde Regels):**\n• **Voorrang verlenen**: Give way to traffic already ON the roundabout\n• **Richtingaanwijzer**: Signal LEFT when entering (if going left or straight)\n• **Uitvoegen**: Signal RIGHT when exiting\n• **Rechts houden**: Keep to the right lane unless signs indicate otherwise\n\n**Dutch Roundabout Types:**\n• **Kleine rotonde**: Small roundabout - usually single lane\n• **Grote rotonde**: Large roundabout - multiple lanes\n• **Turborotonde**: Turbo roundabout - special lane markings\n• **Rotonde met verkeerslichten**: Roundabout with traffic lights\n\n**Key Dutch Rules:**\n• **Traffic ON the roundabout has priority** - always!\n• **Signal LEFT when entering** - this is unique to Netherlands!\n• **Signal RIGHT when exiting** - standard rule\n• **Check your mirrors** - especially the dode hoek (blind spot)\n\n**Pro Tip**: Dutch roundabouts are very predictable. Learn the pattern: give way → signal left → enter → signal right → exit. Practice this sequence!\n\n**For your CBR exam**: Roundabouts are 15% of questions - master the signaling!`,
        tone: 'encouraging',
        actionItems: ['Practice roundabout signaling', 'Study Dutch roundabout types', 'Learn the entry/exit sequence'],
        nextSteps: ['Take roundabout practice test', 'Review Dutch traffic rules', 'Build confidence with signaling']
      };
    }
    
    // CBR Exam Format Questions
    if (lowerMessage.includes('cbr exam') || lowerMessage.includes('exam format') || lowerMessage.includes('how many questions') || 
        lowerMessage.includes('exam time') || lowerMessage.includes('pass mark') || lowerMessage.includes('exam structure')) {
      return {
        message: "📋 CBR Theory Exam Format:\n\n**Structure:**\n• 25 multiple choice questions\n• 30 minutes total time\n• Computer-based at CBR test center\n\n**Pass Requirements:**\n• Need 13+ correct answers (52%+)\n• But aim for 80%+ for confidence!\n\n**Question Types:**\n• Traffic rules & regulations\n• Road signs & markings\n• Priority & right of way\n• Safety & hazard perception\n\n**Tips:**\n• Read questions carefully\n• Use elimination method\n• Don't rush - you have time\n• Trust your preparation!",
        tone: 'encouraging',
        actionItems: ['Practice with 25-question tests', 'Time yourself on practice tests', 'Review all question types'],
        nextSteps: ['Take mock exams', 'Build exam confidence', 'Book your real exam when ready']
      };
    }
    
    // CBR Exam Cost & Price Questions
    if (lowerMessage.includes('how much') || lowerMessage.includes('cost') || lowerMessage.includes('price') || 
        lowerMessage.includes('fee') || lowerMessage.includes('money') || lowerMessage.includes('euro') || 
        lowerMessage.includes('€') || lowerMessage.includes('cbr exam cost') || lowerMessage.includes('exam price')) {
      return {
        message: "💰 CBR Exam Cost & Pricing:\n\n**Theory Exam Cost:**\n• **€37.50** (2024 price)\n• Pay online when booking\n• No additional fees\n\n**What's Included:**\n• 25 multiple choice questions\n• 30 minutes exam time\n• Immediate results\n• Certificate valid for 1.5 years\n\n**Payment Methods:**\n• Credit card (Visa, Mastercard)\n• Debit card (Maestro)\n• iDEAL (Dutch online banking)\n• PayPal\n\n**Retake Costs:**\n• Each retake: €37.50\n• No limit on retakes\n• Wait 2 weeks between attempts\n\n**Pro Tip**: Book early to get your preferred date - popular slots fill up quickly!",
        tone: 'encouraging',
        actionItems: ['Check cbr.nl for current prices', 'Prepare payment method', 'Book your preferred date'],
        nextSteps: ['Book your exam', 'Continue practicing', 'Prepare for success']
      };
    }
    
    // CBR Exam Booking & Process
    if (lowerMessage.includes('book exam') || lowerMessage.includes('exam booking') || lowerMessage.includes('cbr appointment') || 
        lowerMessage.includes('exam location') || lowerMessage.includes('how to book') || lowerMessage.includes('appointment')) {
      return {
        message: "📅 CBR Exam Booking Process:\n\n**How to Book:**\n• Visit cbr.nl (official website)\n• Create account with DigiD\n• Choose test center & date\n• Pay €37.50 (2024 price)\n\n**What to Bring:**\n• Valid ID (passport/ID card)\n• Confirmation email\n• Arrive 15 minutes early\n\n**Test Centers:**\n• Available in most major cities\n• Choose closest to you\n• Book 2-4 weeks in advance\n\n**After the Exam:**\n• Results immediately\n• Valid for 1.5 years\n• Start practical lessons!",
        tone: 'supportive',
        actionItems: ['Check cbr.nl for available dates', 'Prepare your documents', 'Practice until confident'],
        nextSteps: ['Book your exam', 'Continue practicing', 'Prepare for success']
      };
    }
    
    // CBR Exam Preparation Strategy
    if (lowerMessage.includes('prepare') || lowerMessage.includes('study plan') || lowerMessage.includes('exam strategy') || 
        lowerMessage.includes('ready') || lowerMessage.includes('when to book')) {
      return {
        message: "🎯 CBR Exam Preparation Strategy:\n\n**Phase 1: Foundation (0-60%)**\n• Master traffic rules & signs\n• Practice 10-15 questions daily\n• Focus on understanding concepts\n\n**Phase 2: Building (60-80%)**\n• Take full practice tests\n• Review all mistakes thoroughly\n• Build consistency\n\n**Phase 3: Exam Ready (80%+)**\n• Take mock exams regularly\n• Time yourself (30 minutes)\n• Build exam confidence\n\n**When to Book:**\n• Consistently score 80%+ on practice tests\n• Pass all 3 mock exams\n• Feel confident and ready!\n\n**Exam Day Tips:**\n• Get good sleep\n• Eat breakfast\n• Arrive early\n• Stay calm and focused!",
        tone: 'motivational',
        actionItems: ['Check your current progress', 'Set daily study goals', 'Take practice tests'],
        nextSteps: ['Build toward 80%+', 'Take mock exams', 'Book when ready']
      };
    }
    
    // Common CBR Exam Questions
    if (lowerMessage.includes('difficult') || lowerMessage.includes('hard') || lowerMessage.includes('challenging') || 
        lowerMessage.includes('struggle')) {
      return {
        message: "💪 CBR Exam Difficulty - You Can Do This!\n\n**Why It Feels Hard:**\n• New concepts and rules to learn\n• Different from your home country\n• Pressure of timed exam\n• Fear of failure\n\n**Success Strategies:**\n• Start with basics - don't rush\n• Practice daily - consistency is key\n• Learn from mistakes - don't repeat them\n• Build confidence gradually\n\n**Remember:**\n• 25 questions in 30 minutes = 1.2 minutes per question\n• You have time to think\n• Most questions are logical\n• Trust your preparation!\n\n**Your Progress:** Keep practicing and you'll get there!",
        tone: 'encouraging',
        actionItems: ['Start with easier topics', 'Practice daily', 'Review mistakes'],
        nextSteps: ['Build confidence gradually', 'Take practice tests', 'Do not give up']
      };
    }
    
    // CBR Exam Results & Retakes
    if (lowerMessage.includes('fail') || lowerMessage.includes('retake') || lowerMessage.includes('results') || 
        lowerMessage.includes('failed') || lowerMessage.includes('retry')) {
      return {
        message: "🔄 CBR Exam Results & Retakes:\n\n**If You Don't Pass:**\n• Don't worry - it's common!\n• Results show immediately\n• You can retake after 2 weeks\n• Use the time to practice more\n\n**Retake Strategy:**\n• Focus on your weak areas\n• Take more practice tests\n• Review all mistakes\n• Build confidence\n\n**Cost:**\n• Each retake costs €37.50\n• No limit on retakes\n• Take your time to prepare\n\n**Success Tips:**\n• Practice until consistently 80%+\n• Take mock exams regularly\n• Don't rush to retake\n• Build real confidence first!\n\n**Remember:** Many people need 2-3 attempts - you're not alone!",
        tone: 'supportive',
        actionItems: ['Review your weak areas', 'Practice more', 'Take mock exams'],
        nextSteps: ['Build confidence', 'Practice until ready', 'Retake when confident']
      };
    }
    
    // CBR Exam Cost & Price Questions - PRIORITY CHECK
    if (lowerMessage.includes('how much') || lowerMessage.includes('cost') || lowerMessage.includes('price') || 
        lowerMessage.includes('fee') || lowerMessage.includes('money') || lowerMessage.includes('euro') || 
        lowerMessage.includes('€') || lowerMessage.includes('cbr exam cost') || lowerMessage.includes('exam price')) {
      return {
        message: "💰 CBR Exam Cost & Pricing:\n\n**Theory Exam Cost:**\n• **€37.50** (2024 price)\n• Pay online when booking\n• No additional fees\n\n**What's Included:**\n• 25 multiple choice questions\n• 30 minutes exam time\n• Immediate results\n• Certificate valid for 1.5 years\n\n**Payment Methods:**\n• Credit card (Visa, Mastercard)\n• Debit card (Maestro)\n• iDEAL (Dutch online banking)\n• PayPal\n\n**Retake Costs:**\n• Each retake: €37.50\n• No limit on retakes\n• Wait 2 weeks between attempts\n\n**Pro Tip**: Book early to get your preferred date - popular slots fill up quickly!",
        tone: 'encouraging',
        actionItems: ['Check cbr.nl for current prices', 'Prepare payment method', 'Book your preferred date'],
        nextSteps: ['Book your exam', 'Continue practicing', 'Prepare for success']
      };
    }
    
    // Personalized help based on user progress
    if (lowerMessage.includes('help') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
      if (averageScore < 30) {
        return {
          message: `I'm your personal driving theory coach! Since you're just starting (${averageScore}% average), here's how I can help:\n\n🎯 **Start Smart**: Begin with Traffic Rules & Signs - it's the foundation\n🎯 **Build Gradually**: Master one topic at 80%+ before moving on\n🎯 **Practice Daily**: 10-15 questions daily beats cramming\n\n**Your personalized goal**: Reach 70%+ average to unlock mock exams!\n\nWhat specific topic would you like help with?`,
          tone: 'encouraging',
          actionItems: ['Start with Traffic Rules & Signs', 'Set a daily practice routine', 'Track your progress'],
          nextSteps: ['Take your first practice test', 'Focus on understanding concepts', 'Build consistency']
        };
      } else if (averageScore < 70) {
        return {
          message: `Excellent progress! You're at ${averageScore}% average - well on your way! Here's how I can help you reach 70%+:\n\n🎯 **Focus on Weak Areas**: Check your dashboard for personalized recommendations\n🎯 **Master Each Topic**: Aim for 80%+ in each area before moving on\n🎯 **Build Consistency**: Practice daily to maintain momentum\n\n**You're ${70 - averageScore}% away from unlocking mock exams!**\n\nWhat specific area would you like to improve?`,
          tone: 'motivational',
          actionItems: ['Check your dashboard insights', 'Focus on your weakest area', 'Practice daily'],
          nextSteps: ['Take a practice test', 'Review your mistakes', 'Build toward 70%+']
        };
      } else {
        return {
          message: `Outstanding! You're at ${averageScore}% average - ready for the next level! 🎉\n\n🎯 **You're ready for mock exams!** - This is where you test your real exam readiness\n🎯 **Focus on exam strategy** - Time management and pressure handling\n🎯 **Polish your weak spots** - Even small improvements matter\n\n**Your goal**: Pass all 3 mock exams to be truly exam-ready!\n\nWhat would you like to work on next?`,
          tone: 'motivational',
          actionItems: ['Start a mock exam', 'Review your strong areas', 'Polish any weak spots'],
          nextSteps: ['Take Mock Exam 1', 'Build exam confidence', 'Prepare for the real thing']
        };
      }
    }
    
    // Additional specific responses for common questions
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        message: `Hello! 👋 I'm your AI driving theory coach. I can help you with:\n\n• **CBR Exam**: Cost, format, booking, preparation\n• **Dutch Traffic Rules**: Priority, lights, roundabouts, speed limits\n• **Road Signs**: All Dutch traffic signs and meanings\n• **Study Tips**: How to prepare effectively\n\nWhat would you like to know?`,
        tone: 'encouraging',
        actionItems: ['Ask about CBR exam', 'Learn traffic rules', 'Get study help'],
        nextSteps: ['Start practicing', 'Take a test', 'Build your knowledge']
      };
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return {
        message: `You're welcome! 😊 I'm here to help you succeed with your Dutch driving theory.\n\nKeep practicing and feel free to ask me anything about:\n• CBR exam details\n• Dutch traffic rules\n• Study strategies\n• Road signs and markings\n\nGood luck with your preparation!`,
        tone: 'supportive',
        actionItems: ['Continue studying', 'Take practice tests', 'Ask more questions'],
        nextSteps: ['Build your confidence', 'Prepare for success', 'Keep learning']
      };
    }
    
    // ChatGPT-style response for any question
    return {
      message: `I'm your AI driving theory coach! I can help with:\n\n• **CBR Exam Questions**: Cost (€37.50), format (25 questions, 30 min), booking process\n• **Dutch Traffic Rules**: Priority rules, traffic lights, roundabouts, speed limits\n• **Road Signs & Markings**: All Dutch traffic signs and their meanings\n• **Exam Preparation**: Study strategies, mock exams, readiness assessment\n• **General Driving Theory**: Any driving-related question you have\n\nWhat would you like to know about Dutch driving theory or the CBR exam?`,
      tone: 'supportive',
      actionItems: ['Ask about CBR exam details', 'Learn Dutch traffic rules', 'Get study tips'],
      nextSteps: ['Take practice tests', 'Study specific topics', 'Prepare for your exam']
    };
  }
}

export const freeAIService = new FreeAIService();
