import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const { goalTitle, goalDescription } = await getBody(req);

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

    const prompt = `
      You are a quest guide generating the FIRST step of a user's goal.

      ⛔ IMPORTANT RULES:
      - RESPOND WITH JSON ONLY.
      - Do NOT include markdown (\`\`\`)
      - Do NOT include commentary or explanation.
      - Do NOT wrap JSON in quotes.
      - Only output the final JSON object.

      Goal title: "${goalTitle}"
      Goal description: "${goalDescription}"

      Follow the schema exactly.
    `;

    const result = await model.generateJson({
      prompt,
      jsonSchema: schema,
      strict: true
    });

    return res.status(200).json(result.json);

  } catch (err) {
    console.error("generateFirstStep ERROR:", err);
    return res.status(500).json({ error: "Failed to generate first step" });
  }
}

function getBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data)));
  });
}
