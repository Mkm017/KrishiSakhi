import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getPlotHistory(plotId) {
  if (plotId) {
    return "Last season, this plot experienced a moderate white grub infestation that was treated with chlorpyrifos. The soil also tends to be slightly alkaline.";
  }
  return "No significant issues reported in the previous season.";
}

function getRealTimeContext(location) {
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const isDryRegion = /rajasthan|jaipur|jodhpur/i.test(location || '');
  
  return {
    weather: `Clear skies today (${dayOfWeek}) with a high of 34°C. A slight chance of rain is forecast for two days from now.`,
    alert: isDryRegion 
      ? `Alert: Increased reports of white grub activity in the ${location} region. Farmers are advised to monitor their crops.`
      : `Alert: No major pest outbreaks reported, but monitor for common fungal diseases due to humidity.`
  };
}

function getCropStage(crop, daysSinceSowing) {
    if (daysSinceSowing < 0 || isNaN(daysSinceSowing)) return "Not Sown";
    if (daysSinceSowing <= 15) return `Germination & Seedling Stage (${daysSinceSowing} days)`;
    if (daysSinceSowing <= 45) return `Vegetative Growth Stage (${daysSinceSowing} days)`;
    if (daysSinceSowing <= 70) return `Flowering Stage (${daysSinceSowing} days)`;
    if (daysSinceSowing <= 90) return `Maturity & Ripening Stage (${daysSinceSowing} days)`;
    return `Ready for Harvest (${daysSinceSowing} days)`;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req) {
  try {
    const { messages, plotData, userProfile, imageData, imageMimeType } = await req.json();
    const latestMessage = messages[messages.length - 1].text;
    
    const escalationKeywords = /disease|dying|legal|subsidy|soil test|severe infection/i;
    if (escalationKeywords.test(latestMessage) && !imageData) {
      const escalationResponse = `This sounds like a critical issue that requires an expert opinion. For the most accurate guidance, I strongly recommend contacting your local Krishi Adhikari (Agricultural Officer). You can also call the national Kisan Call Centre (KCC) toll-free at 1800-180-1551.`;
      return new Response(JSON.stringify({ text: escalationResponse }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

    const conversationHistory = messages.map(msg => `${msg.isUser ? 'Farmer' : 'Krishi Sakhi'}: ${msg.text}`).join('\n');
    const languageMap = { 'en': 'English', 'hi': 'Hindi', 'ml': 'Malayalam' };
    const language = languageMap[userProfile?.language] || 'English';
    const hasCrop = plotData && plotData.crop && plotData.crop.trim() !== "";
    
    let systemPrompt;
    let requestPayload;

    const fullContext = `
      - Name: ${userProfile?.name}
      - Location: ${plotData?.location || 'N/A'}
      - Land Size: ${plotData?.landSize || 'Not specified'}
      - Irrigation: ${plotData?.irrigationSource || 'Not specified'}
      - Soil Type: ${plotData?.soilType || 'Not specified'}
      - Soil pH: ${plotData?.soilPH || 'Not specified'}
      - NPK Values (N, P, K in kg/ha): ${plotData?.nitrogen || 'N/A'}, ${plotData?.phosphorus || 'N/A'}, ${plotData?.potassium || 'N/A'}
      - Current Crop: ${hasCrop ? plotData.crop : 'Not Selected'}
      - Sowing Date: ${plotData?.sowingDate || 'N/A'}
      - PLOT HISTORY: ${getPlotHistory(plotData?.id)}
    `;

    if (imageData && imageMimeType) {
        systemPrompt = `You are "Krishi Sakhi," an expert female plant pathologist. Your task is to analyze an image from a farmer in India.
        
        **CRITICAL RULES:**
        1.  **FORMATTING:** Do NOT use markdown. Use plain text only. Do not use asterisks (*). Use numbered lists (e.g., '1. First step', '2. Second step') for instructions.
        2.  **Analyze Image First:** Identify what is in the image (e.g., a leaf, a pest). Look for signs of disease, deficiency, or damage.
        3.  **Use Context & Check for Mismatch:** Compare the plant in the image to the farmer's crop ('${plotData.crop}'). If they don't match, you MUST ask for clarification.
        4.  **Provide Actionable Steps:** Give a clear, step-by-step solution in a numbered list.
        5.  **LANGUAGE:** You MUST respond in ${language}.

        **FARMER'S CONTEXT:**
        ${fullContext}

        Based on your analysis, answer the farmer's question: "${latestMessage}"`;
        
        const imagePart = { inlineData: { data: imageData, mimeType: imageMimeType } };
        requestPayload = [systemPrompt, imagePart];

    } else {
        const realTimeContext = getRealTimeContext(plotData?.location);
        const daysSinceSowing = plotData?.sowingDate ? Math.floor((new Date() - new Date(plotData.sowingDate)) / (1000 * 60 * 60 * 24)) : NaN;
        const cropStage = hasCrop ? getCropStage(plotData.crop, daysSinceSowing) : "Crop not selected";

        systemPrompt = `You are "Krishi Sakhi," a friendly, confident, and expert female agricultural advisor for farmers in India.
    
        **CURRENT DATE:** ${new Date().toDateString()}.
        
        **CRITICAL RULES:**
        1.  **FORMATTING:** Do NOT use markdown. Use plain text only. Do not use asterisks (*). Use numbered lists (e.g., '1. First step', '2. Second step') for instructions.
        2.  **BE TIMELY:** ALL crop suggestions MUST be seasonally appropriate for the CURRENT DATE and location.
        3.  **BE CONCISE:** Keep answers short and direct.
        4.  **PROACTIVE PROFILE UPDATE:** If the farmer decides to grow a crop (e.g., "I will grow Bajra"), END your response with this EXACT phrase: "PROACTIVE_UPDATE_SUGGESTION: [Crop Name]".
        5.  **BE THE EXPERT:** Provide direct, actionable advice. NEVER say "consult a local expert" unless the query is about a severe, unidentifiable disease or legal/subsidy issue.
        6.  **LANGUAGE:** You MUST respond in ${language}.

        **FARMER'S CONTEXT:**
        ${fullContext}
        - Crop Stage: ${cropStage}

        **REAL-TIME DATA for today:**
        - Weather: ${realTimeContext.weather}
        - Alert: ${realTimeContext.alert}
        
        **CONVERSATION HISTORY:**
        ${conversationHistory}
        ---
        Based on all context, provide a clear, concise, actionable answer in ${language} to the farmer's latest message.`;
        requestPayload = systemPrompt;
    }

    let result;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            result = await model.generateContent(requestPayload);
            break; 
        } catch (error) {
            attempts++;
            const errorMessage = error.toString();
            if (errorMessage.includes('503') && attempts < maxAttempts) {
                console.warn(`Attempt ${attempts}: Model is overloaded. Retrying...`);
                await delay(attempts * 2000);
            } else {
                throw error;
            }
        }
    }

    if (!result) throw new Error("The model is currently unavailable after multiple retries.");
    
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Error in Gemini API route:", error);
    // Send a specific error message for overload failures
    if (error.message.includes("overloaded")) {
        return new Response(JSON.stringify({ error: "Krishi Sakhi is currently helping many farmers and is very busy. Please try sending your message again in a moment." }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: "Failed to get a response from the AI. Please check your connection." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

