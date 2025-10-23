import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ExamDateSelection.css';

interface ExamDateSelectionProps {
  onComplete: () => void;
}

export const ExamDateSelection: React.FC<ExamDateSelectionProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate min and max dates (1-7 weekdays from today, excluding weekends)
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 1); // Tomorrow
  
  // Find next 7 weekdays (excluding weekends)
  const maxDate = new Date(today);
  let weekdaysAdded = 0;
  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow
  
  while (weekdaysAdded < 7) {
    const dayOfWeek = currentDate.getDay();
    // Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdaysAdded++;
      if (weekdaysAdded === 7) {
        maxDate.setTime(currentDate.getTime());
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Check if a date is a weekday (Monday-Friday)
  const isWeekday = (date: Date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday = 1, Friday = 5
  };

  // Handle date selection with weekday validation
  const handleDateChange = (dateString: string) => {
    if (!dateString) {
      setSelectedDate('');
      return;
    }
    
    const selectedDateObj = new Date(dateString);
    if (isWeekday(selectedDateObj)) {
      setSelectedDate(dateString);
    } else {
      // If weekend is selected, find next weekday
      const nextWeekday = new Date(selectedDateObj);
      while (!isWeekday(nextWeekday)) {
        nextWeekday.setDate(nextWeekday.getDate() + 1);
      }
      setSelectedDate(formatDateForInput(nextWeekday));
    }
  };

  const handleContinue = async () => {
    if (!selectedDate) return;
    
    setIsLoading(true);
    
    try {
      // Save exam date to localStorage
      localStorage.setItem('examDate', selectedDate);
      
      // Calculate days remaining
      const examDate = new Date(selectedDate);
      const daysRemaining = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Save days remaining for dashboard display
      localStorage.setItem('daysRemaining', daysRemaining.toString());
      
      // Complete the flow
      onComplete();
    } catch (error) {
      console.error('Error saving exam date:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Remove any existing exam date
    localStorage.removeItem('examDate');
    localStorage.removeItem('daysRemaining');
    onComplete();
  };


  return (
    <div className="exam-date-selection">
      <div className="exam-date-container">
        {/* Title */}
        <h1 className="exam-date-title">
          {t('examDate.title', 'When\'s Your Exam?')}
        </h1>


        {/* Date Selection */}
        <div className="date-selection-container">
          <label htmlFor="exam-date" className="date-label">
            {t('examDate.selectDate', 'Select Date')}
          </label>
          <input
            id="exam-date"
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={formatDateForInput(minDate)}
            max={formatDateForInput(maxDate)}
            className="date-input"
          />
          
        </div>


        {/* Action buttons */}
        <div className="exam-date-actions">
          <button
            className="skip-button"
            onClick={handleSkip}
            disabled={isLoading}
          >
            {t('examDate.skip', 'Skip for now')}
          </button>
          
          <button
            className="continue-button"
            onClick={handleContinue}
            disabled={!selectedDate || isLoading}
          >
            {isLoading ? t('examDate.continuing', 'Continuing...') : t('examDate.continue', 'Continue')}
          </button>
        </div>
      </div>
    </div>
  );
};
