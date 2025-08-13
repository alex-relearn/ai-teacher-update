
import dotenv from 'dotenv';
dotenv.config();


import { Polly } from "@aws-sdk/client-polly";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import * as fs from "fs";
import { promisify } from "util";
import { finished } from "stream/promises";

// Create Polly client with credentials from environment variables
const pollyClient = new Polly({
  credentials: fromEnv(),
  region: process.env.AWS_REGION,
});

async function synthesizeWithPollyAndFetchVisemes(text = "I'm excited to try text to speech with Amazon Polly") {
  const audioParams = {
    Text: text,
    OutputFormat: "mp3",
    VoiceId: "Joanna",
  };

  const visemeParams = {
    Text: text,
    OutputFormat: "json",
    VoiceId: "Joanna",
    SpeechMarkTypes: ["viseme"],
  };

  try {
    // Synthesize speech
    const audioResult = await pollyClient.synthesizeSpeech(audioParams);
    const audioStream = audioResult.AudioStream;

    // Write audio stream to file
    const outputFileStream = fs.createWriteStream("output_tts.mp3");
    audioStream.pipe(outputFileStream);
    await finished(outputFileStream); // Wait for the writing to finish

    // Fetch viseme data
    const visemeResult = await pollyClient.synthesizeSpeech(visemeParams);
    const visemes = await streamToString(visemeResult.AudioStream);

    console.log("Viseme Data:", visemes);

    return { audioStream, visemes };
  } catch (error) {
    console.error("Error synthesizing speech with Polly or fetching visemes:", error);
    throw error;
  }
}

// Helper function to convert stream to string
function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

synthesizeWithPollyAndFetchVisemes().catch(console.error);


























// import sdk from "microsoft-cognitiveservices-speech-sdk";
// import { PassThrough } from "stream";
// import fs from "fs";

// async function textToSpeech(text = "I'm excited to try text to speech") {
//   console.log(process.env.SPEECH_KEY,
//     process.env.SPEECH_REGION)
//   // Ensure your Azure credentials are set in the environment variables
//   const speechConfig = sdk.SpeechConfig.fromSubscription(
//     process.env.SPEECH_KEY,
//     process.env.SPEECH_REGION
//   );

//   // Choose a voice for speech synthesis
//   speechConfig.speechSynthesisVoiceName = `ja-JP-NanamiNeural`;

//   const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
//   const visemes = [];

//   speechSynthesizer.visemeReceived = function (s, e) {
//     visemes.push([e.audioOffset / 10000, e.visemeId]);
//   };

//   const audioStream = await new Promise((resolve, reject) => {
//     speechSynthesizer.speakTextAsync(
//       text,
//       (result) => {
//         const { audioData } = result;
//         speechSynthesizer.close();

//         const bufferStream = new PassThrough();
//         bufferStream.end(Buffer.from(audioData));
//         resolve(bufferStream);
//       },
//       (error) => {
//         console.log(error);
//         speechSynthesizer.close();
//         reject(error);
//       }
//     );
//   });

//   // Optional: Save to a file
//   const outputStream = fs.createWriteStream("output_tts.mp3");
//   audioStream.pipe(outputStream);

//   console.log("Visemes:", JSON.stringify(visemes));
// }

// textToSpeech("Hello, welcome to our text to speech transformation!");
