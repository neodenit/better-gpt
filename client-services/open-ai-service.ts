export type gptMessage = {
    role: string;
    content: string;
}

export class OpenAIService {
    private controller: AbortController | null = null;

    public async getCompletionStream(messages: gptMessage[], temperature = 0, handle: (s: string) => void = null) {
        try {
            const apiKey = process.env.NEXT_PUBLIC_API_KEY;

            const useGPT4 = false;

            const parameters = {
                model: useGPT4 ? "gpt-4" : "gpt-3.5-turbo",
                temperature: temperature,
                stream: true,
                messages: messages,
            }

            if (this.controller) {
                console.log("Aborting previous request");
                this.controller.abort();
            }

            this.controller = new AbortController();

            const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "post",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(parameters),
                    signal: this.controller?.signal
                }
            )

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                let chunk = decoder.decode(value);
                const smallChunks = chunk.trim().split(/\n\n/);

                smallChunks.forEach((smallChunk) => {
                    var jsonData = smallChunk.trim().slice(6); // Remove the "data: " prefix

                    if (jsonData.trim() === "[DONE]") return;

                    const parsedData = JSON.parse(jsonData);
                    const deltaContent = parsedData.choices[0]?.delta?.content;

                    if (!deltaContent) return;
                    handle(deltaContent);
                });
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('The fetch request was cancelled');
            } else {
                console.error('An error occurred: ', error);
            }
        }
    }

    public async getCompletionStreamFromServer(messages: gptMessage[], handle: (s: string) => void) {
        try {
            const response = await fetch('/api/get-stream-completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages), // TODO: Send the last message only
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            const readStream = async () => {
                try {
                    const { done, value } = await reader.read();

                    if (done) {
                        console.log('Stream finished');
                        return;
                    }

                    const chunk = decoder.decode(value);
                    console.log('Received chunk:', chunk);

                    if (handle) {
                        handle(chunk);
                    }

                    readStream();
                } catch (error) {
                    console.error('Error reading stream:', error);
                }
            };

            readStream();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
}
