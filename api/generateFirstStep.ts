import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { goalTitle, goalDescription } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        motivation: { type: "string" },
        suggestedTools: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["title", "description", "motivation", "suggestedTools"]
    };

    const result = await model.generateJson({
      prompt: `Generate the very first step for the goal: ${goalTitle}. Context: ${goalDescription}`,
      jsonSchema: schema,
    });

    return new Response(JSON.stringify(result.json), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("generateFirstStep error:", err);
    return new Response(JSON.stringify({ error: "generation failed" }), {
      status: 500,
    });
  }
}
