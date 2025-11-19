import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const { title, description } = await getBody(req);

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const prompt = `
      Suggest 1–3 specific tools needed for this task:

      Title: "${title}"
      Description: "${description}"

      ⛔ STRICT OUTPUT RULES:
      - JSON ONLY, no text outside JSON.
      - No markdown.
      - No explanation.
      - Follow the schema exactly.

      Example response structure:
      { "tools": ["Tool A", "Tool B"] }
    `;

    const result = await model.generateJson({
      prompt,
      jsonSchema: schema,
      strict: true
    });

    return res.status(200).json(result.json);

  } catch (err) {
    console.error("suggestTools ERROR:", err);
    return res.status(500).json({ error: "Failed to suggest tools" });
  }
}

function getBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data)));
  });
}
