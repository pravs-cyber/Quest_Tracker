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
        gradient: { type: "string" },
        mapStyle: { type: "string" }
      },
      required: ["gradient", "mapStyle"]
    };

    const result = await model.generateJson({
      prompt: `Suggest a treasure-map theme for this goal: ${title}. Context: ${description}`,
      jsonSchema: schema,
    });

    return new Response(JSON.stringify(result.json), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("suggestGoalTheme error:", err);
    return new Response(JSON.stringify({ error: "Theme generation failed" }), { status: 500 });
  }
}
