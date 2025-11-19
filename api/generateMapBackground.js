import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const { theme } = await getBody(req);

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);

    const model = genAI.getGenerativeModel({
      model: "imagen-1.0",
    });

    const result = await model.generateImage({
      prompt: `A treasure map background. Theme: ${theme}. No text.`,
      size: "1024x1024",
    });

    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(result.image);

  } catch (err) {
    console.error("Map Error:", err);
    return res.status(500).json({ error: "Map generation failed" });
  }
}

function getBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data)));
  });
}
