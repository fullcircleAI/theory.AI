// Real AI Service - Free models, no credit card required!
// Uses multiple free AI APIs for reliable responses

import { HfInference } from '@huggingface/inference';

export interface AITutorResponse {
  message: string;
  tone: 'encouraging' | 'motivational' | 'analytical' | 'supportive';
  actionItems: string[];
  nextSteps: string[];
}

class RealAIService {
  private hf: HfInference;
  
  // Best performing free AI models (optimized for Dutch driving theory)
  private models = [
    'google/flan-t5-large',      // Best instruction following
    'microsoft/DialoGPT-large',  // Good conversational AI
    'facebook/blenderbot-400M-distill', // Reliable fallback
    'google/flan-t5-base'        // Fast backup
  ];
  
  private currentModelIndex = 0;
  private conversationHistory: Array<{role: 'user' | 'ai', message: string}> = [];
  
  constructor() {
    // Optional: Set REACT_APP_HUGGINGFACE_API_KEY in .env for better rate limits
    // Free API key available at: https://huggingface.co/settings/tokens
    const apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;
    this.hf = apiKey ? new HfInference(apiKey) : new HfInference();
  }
  
  // Check if AI is available
  isAIAvailable(): boolean {
    return true; // Always available, no API key needed
  }

  // Get AI response for Dutch driving theory questions - Smart fallback system
  async getTutorResponse(userMessage: string, context: any): Promise<AITutorResponse> {
    // Add user message to history
    this.addToHistory('user', userMessage);
    
    // Check for specific question patterns first (faster and more accurate)
    const specificResponse = this.getSpecificResponse(userMessage, context);
    if (specificResponse) {
      this.addToHistory('ai', specificResponse.message);
      return specificResponse;
    }
    
    // Try external AI models (with quick timeout)
    let aiResponse = '';
    try {
      const prompt = this.createDutchDrivingPrompt(userMessage, context);
      aiResponse = await this.callFreeAI(prompt);
    } catch (error) {
    }
    
    // If external AI fails or gives poor response, use smart fallback
    if (!aiResponse || aiResponse.trim().length < 10) {
      aiResponse = this.generateChatGPTStyleResponse(userMessage, context);
    }
    
    // Parse AI response into structured format
    const response = this.parseAIResponse(aiResponse, context);
    
    // Add AI response to history
    this.addToHistory('ai', response.message);
    
    return response;
  }

