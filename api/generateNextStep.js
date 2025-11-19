import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const { goal } = await getBody(req);

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const prompt = `
      You are a quest guide revealing the NEXT step for the user's journey.

      ⛔ STRICT RULES:
      - Respond with ONLY valid JSON.
      - NO markdown, NO code blocks, NO explanation.
      - No extra text before or after the JSON.
      - The output must match the schema exactly.

      Goal Title: "${goal.title}"

      Completed / Pending Steps:
      ${goal.steps.map(s => `- ${s.title} (${s.isCompleted ? "done" : "pending"})`).join("\n")}

      Provide the next step that logically follows.
    `;

    const result = await model.generateJson({
      prompt,
      jsonSchema: schema,
      strict: true
    });

    return res.status(200).json(result.json);

  } catch (err) {
    console.error("generateNextStep ERROR:", err);
    return res.status(500).json({ error: "Failed to generate next step" });
  }
}

function getBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data)));
  });
}
