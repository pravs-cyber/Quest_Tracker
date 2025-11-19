import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { theme } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({
      model: "imagen-1.0",
    });

    const result = await model.generateImage({
      prompt: `A treasure map background, ${theme}. No text, no labels.`,
      size: "1024x1024",
    });

    const imageData = result.image;
    return new Response(imageData, {
      headers: {
        "Content-Type": "image/png",
      },
    });

  } catch (err) {
    console.error("generateMapBackground error:", err);
    return new Response(
      JSON.stringify({ error: "Image generation failed" }),
      { status: 500 }
    );
  }
}
