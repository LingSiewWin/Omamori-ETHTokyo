import { useState, useEffect, useCallback, useRef } from 'react';

interface TypewriterOptions {
  text: string;
  speed?: number;
  delay?: number;
}

export const useTypewriter = ({ text, speed = 50, delay = 0 }: TypewriterOptions) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const skipToEnd = useCallback(() => {
    // Clear any running intervals/timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Show complete text immediately
    setDisplayedText(text);
    setIsComplete(true);
  }, [text]);

  useEffect(() => {
    // Return early if no text
    if (!text) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    // Reset state for new text
    setDisplayedText('');
    setIsComplete(false);

    // Clear any existing intervals/timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Start typing after delay
    timeoutRef.current = setTimeout(() => {
      let currentIndex = 0;

      const startTyping = () => {
        intervalRef.current = setInterval(() => {
          currentIndex++;

          if (currentIndex <= text.length) {
            setDisplayedText(text.slice(0, currentIndex));
          } else {
            setIsComplete(true);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }, speed);
      };

      startTyping();
    }, delay);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [text, speed, delay]);

  return { displayedText, isComplete, skipToEnd };
};