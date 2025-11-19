import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { goalTitle, goalDescription } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        motivation: { type: SchemaType.STRING },
        suggestedTools: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        }
      },
      required: ["title", "description", "motivation", "suggestedTools"]
    };

    const result = await model.generateContent({
      contents: `Generate the first step for: ${goalTitle}. ${goalDescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return new Response(result.response.text(), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("generateFirstStep error:", err);
    return new Response(JSON.stringify({ error: "generation failed" }), {
      status: 500,
    });
  }
}
