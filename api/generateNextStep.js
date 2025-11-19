import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const { goal } = await getBody(req);

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
      prompt: `
        Generate the next step for this goal:
        Title: ${goal.title}
        Steps so far:
        ${goal.steps.map(s => `- ${s.title} (${s.isCompleted ? "done" : "pending"})`).join("\n")}
      `,
      jsonSchema: schema
    });

    return res.status(200).json(result.json);

  } catch (err) {
    console.error("generateNextStep ERROR:", err);
    return res.status(500).json({ error: "Next step generation failed" });
  }
}

function getBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data)));
  });
}
