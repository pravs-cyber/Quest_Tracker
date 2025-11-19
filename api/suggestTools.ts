import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const { title, description } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const schema = {
      type: "object",
      properties: {
        tools: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["tools"]
    };

    const result = await model.generateJson({
      prompt: `Suggest 1-3 essential tools needed for: ${title}. ${description}`,
      jsonSchema: schema,
    });

    return new Response(JSON.stringify(result.json), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("suggestTools error:", err);
    return new Response(JSON.stringify({ error: "Tool generation failed" }), { status: 500 });
  }
}
