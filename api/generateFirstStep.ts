import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const { goalTitle, goalDescription } = await getBody(req);

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
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
        Generate the very first step for the quest:
        "${goalTitle}"
        Details: ${goalDescription}
      `,
      jsonSchema: schema
    });

    return res.status(200).json(result.json);

  } catch (err) {
    console.error("generateFirstStep error:", err);
    return res.status(500).json({ error: "Failed to generate step" });
  }
}

function getBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data)));
  });
}
