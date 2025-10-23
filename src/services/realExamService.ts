// Mock Exam Questions Service
// Manages practice questions based on official Dutch driving theory standards

import { realExamQuestions, RealExamQuestion, getRandomRealExamQuestions, getHardestRealExamQuestions } from '../question_data/realExamQuestions';

export interface RealExamSession {
  id: string;
  questions: RealExamQuestion[];
  startTime: Date;
  endTime?: Date;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  examDate: string;
  passRate: number;
}

export interface RealExamStats {
  totalRealExamQuestions: number;
  averagePassRate: number;
  hardestQuestions: RealExamQuestion[];
  mostCommonMistakes: string[];
  examReadinessScore: number;
  recommendedStudyAreas: string[];
}

class RealExamService {
  private realExamSessions: RealExamSession[] = [];
  
  // Get a full mock exam (25 questions like the official exam)
  getFullMockExam(): RealExamQuestion[] {
    return getRandomRealExamQuestions(25);
  }
  
  // Get real exam questions by difficulty
  getRealExamByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): RealExamQuestion[] {
    const questions = realExamQuestions.filter(q => q.difficulty === difficulty);
    return questions.slice(0, 25); // Limit to 25 questions
  }
  
  // Get hardest real exam questions (lowest pass rate)
  getHardestRealExamQuestions(count: number = 25): RealExamQuestion[] {
    return getHardestRealExamQuestions(50).slice(0, count);
  }
  
  // Start a real exam session
  startRealExamSession(difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed'): RealExamSession {
    const questions = difficulty === 'mixed' 
      ? this.getFullMockExam()
      : this.getRealExamByDifficulty(difficulty);
    
    const session: RealExamSession = {
      id: `real-exam-${Date.now()}`,
      questions,
      startTime: new Date(),
      score: 0,
      totalQuestions: questions.length,
      correctAnswers: 0,
      timeSpent: 0,
      difficulty,
      examDate: new Date().toISOString().split('T')[0],
      passRate: 0
    };
    
    this.realExamSessions.push(session);
    return session;
  }
  
  // Submit answers for a real exam session
  submitRealExamAnswers(sessionId: string, answers: { [questionId: string]: string }): RealExamSession {
    const session = this.realExamSessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Real exam session not found');
    }
    
    let correctAnswers = 0;
    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    
    // Check answers
    session.questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswerId) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / session.totalQuestions) * 100);
    const passRate = Math.round((correctAnswers / session.totalQuestions) * 100);
    
    // Update session
    session.endTime = endTime;
    session.score = score;
    session.correctAnswers = correctAnswers;
    session.timeSpent = timeSpent;
    session.passRate = passRate;
    
    return session;
  }
  
  // Get real exam statistics
  getRealExamStats(): RealExamStats {
    const totalQuestions = realExamQuestions.length;
    const averagePassRate = Math.round(
      realExamQuestions.reduce((sum, q) => sum + q.passRate, 0) / totalQuestions
    );
    
    const hardestQuestions = getHardestRealExamQuestions(10);
    
    const mostCommonMistakes = realExamQuestions
      .map(q => q.commonMistake)
      .filter((mistake, index, arr) => arr.indexOf(mistake) === index)
      .slice(0, 5);
    
    // Calculate exam readiness score based on recent performance
    const recentSessions = this.realExamSessions.slice(-5);
    const averageScore = recentSessions.length > 0 
      ? Math.round(recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length)
      : 0;
    
    const examReadinessScore = Math.min(100, Math.max(0, averageScore));
    
    // Recommend study areas based on weakest subjects
    const subjectScores = this.calculateSubjectScores();
    const recommendedStudyAreas = Object.entries(subjectScores)
      .filter(([_, score]) => score < 70)
      .map(([subject, _]) => subject)
      .slice(0, 3);
    
    return {
      totalRealExamQuestions: totalQuestions,
      averagePassRate,
      hardestQuestions,
      mostCommonMistakes,
      examReadinessScore,
      recommendedStudyAreas
    };
  }
  
  // Calculate subject scores from recent sessions
  private calculateSubjectScores(): { [subject: string]: number } {
    const subjectScores: { [subject: string]: number } = {};
    const subjectCounts: { [subject: string]: number } = {};
    
    this.realExamSessions.forEach(session => {
      session.questions.forEach(question => {
        const subject = question.subject;
        if (!subjectScores[subject]) {
          subjectScores[subject] = 0;
          subjectCounts[subject] = 0;
        }
        
        // This is a simplified calculation - in reality, you'd track individual question performance
        subjectScores[subject] += question.passRate;
        subjectCounts[subject]++;
      });
    });
    
    // Calculate average scores per subject
    Object.keys(subjectScores).forEach(subject => {
      subjectScores[subject] = Math.round(subjectScores[subject] / subjectCounts[subject]);
    });
    
    return subjectScores;
  }
  
  // Get real exam session by ID
  getRealExamSession(sessionId: string): RealExamSession | undefined {
    return this.realExamSessions.find(s => s.id === sessionId);
  }
  
  // Get all real exam sessions
  getAllRealExamSessions(): RealExamSession[] {
    return this.realExamSessions;
  }
  
  // Get real exam questions by subject
  getRealExamQuestionsBySubject(subject: string): RealExamQuestion[] {
    return realExamQuestions.filter(q => q.subject === subject);
  }
  
  // Get real exam questions by exam date
  getRealExamQuestionsByDate(examDate: string): RealExamQuestion[] {
    return realExamQuestions.filter(q => q.examDate === examDate);
  }
  
  // Check if user is ready for real exam
  isReadyForRealExam(): { ready: boolean; score: number; recommendations: string[] } {
    const stats = this.getRealExamStats();
    const ready = stats.examReadinessScore >= 70;
    
    const recommendations = [];
    if (stats.examReadinessScore < 70) {
      recommendations.push(`Your exam readiness is ${stats.examReadinessScore}%. Aim for 70%+ to be ready.`);
    }
    
    if (stats.recommendedStudyAreas.length > 0) {
      recommendations.push(`Focus on: ${stats.recommendedStudyAreas.join(', ')}`);
    }
    
    return {
      ready,
      score: stats.examReadinessScore,
      recommendations
    };
  }
}

export const realExamService = new RealExamService();