  // Get specific response for common questions (faster and more accurate)
  private getSpecificResponse(userMessage: string, context: any): AITutorResponse | null {
    const message = userMessage.toLowerCase();
    const userProgress = context?.userProgress || {};
    const averageScore = userProgress?.averageScore || 0;
    
    // CBR Exam Cost Questions
    if (message.includes('cost') || message.includes('price') || message.includes('how much')) {
      return {
        message: "The official driving theory exam costs €39.50. You can book it online at the official website. The practical exam costs €47.50. Make sure to bring valid ID and your theory certificate.",
        tone: 'supportive',
        actionItems: ['Book exam online', 'Prepare ID documents', 'Study theory thoroughly'],
        nextSteps: ['Complete practice tests', 'Take mock exams', 'Review weak areas']
      };
    }
    
    // Traffic Rules Questions
    if (message.includes('traffic rules') || message.includes('rules') || message.includes('regulations')) {
      return {
        message: "Dutch traffic rules include: right of way at intersections, speed limits (50km/h in cities, 80km/h outside), traffic light signals, roundabout rules, and priority for cyclists. Study the official traffic code for complete details.",
        tone: 'analytical',
        actionItems: ['Study traffic code', 'Practice intersection rules', 'Learn speed limits'],
        nextSteps: ['Take practice tests', 'Focus on weak areas', 'Review road signs']
      };
    }
    
    // Speed Limits
    if (message.includes('speed limit') || message.includes('speed') || message.includes('km/h')) {
      return {
        message: "Speed limits in Netherlands: 50km/h in built-up areas, 80km/h on rural roads, 100km/h on highways, 130km/h on some highways. Always follow posted signs and adjust for weather conditions.",
        tone: 'analytical',
        actionItems: ['Learn speed zones', 'Practice speed limit questions', 'Study road signs'],
        nextSteps: ['Take speed limit practice tests', 'Review traffic signs', 'Practice hazard perception']
      };
    }
    
    // Traffic Lights
    if (message.includes('traffic light') || message.includes('light') || message.includes('signal')) {
      return {
        message: "Traffic lights: Red = stop, Yellow = prepare to stop (unless unsafe), Green = go. Yellow arrow = turn in that direction only. Always check for cyclists and pedestrians before proceeding.",
        tone: 'analytical',
        actionItems: ['Study traffic light rules', 'Practice intersection questions', 'Learn priority rules'],
        nextSteps: ['Take traffic light practice tests', 'Review intersection rules', 'Practice hazard perception']
      };
    }
    
    // Roundabouts
    if (message.includes('roundabout') || message.includes('rotonde')) {
      return {
        message: "Roundabout rules: Give way to traffic from the right, signal before entering, keep right, signal before exiting. Cyclists have priority on the roundabout. Always check mirrors and blind spots.",
        tone: 'analytical',
        actionItems: ['Study roundabout rules', 'Practice roundabout questions', 'Learn priority rules'],
        nextSteps: ['Take roundabout practice tests', 'Review priority rules', 'Practice hazard perception']
      };
    }
    
    // Exam Preparation
    if (message.includes('prepare') || message.includes('study') || message.includes('exam')) {
      const score = averageScore;
      let advice = '';
      let tone = 'encouraging';
      
      if (score < 60) {
        advice = "Focus on basic traffic rules and road signs. Take practice tests regularly and review explanations. Your current score shows you need more practice with fundamentals.";
        tone = 'supportive';
      } else if (score < 80) {
        advice = "Good progress! Focus on your weak areas and take mock exams. You're getting close to exam readiness. Keep practicing consistently.";
        tone = 'motivational';
      } else {
        advice = "Excellent progress! You're well-prepared. Take mock exams to simulate the real test and maintain your skills. You're ready for the exam!";
        tone = 'encouraging';
      }
      
      return {
        message: advice,
        tone: tone as any,
        actionItems: ['Take practice tests', 'Review weak areas', 'Study traffic rules'],
        nextSteps: ['Continue practicing', 'Take mock exams', 'Focus on improvement']
      };
    }
    
    // Road Signs
    if (message.includes('sign') || message.includes('bord')) {
      return {
        message: "Road signs are crucial for Dutch driving. Study mandatory signs (blue circles), warning signs (yellow triangles), and prohibitory signs (red circles). Practice sign recognition regularly.",
        tone: 'analytical',
        actionItems: ['Study road signs', 'Practice sign recognition', 'Learn sign meanings'],
        nextSteps: ['Take sign practice tests', 'Review traffic signs', 'Practice hazard perception']
      };
    }
    
    return null; // No specific response found
  }

  // Create optimized prompt for Dutch driving theory (better performance)
  private createDutchDrivingPrompt(userMessage: string, context: any): string {
    const userProgress = context?.userProgress || {};
    const averageScore = userProgress?.averageScore || 0;
    const currentTest = context?.currentTest || 'dashboard';
    
    return `Dutch driving theory expert. Answer: "${userMessage}"

User: ${averageScore}% average, studying ${currentTest}
Language: ${context?.language || 'en'}

Focus: Dutch traffic rules, CBR exam, road signs, priority rules, traffic lights, roundabouts, speed limits.

Give helpful, accurate answer. Be conversational. Under 100 words.`;
  }

  // Call free AI models with fallback using official Hugging Face client
  private async callFreeAI(prompt: string): Promise<string> {
    for (let i = 0; i < this.models.length; i++) {
      try {
        const modelName = this.models[this.currentModelIndex];
        const response = await this.tryModel(modelName, prompt);
        
        if (response && response.trim().length > 10) {
          return response;
        }
        
        // Try next model
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
        
      } catch (error) {
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
      }
    }
    
    return '';
  }

  // Try a specific model using official Hugging Face client
  private async tryModel(modelName: string, prompt: string): Promise<string> {
    try {
      // Use the official Hugging Face client
      const response = await this.hf.textGeneration({
        model: modelName,
        inputs: prompt,
        parameters: {
          max_new_tokens: 100, // Shorter for faster response
          temperature: 0.6, // Lower for more consistent responses
          do_sample: true,
          top_p: 0.8, // More focused responses
          repetition_penalty: 1.2, // Reduce repetition
          return_full_text: false
        }
      });

      if (response && response.generated_text) {
        return response.generated_text.trim();
      }
    } catch (error) {
    }

    return '';
  }

