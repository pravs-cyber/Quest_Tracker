import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export default async function handler(req, res) {
  const { title, description } = JSON.parse(req.body);

  const ai = new GoogleGenerativeAI(process.env.API_KEY);
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      tools: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      }
    },
    required: ["tools"]
  };

  const prompt = `
    Suggest 1-3 tools needed for this step:
    Title: ${title}
    Description: ${description}
  `;

  const response = await model.generateContent({
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return res.status(200).json(JSON.parse(response.text()));
}
