import { GoogleGenAI, Type } from "@google/genai";
import type { Strategy, StrategyRequest, LlmProvider, LlmConfig } from '../types';

const geminiAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

const strategySchema = {
  type: Type.OBJECT,
  properties: {
    strategyName: { type: Type.STRING, description: "A cool and descriptive name for the strategy." },
    description: { type: Type.STRING, description: "A brief, 1-2 sentence description of the strategy's logic." },
    asset: { type: Type.STRING, description: "The cryptocurrency asset pair for this strategy, e.g., 'BTC/USDT'." },
    timeframe: { type: Type.STRING, description: "The optimal chart timeframe for this strategy, e.g., '1H', '4H', '1D'." },
    entryConditions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of specific conditions that must be met to enter a long position."
    },
    exitConditions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of specific conditions that must be met to exit the position (take profit or stop loss)."
    },
    backtestSummary: {
      type: Type.OBJECT,
      properties: {
        pnl: { type: Type.STRING, description: "The simulated Profit/Loss percentage." },
        winRate: { type: Type.STRING, description: "The simulated win rate percentage." },
        sharpeRatio: { type: Type.STRING, description: "The simulated Sharpe Ratio, indicating risk-adjusted return." },
        maxDrawdown: { type: Type.STRING, description: "The simulated maximum drawdown percentage." }
      },
      required: ["pnl", "winRate", "sharpeRatio", "maxDrawdown"],
    },
    pineScript: { type: Type.STRING, description: "The complete Pine Script v5 code for implementing this strategy on TradingView." }
  },
  required: ["strategyName", "description", "asset", "timeframe", "entryConditions", "exitConditions", "backtestSummary", "pineScript"]
};

const buildPromptForGeminiStrategy = (request: StrategyRequest): string => {
  const indicatorDetails = Object.entries(request.indicators)
    .map(([name, params]) => {
      const paramString = Object.entries(params).map(([key, value]) => `${key}: ${value}`).join(', ');
      return `${name.toUpperCase()} (${paramString})`;
    })
    .join('; ');

  return `
    Act as an expert quantitative trading strategist specializing in cryptocurrency markets.
    Your task is to create a detailed trading strategy based on user-defined parameters.
    The response must be a valid JSON object that strictly adheres to the provided schema.

    **Strategy Parameters:**
    - Cryptocurrency Pair: ${request.asset}
    - Technical Indicators: ${indicatorDetails || 'None'}
    - Risk Management:
      - Stop Loss: ${request.risk.stopLoss}%
      - Take Profit: ${request.risk.takeProfit}%

    **Instructions:**
    1.  **Develop a Coherent Strategy:** Combine the selected indicators into a logical trading strategy. If multiple indicators are chosen, they should work together. For example, use a trend-following indicator like MACD to establish direction and an oscillator like RSI to time entries.
    2.  **Define Clear Entry/Exit Rules:** Formulate precise, unambiguous rules for entering and exiting trades.
    3.  **Simulate Backtest Data:** Provide plausible, realistic (but simulated) backtesting metrics for this type of strategy. Do not make outrageous claims.
    4.  **Generate Pine Script:** Write clean, well-commented Pine Script v5 code that accurately implements the strategy, including the stop loss and take profit levels.
    5.  **Adhere to Schema:** Ensure the final output is a single JSON object matching the required structure. Do not include any text, markdown, or explanations outside of the JSON object.
  `;
};

// This function is Gemini-specific due to the use of responseSchema
export const generateStrategyWithGemini = async (request: StrategyRequest): Promise<Strategy> => {
  const prompt = buildPromptForGeminiStrategy(request);

  const response = await geminiAi.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: strategySchema,
    },
  });

  const jsonString = response.text;
  try {
    const parsedJson = JSON.parse(jsonString);
    return parsedJson as Strategy;
  } catch (error) {
    console.error("Failed to parse Gemini response:", jsonString);
    throw new Error("The AI returned an invalid data format.");
  }
};


// --- Multi-provider services ---

export interface AiOptions {
    provider: LlmProvider | 'Gemini';
    config?: LlmConfig[LlmProvider];
}

const PINE_SCRIPT_SYSTEM_PROMPT = `Act as an expert in TradingView's Pine Script v5. Based on the user's request, generate a complete and valid Pine Script v5 strategy script. The script should be ready to be copy-pasted and used in TradingView. Include comments in the code to explain the logic. Do NOT include any markdown formatting (like \`\`\`pine) or any text explanation outside of the script itself. The output must be ONLY the Pine Script code.`;

export const generatePineScript = async (prompt: string, options: AiOptions): Promise<string> => {
    const { provider, config } = options;
    const userPrompt = `User's request: "${prompt}"`;

    switch (provider) {
        case 'OpenAI':
            if (!config?.apiKey || !config?.model) throw new Error('OpenAI API key or model is not configured.');
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: config.model,
                        messages: [
                            { role: 'system', content: PINE_SCRIPT_SYSTEM_PROMPT },
                            { role: 'user', content: userPrompt },
                        ],
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenAI API Error: ${errorData.error.message}`);
                }
                const data = await response.json();
                return data.choices[0].message.content.trim();
            } catch (error) {
                console.error("OpenAI API call failed:", error);
                throw error;
            }
        
        case 'Anthropic':
            if (!config?.apiKey || !config?.model) throw new Error('Anthropic API key or model is not configured.');
            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': config.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: config.model,
                        system: PINE_SCRIPT_SYSTEM_PROMPT,
                        messages: [{ role: 'user', content: userPrompt }],
                        max_tokens: 4096,
                    }),
                });
                 if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Anthropic API Error: ${errorData.error.message}`);
                }
                const data = await response.json();
                return data.content[0].text.trim();
            } catch (error) {
                console.error("Anthropic API call failed:", error);
                throw error;
            }

        case 'Gemini':
        default:
            const fullPrompt = `${PINE_SCRIPT_SYSTEM_PROMPT}\n\n${userPrompt}`;
            const response = await geminiAi.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: fullPrompt,
            });
            return response.text.trim();
    }
};