  // Parse AI response into structured format
  private parseAIResponse(aiResponse: string, context: any): AITutorResponse {
    
    // Determine tone based on content
    let tone: 'encouraging' | 'motivational' | 'analytical' | 'supportive' = 'supportive';
    if (aiResponse.includes('great') || aiResponse.includes('excellent') || aiResponse.includes('well done')) {
      tone = 'encouraging';
    } else if (aiResponse.includes('keep going') || aiResponse.includes('you can do it')) {
      tone = 'motivational';
    } else if (aiResponse.includes('analyze') || aiResponse.includes('consider')) {
      tone = 'analytical';
    }
    
    // Generate contextual action items
    const actionItems = this.getActionItems(context);
    const nextSteps = this.getNextSteps(context);
    
    return {
      message: aiResponse,
      tone,
      actionItems,
      nextSteps
    };
  }

  // Get contextual action items
  private getActionItems(context: any): string[] {
    const userProgress = context?.userProgress || {};
    const averageScore = userProgress?.averageScore || 0;
    
    if (averageScore < 30) {
      return ['Start with basic traffic rules', 'Learn Dutch road signs', 'Practice daily'];
    } else if (averageScore < 70) {
      return ['Focus on weak areas', 'Take practice tests', 'Study priority rules'];
    } else {
      return ['Take mock exams', 'Review exam format', 'Prepare for real exam'];
    }
  }

  // Get contextual next steps
  private getNextSteps(context: any): string[] {
    const userProgress = context?.userProgress || {};
    const averageScore = userProgress?.averageScore || 0;
    
    if (averageScore < 30) {
      return ['Build your foundation', 'Practice consistently', 'Track your progress'];
    } else if (averageScore < 70) {
      return ['Aim for 70%+ average', 'Take practice tests', 'Focus on understanding'];
    } else {
      return ['Take mock exams', 'Build exam confidence', 'Book your real exam'];
    }
  }

  // Generate ChatGPT-style response when AI models fail
  private generateChatGPTStyleResponse(userMessage: string, context: any): string {
    const lowerMessage = userMessage.toLowerCase();
    // const userProgress = context?.userProgress || {}; // Available for future use
    // const averageScore = userProgress?.averageScore || 0; // Available for future use
    
    // Exam cost questions
    if (lowerMessage.includes('how much') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return `The driving theory exam costs €37.50. Book online at the official website. You need 44/50 correct (88%) to pass (2025 format). Practical exam costs €110 separately.`;
    }
    
    // Exam format questions
    if (lowerMessage.includes('exam format') || lowerMessage.includes('how many questions')) {
      return `50 multiple choice questions in 30 minutes (2025 format). Pass mark is 44/50 (88%). Computer-based at test centers. Covers traffic rules, road signs, priority, speed limits, and vehicle knowledge. Some questions include animation videos.`;
    }
    
    // Dutch traffic rules
    if (lowerMessage.includes('traffic rules') || lowerMessage.includes('verkeersregels') || lowerMessage.includes('priority')) {
      return `Dutch traffic rules: "Rechts gaat voor" (Right goes first). Priority: Emergency vehicles > Trams > Traffic from right > Main road > Pedestrians at crossings. This is 30% of exam questions.`;
    }
    
    // Traffic lights
    if (lowerMessage.includes('traffic light') || lowerMessage.includes('red light') || lowerMessage.includes('amber')) {
      return `Dutch traffic lights: Red = stop, Amber = prepare to stop, Green = go. Red + Amber together = stop (unique to Netherlands). Never run red lights - €370 fine!`;
    }
    
    // Roundabouts
    if (lowerMessage.includes('roundabout') || lowerMessage.includes('rotonde')) {
      return `Dutch roundabouts: Give way to traffic already on the roundabout. Always indicate right when exiting. Stay in your lane. Traffic on the roundabout has priority.`;
    }
    
    // Speed limits
    if (lowerMessage.includes('speed') || lowerMessage.includes('snelheid') || lowerMessage.includes('limit')) {
      return `Dutch speed limits: Built-up areas 50km/h, Outside built-up 80km/h, Highway 100km/h (day) 130km/h (night), Residential 15km/h. Zone 30 for schools/hospitals.`;
    }
    
    // Default ChatGPT-style response
    return `I can help with Dutch driving theory, exam costs, traffic rules, and your progress. What would you like to know?`;
  }

