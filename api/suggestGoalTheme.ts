import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const { title, description } = await getBody(req);

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
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
      prompt: `Suggest a quest theme for ${title}. ${description}`,
      jsonSchema: schema
    });

    return res.status(200).json(result.json);

  } catch (err) {
    console.error("suggestGoalTheme error:", err);
    return res.status(500).json({ error: "Theme suggestion failed" });
  }
}

function getBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data)));
  });
}