const RANDOM_SUGGEST_STRATEGY_SYSTEM_PROMPT = `Act as an expert quantitative trading strategist. Invent and describe a novel and interesting trading strategy for the BTC/USDT pair on a 4-hour timeframe. The description must be detailed enough to be used as a prompt to generate a complete Pine Script. Include the specific indicators used (e.g., RSI, MACD, Bollinger Bands, Ichimoku Cloud, etc.), their specific parameters, and the exact entry and exit conditions for both long and short positions. The output should be ONLY the strategy description text, without any preamble, title, or explanation. For example: "A momentum-based strategy using the Ichimoku Cloud and RSI. A long entry is triggered when the price is above the Kumo cloud, the Tenkan-sen crosses above the Kijun-sen, and the RSI is below 70..."`;

export const generateRandomStrategyIdea = async (options: AiOptions): Promise<string> => {
    const { provider, config } = options;
    const userPrompt = "Please provide a strategy idea as requested.";

    switch (provider) {
         case 'OpenAI':
            if (!config?.apiKey || !config?.model) throw new Error('OpenAI API key or model is not configured.');
            try {
                 const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: config.model,
                        messages: [
                            { role: 'system', content: RANDOM_SUGGEST_STRATEGY_SYSTEM_PROMPT },
                            { role: 'user', content: userPrompt },
                        ],
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenAI API Error: ${errorData.error.message}`);
                }
                const data = await response.json();
                return data.choices[0].message.content.trim();
            } catch (error) {
                 console.error("OpenAI API call failed:", error);
                 throw error;
            }

        case 'Anthropic':
             if (!config?.apiKey || !config?.model) throw new Error('Anthropic API key or model is not configured.');
             try {
                 const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': config.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: config.model,
                        system: RANDOM_SUGGEST_STRATEGY_SYSTEM_PROMPT,
                        messages: [{ role: 'user', content: userPrompt }],
                        max_tokens: 4096,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Anthropic API Error: ${errorData.error.message}`);
                }
                const data = await response.json();
                return data.content[0].text.trim();
             } catch (error) {
                 console.error("Anthropic API call failed:", error);
                 throw error;
             }

        case 'Gemini':
        default:
            const response = await geminiAi.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: RANDOM_SUGGEST_STRATEGY_SYSTEM_PROMPT,
            });
            return response.text.trim();
    }
};

const REFINE_STRATEGY_SYSTEM_PROMPT = `Act as an expert quantitative trading strategist. Your task is to take the user's brief trading strategy idea and expand it into a detailed, actionable prompt that can be used to generate Pine Script.
Elaborate on the user's idea by adding:
- Specific indicator parameters (e.g., RSI period 14, overbought 70, oversold 30).
- Precise and logical entry and exit conditions for both long and short positions.
- Suggestions for risk management (like stop-loss or take-profit strategies).
- An appropriate asset and timeframe if not specified by the user.

The final output should be ONLY the refined strategy description text, without any preamble, title, or explanation. It should be a single, cohesive block of text ready to be used in the next step.`;


export const refineStrategyIdea = async (userIdea: string, options: AiOptions): Promise<string> => {
    const { provider, config } = options;
    const userContent = `User's brief idea: "${userIdea}"`;

     switch (provider) {
         case 'OpenAI':
            if (!config?.apiKey || !config?.model) throw new Error('OpenAI API key or model is not configured.');
            try {
                 const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: config.model,
                        messages: [
                            { role: 'system', content: REFINE_STRATEGY_SYSTEM_PROMPT },
                            { role: 'user', content: userContent },
                        ],
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenAI API Error: ${errorData.error.message}`);
                }
                const data = await response.json();
                return data.choices[0].message.content.trim();
            } catch (error) {
                 console.error("OpenAI API call failed:", error);
                 throw error;
            }

        case 'Anthropic':
             if (!config?.apiKey || !config?.model) throw new Error('Anthropic API key or model is not configured.');
             try {
                 const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': config.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: config.model,
                        system: REFINE_STRATEGY_SYSTEM_PROMPT,
                        messages: [{ role: 'user', content: userContent }],
                        max_tokens: 4096,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Anthropic API Error: ${errorData.error.message}`);
                }
                const data = await response.json();
                return data.content[0].text.trim();
             } catch (error) {
                 console.error("Anthropic API call failed:", error);
                 throw error;
             }

        case 'Gemini':
        default:
            const fullPrompt = `${REFINE_STRATEGY_SYSTEM_PROMPT}\n\n${userContent}`;
            const response = await geminiAi.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: fullPrompt,
            });
            return response.text.trim();
    }
};