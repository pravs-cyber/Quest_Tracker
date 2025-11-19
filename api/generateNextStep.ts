import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const { goal } = await req.json();

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
      prompt: `Generate the next step for the goal "${goal.title}". Completed steps: ${goal.steps
        ?.map(s => `${s.title} (${s.isCompleted ? "done" : "pending"})`)
        .join(", ")}`,
      jsonSchema: schema,
    });

    return new Response(JSON.stringify(result.json), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("generateNextStep error:", err);
    return new Response(JSON.stringify({ error: "Next step failed" }), { status: 500 });
  }
}
