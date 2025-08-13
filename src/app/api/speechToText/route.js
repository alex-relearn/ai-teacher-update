import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];

// This function handles POST requests to the /api/speechToText route
export async function POST(request) {
  try {
    const { fileUrl } = await request.json();

    console.log(fileUrl);

    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      console.log("file content is failed.============");
      throw new Error("Failed to fetch the file from fileUrl");
    }
    const fileBlob = await fileResponse.blob();

    console.log("file content is success.---------", fileBlob.size);
    
    const formData = new FormData();
    formData.append("file", fileBlob);
    formData.append("model", "whisper-1");

    console.log("uploading to openai-----------");
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        method: "POST",
        body: formData,
      }
    );
    const result = await response.json();

    return NextResponse.json({ text: result.text });
  } catch (error) {
    return NextResponse.json({ error: error });
  }
}
