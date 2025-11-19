import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const { theme } = JSON.parse(req.body);

  const ai = new GoogleGenerativeAI(process.env.API_KEY);
  const model = ai.getGenerativeModel({ model: "imagen-4.0-generate-001" });

  const response = await model.generateImages({
    prompt: `Top-down treasure map background. Theme: ${theme}. No text.`,
    n: 1
  });

  const bytes = response.generatedImages?.[0]?.image?.imageBytes;

  return res.status(200).send(bytes);
}
