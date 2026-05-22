import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables for local testing (AI Studio handles these natively too)
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Check key availability
app.get("/api/ai-status", (req, res) => {
  const isAvailable = !!process.env.GEMINI_API_KEY;
  res.json({ isAvailable });
});

// Endpoint 1: Active Interactive AI Sentiment and Command Center Insights
app.post("/api/insight", async (req, res) => {
  try {
    const { query, marketContext, activeTab } = req.body;
    const ai = getAIClient();

    const systemPrompt = `You are Horizon OS's core AI Intelligence Engine. You analyze high-volume crypto and currency trading data, L2 order books, and social feeds.
Provide premium, extremely professional, concise, and direct insights. 
Do NOT write verbose fluff. Keep your response under 3 dense paragraphs.
Use clean markdown to format text. Suggest specific trades, risk factors, and next-steps based on what the user asks.`;

    const userPrompt = `
Contextual Tab in Terminal: ${activeTab || "Command Center"}
Current Market Status Data: ${marketContext ? JSON.stringify(marketContext) : "Standard overview"}
User Command or Query: "${query || "What is your main insight on current L2 liquidity and L2 trends?"}"
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      insight: response.text,
    });
  } catch (error: any) {
    console.error("AI Insight error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while generating insight.",
    });
  }
});

// Endpoint 2: Strategy Generator for Strategy Lab
app.post("/api/strategy/generate", async (req, res) => {
  try {
    const { botType, asset, riskProfile, indicators } = req.body;
    const ai = getAIClient();

    const systemPrompt = `You are the Horizon OS Strategy Lab AI compiler. 
You must generate a trading bot configuration and executable algorithmic strategy description.
You must return your response in JSON format. Your response schema MUST strictly include:
- botName (string)
- logicDescription (string)
- parameters (object mapping string parameters to values)
- algorithmCode (string of mock procedural algorithm code, e.g. typescript/python style code executing logic)
- estimatedYield (string, e.g. "+3.2% Weekly")
- winRate (string, e.g. "68.4%")
- activeRiskFactors (array of strings)

Format your response exactly as raw JSON string matching that structure so it can be parsed. Do NOT wrap it in markdown code headers (unwrapped, plain json).`;

    const prompt = `Generate a customized ${botType || "Scalping"} trading strategy for ${asset || "BTC/USDT"}.
The client's risk profile is ${riskProfile || "Moderate"}.
The technical parameters must incorporate these indicators: ${(indicators || ["RSI", "MACD"]).join(", ")}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const textOutput = response.text || "{}";
    res.json({
      success: true,
      strategy: JSON.parse(textOutput),
    });
  } catch (error: any) {
    console.error("Strategy synthesis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred during strategy synthesis.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Horizon Server] Live at http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
