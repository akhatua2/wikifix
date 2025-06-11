import { track } from '@vercel/analytics';

// Define types for analytics context - updated to allow arrays
interface AnalyticsContext {
  [key: string]: string | number | boolean | null | undefined | string[] | number[];
}

// User interaction events
export const trackButtonClick = (buttonName: string, context?: AnalyticsContext) => {
  track('button_click', {
    button_name: buttonName,
    timestamp: new Date().toISOString(),
    ...context
  });
};

export const trackTextInput = (inputName: string, textLength: number, context?: AnalyticsContext) => {
  track('text_input', {
    input_name: inputName,
    text_length: textLength,
    timestamp: new Date().toISOString(),
    ...context
  });
};

export const trackOptionSelect = (optionType: string, optionValue: string, context?: AnalyticsContext) => {
  track('option_select', {
    option_type: optionType,
    option_value: optionValue,
    timestamp: new Date().toISOString(),
    ...context
  });
};

export const trackTaskLoad = (taskId: string, context?: AnalyticsContext) => {
  track('task_load', {
    task_id: taskId,
    timestamp: new Date().toISOString(),
    ...context
  });
};

export const trackTaskSubmit = (taskId: string, agrees: boolean, explanationLength: number, context?: AnalyticsContext) => {
  track('task_submit', {
    task_id: taskId,
    agrees_with_claim: agrees,
    explanation_length: explanationLength,
    timestamp: new Date().toISOString(),
    ...context
  });
};

export const trackTaskSkip = (taskId: string, context?: AnalyticsContext) => {
  track('task_skip', {
    task_id: taskId,
    timestamp: new Date().toISOString(),
    ...context
  });
};

export const trackPageView = (page: string, context?: AnalyticsContext) => {
  track('page_view', {
    page,
    timestamp: new Date().toISOString(),
    ...context
  });
};

export const trackUserAction = (action: string, details: AnalyticsContext) => {
  track('user_action', {
    action,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Debounced text input tracking to avoid too many events
let textInputDebounce: NodeJS.Timeout;
export const trackTextInputDebounced = (inputName: string, text: string, context?: AnalyticsContext) => {
  clearTimeout(textInputDebounce);
  textInputDebounce = setTimeout(() => {
    trackTextInput(inputName, text.length, { ...context, has_content: text.trim().length > 0 });
  }, 1000); // Track after 1 second of no typing
}; 