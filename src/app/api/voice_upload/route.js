import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
 
export async function POST(request) {
  const body = await request.json();
 
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['audio/wav',],
          tokenPayload: JSON.stringify({
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('blob upload completed', blob, tokenPayload);
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { status: 400 }, // The webhook will retry 5 times waiting for a status 200
    );
  }
}