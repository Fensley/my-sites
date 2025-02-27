import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Log the incoming message
    console.log("Received message:", message);

    // Make request to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    // Extract and send the response
    const response = completion.choices[0].message.content;
    console.log("AI response:", response);

    res.json({ response });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({
      error: "Failed to get AI response",
      details: error.message,
    });
  }
});

// Verify API key on startup
const verifyApiKey = async () => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in .env file");
    }

    // Test API connection
    const test = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "test",
        },
      ],
    });

    console.log("OpenAI API connection successful");
  } catch (error) {
    console.error("OpenAI API Error:", error);
    process.exit(1);
  }
};

// Start server
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  await verifyApiKey();
});
