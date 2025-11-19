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
        gradient: { type: "string" },
        mapStyle: { type: "string" }
      },
      required: ["gradient", "mapStyle"]
    };

    const prompt = `
      Suggest a visual theme for the user's quest.

      Goal Title: "${title}"
      Description: "${description}"

      Output Requirements:
      ⛔ JSON ONLY. No markdown. No explanation.
      ⛔ gradient MUST be a CSS linear-gradient with 2 hex colors.
      ⛔ mapStyle MUST be one of: "classic", "midnight", "blueprint", "forest".

      Output format example:
      {
        "gradient": "linear-gradient(to right, #000000, #ffffff)",
        "mapStyle": "classic"
      }
    `;

    const result = await model.generateJson({
      prompt,
      jsonSchema: schema,
      strict: true
    });

    return res.status(200).json(result.json);

  } catch (err) {
    console.error("suggestGoalTheme ERROR:", err);
    return res.status(500).json({ error: "Failed to generate theme" });
  }
}

function getBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data)));
  });
}