  // Smart fallback for when AI fails
  private getSmartFallback(userMessage: string, context: any): AITutorResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // CBR exam cost questions
    if (lowerMessage.includes('how much') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return {
        message: `The CBR theory exam costs **€37.50** (as of 2025). Here's the breakdown:\n\n💰 **Exam Fee**: €37.50\n📅 **Booking**: Online at cbr.nl\n⏰ **Duration**: 30 minutes\n📝 **Questions**: 50 multiple choice (2025 format)\n🎯 **Pass Mark**: 44/50 correct (88%)\n\n**Pro Tip**: Book early - slots fill up quickly! You can reschedule up to 24 hours before your exam.\n\n**Additional Costs**:\n• Resit fee: €37.50 (if you fail)\n• Practical exam: €110 (separate cost)\n• Theory book: €15-25 (optional but recommended)`,
        tone: 'supportive',
        actionItems: ['Book your exam at cbr.nl', 'Check available dates', 'Prepare thoroughly'],
        nextSteps: ['Study consistently', 'Take practice tests', 'Build confidence']
      };
    }
    
    // CBR exam format questions
    if (lowerMessage.includes('cbr exam') || lowerMessage.includes('exam format') || lowerMessage.includes('how many questions')) {
      return {
        message: `The CBR theory exam format (2025):\n\n📝 **50 Multiple Choice Questions**\n⏰ **30 Minutes Total** (36 seconds per question)\n🎯 **Pass Mark**: 44/50 correct (88%)\n🖥️ **Computer-based** at CBR test centers\n\n**Question Types**:\n• Traffic rules and regulations\n• Road signs and markings\n• Priority and right of way\n• Speed limits and safety\n• Vehicle knowledge\n• Some questions include animation videos\n\n**Pro Tip**: Manage your time! You have 36 seconds per question - read carefully but don't overthink. Dutch driving theory is logical and consistent.`,
        tone: 'encouraging',
        actionItems: ['Practice with 50-question tests', 'Time yourself', 'Review all question types'],
        nextSteps: ['Take mock exams', 'Build exam confidence', 'Book when ready']
      };
    }
    
    // Dutch traffic rules
    if (lowerMessage.includes('traffic rules') || lowerMessage.includes('verkeersregels') || lowerMessage.includes('priority')) {
      return {
        message: `Dutch traffic rules are based on the principle of **"Rechts gaat voor"** (Right goes first). Here's the hierarchy:\n\n🚗 **Priority Rules**:\n1. **Emergency vehicles** - always!\n2. **Trams** - they have their own tracks\n3. **Traffic from the right** - the fundamental rule\n4. **Main road traffic** - when you're on a side road\n5. **Pedestrians at crossings** - they have priority\n\n**Key Dutch Concepts**:\n• **Voorrang verlenen** - Give way\n• **Rechts gaat voor** - Right goes first\n• **Kruispunt** - Intersection\n• **Rotonde** - Roundabout\n\n**Pro Tip**: Dutch drivers are very predictable - they follow the rules strictly. Learn the patterns and you'll be fine!`,
        tone: 'supportive',
        actionItems: ['Study priority rules', 'Practice intersection scenarios', 'Learn Dutch traffic signs'],
        nextSteps: ['Take practice tests', 'Focus on understanding', 'Build confidence']
      };
    }
    
    // Default response
    return {
      message: `I'm your AI Dutch driving theory coach! I can help with:\n\n• **CBR Exam**: Cost (€37.50), format (50 questions, 30 min, 2025), booking\n• **Dutch Traffic Rules**: Priority, lights, roundabouts, speed limits\n• **Road Signs**: All Dutch traffic signs and meanings\n• **Study Tips**: How to prepare effectively\n\nWhat would you like to know about Dutch driving theory or the CBR exam?`,
      tone: 'supportive',
      actionItems: ['Ask about CBR exam', 'Learn traffic rules', 'Get study help'],
      nextSteps: ['Start practicing', 'Take a test', 'Build your knowledge']
    };
  }

  // Add to conversation history
  private addToHistory(role: 'user' | 'ai', message: string): void {
    this.conversationHistory.push({ role, message });
    
    // Keep only last 10 exchanges
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  // Get conversation context
  private getConversationContext(): string {
    return this.conversationHistory
      .slice(-6) // Last 6 exchanges
      .map(entry => `${entry.role}: ${entry.message}`)
      .join('\n');
  }
}

export const realAIService = new RealAIService();
