import { useCallback } from 'react';
import { 
  trackButtonClick, 
  trackTextInput, 
  trackTextInputDebounced,
  trackOptionSelect, 
  trackTaskLoad, 
  trackTaskSubmit, 
  trackTaskSkip,
  trackPageView,
  trackUserAction
} from '@/utils/analytics';

// Define types for analytics context - updated to allow arrays
interface AnalyticsContext {
  [key: string]: string | number | boolean | null | undefined | string[] | number[];
}

export const useAnalytics = () => {
  const trackClick = useCallback((buttonName: string, context?: AnalyticsContext) => {
    trackButtonClick(buttonName, context);
  }, []);

  const trackInput = useCallback((inputName: string, textLength: number, context?: AnalyticsContext) => {
    trackTextInput(inputName, textLength, context);
  }, []);

  const trackInputDebounced = useCallback((inputName: string, text: string, context?: AnalyticsContext) => {
    trackTextInputDebounced(inputName, text, context);
  }, []);

  const trackSelect = useCallback((optionType: string, optionValue: string, context?: AnalyticsContext) => {
    trackOptionSelect(optionType, optionValue, context);
  }, []);

  const trackTask = useCallback((taskId: string, context?: AnalyticsContext) => {
    trackTaskLoad(taskId, context);
  }, []);

  const trackSubmit = useCallback((taskId: string, agrees: boolean, explanationLength: number, context?: AnalyticsContext) => {
    trackTaskSubmit(taskId, agrees, explanationLength, context);
  }, []);

  const trackSkip = useCallback((taskId: string, context?: AnalyticsContext) => {
    trackTaskSkip(taskId, context);
  }, []);

  const trackPage = useCallback((page: string, context?: AnalyticsContext) => {
    trackPageView(page, context);
  }, []);

  const trackAction = useCallback((action: string, details: AnalyticsContext) => {
    trackUserAction(action, details);
  }, []);

  return {
    trackClick,
    trackInput,
    trackInputDebounced,
    trackSelect,
    trackTask,
    trackSubmit,
    trackSkip,
    trackPage,
    trackAction
  };
}; 