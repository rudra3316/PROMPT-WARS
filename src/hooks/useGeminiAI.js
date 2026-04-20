import { useState, useEffect, useRef } from 'react';
import { analyseVenueCrowd } from '../services/geminiService';

export const useGeminiAI = (crowdData) => {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const dataRef = useRef(crowdData);

  useEffect(() => {
    dataRef.current = crowdData;
  }, [crowdData]);

  useEffect(() => {
    let timerId;
    let countdownId;

    const fetchInsight = async () => {
      setLoading(true);
      const res = await analyseVenueCrowd(dataRef.current);
      setInsight(res.insight);
      setLoading(false);
      setCountdown(30);
    };

    // Initial fetch
    fetchInsight();

    timerId = setInterval(() => {
      fetchInsight();
    }, 30000);

    countdownId = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timerId);
      clearInterval(countdownId);
    };
  }, []); // Empty dependency array means it sets up the intervals once

  return { insight, loading, countdown };
};
