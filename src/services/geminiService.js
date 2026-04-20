/**
 * CrowdSense AI — Gemini AI Service
 * Provides intelligent crowd safety analysis using Gemini 1.5 Flash.
 * Falls back to smart mock analysis when API key is not configured.
 */

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

/**
 * Generates smart mock insights from real simulation data
 */
const generateMockInsight = (snapshot) => {
  const critZones = snapshot.zones?.filter(z => z.density > 85) || [];
  const highZones = snapshot.zones?.filter(z => z.density > 65 && z.density <= 85) || [];
  const congestGates = snapshot.gates?.filter(g => g.status === 'CONGESTED') || [];
  const totalAttendees = snapshot.totalAttendees || 3500;
  
  if (critZones.length > 0) {
    const zone = critZones[0];
    return {
      insight: `⚠️ CRITICAL: ${zone.id} has reached ${Math.round(zone.density)}% density (${zone.count || '~500'} people). Crowd crush risk elevated. Recommend immediately dispatching 3 security officers and activating overflow routing to Stage Left and Food Court. Close Gate B temporarily.`,
      severity: 'critical',
      confidence: 0.93
    };
  }
  
  if (congestGates.length > 0) {
    const gate = congestGates[0];
    return {
      insight: `🔶 Gate congestion detected at ${gate.id} (queue: ${gate.queue}, wait ~${gate.waitMinutes} min). Redirect incoming attendees to ${congestGates.length > 1 ? 'alternate gates' : 'Gate D or Gate A'} using push notification. Entry throughput can absorb ${Math.round(totalAttendees * 0.02)} more people per minute at under-utilized gates.`,
      severity: 'warning',
      confidence: 0.87
    };
  }
  
  if (highZones.length > 0) {
    return {
      insight: `📊 Crowd density is elevated in ${highZones.map(z => z.id).join(' and ')} (${highZones[0].density}%). No immediate risk, but advise pre-emptive routing to balance load across zones. Consider activating the smart navigation push to ~${Math.round(totalAttendees * 0.1)} nearby users.`,
      severity: 'moderate',
      confidence: 0.79
    };
  }
  
  return {
    insight: `✅ All ${totalAttendees.toLocaleString()} attendees distributed safely across venue. Gate queues nominal (avg wait < 3 min). Zone densities within safe thresholds. Continue monitoring — next peak window expected in ~18 minutes based on schedule timing.`,
    severity: 'safe',
    confidence: 0.95
  };
};

/**
 * analyseVenueCrowd — primary Gemini analysis call
 */
export const analyseVenueCrowd = async (snapshot) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 900)); // Simulate API latency
    return generateMockInsight(snapshot);
  }
  
  const condensed = {
    zones: snapshot.zones?.map(z => ({ id: z.id, density: z.density })),
    gates: snapshot.gates?.map(g => ({ id: g.id, queue: g.queue, status: g.status, waitMins: g.waitMinutes })),
    totalAttendees: snapshot.totalAttendees,
    alerts: snapshot.alerts?.slice(-3),
  };
  
  const prompt = `You are a crowd safety AI for a live event with ${condensed.totalAttendees} attendees.
Current venue data: ${JSON.stringify(condensed)}

In 2-3 sentences, identify the top safety concern (if any) and recommend one specific action for the event coordinator. 
Be direct, data-driven, and include specific zone/gate names. Start with an emoji status indicator.`;
  
  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate insight.';
    
    const hasCritical = text.toLowerCase().includes('critical') || text.toLowerCase().includes('urgent');
    const hasWarning  = text.toLowerCase().includes('warning') || text.toLowerCase().includes('congest');
    
    return {
      insight: text,
      severity: hasCritical ? 'critical' : hasWarning ? 'warning' : 'safe',
      confidence: 0.9
    };
  } catch (err) {
    console.warn('Gemini API error, using mock:', err.message);
    return generateMockInsight(snapshot);
  }
};

/**
 * askGemini — interactive Q&A with venue context
 */
export const askGemini = async (question, snapshot) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 600));
    const answers = [
      `Based on current data, ${snapshot.zones?.find(z => z.density > 70)?.id || 'Stage Front'} appears most crowded. I recommend diverting foot traffic there.`,
      `With ${snapshot.totalAttendees?.toLocaleString() || '3,500'} attendees and ${snapshot.gates?.filter(g => g.status === 'OPEN').length || 4} open gates, average wait times are under 3 minutes right now.`,
      `The safest evacuation path leads through Exit Zone → Entry Plaza → Parking based on current density patterns.`,
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  }
  
  const condensed = {
    zones: snapshot.zones?.map(z => ({ id: z.id, density: z.density })),
    gates: snapshot.gates?.map(g => ({ id: g.id, queue: g.queue, status: g.status })),
    totalAttendees: snapshot.totalAttendees,
  };
  
  const prompt = `Venue context: ${JSON.stringify(condensed)}\n\nCoordinator question: "${question}"\n\nProvide a concise, data-driven answer in 1-2 sentences. Be specific and actionable.`;
  
  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to process question.';
  } catch (err) {
    return 'AI service unavailable. Please check console and API key.';
  }
};
