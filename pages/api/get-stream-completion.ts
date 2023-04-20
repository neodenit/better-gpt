import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { gptMessage } from '../../client-services/open-ai-service';
import { withApiAuthRequired } from '@auth0/nextjs-auth0'

const getStreamCompletion = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const apiKey = process.env.NEXT_PUBLIC_API_KEY;

        const verbose = false;
        const useGPT4 = false;
        const temperature = 0;

        const testMessages = [
            {
                "role": "user",
                "content": "What is AGI?"
            }
        ];

        const messages = req.body as gptMessage[];

        console.log("messages: " + JSON.stringify(messages));

        const parameters = {
            model: useGPT4 ? "gpt-4" : "gpt-3.5-turbo",
            temperature: temperature,
            stream: true,
            messages: messages,
        }

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "post",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(parameters),
            }
        )

        if (!response.body) return;

        const reader = response.body;
        const decoder = new TextDecoder();

        while (true) {
            const chunk = reader.read();

            if (chunk === null) {
                await new Promise((resolve) => reader.once('readable', resolve));
            } else if (chunk === '') {
                break;
            } else {
                const decodedChunk = decoder.decode(chunk as Buffer);

                const smallChunks = decodedChunk.trim().split(/\n\n/);

                smallChunks.forEach((smallChunk) => {
                    const jsonData = smallChunk.trim().slice(6); // Remove the "data: " prefix

                    if (jsonData.trim() === "[DONE]") {
                        console.log("Done");
                        return;
                    }

                    const parsedData = JSON.parse(jsonData);
                    const deltaContent = parsedData.choices[0]?.delta?.content;

                    if (!deltaContent) {
                        console.log("No delta content");
                        console.log("jsonData: " + jsonData);
                        return;
                    }

                    if (verbose) {
                        console.log("Server Side Delta: " + deltaContent.toString());
                    }
                    res.write(deltaContent);
                });
            }
        }

        console.log("Done reading");

        res.end();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('The fetch request was cancelled');
        } else {
            console.error('An error occurred: ', error);
        }
    }
}

export default withApiAuthRequired(getStreamCompletion);