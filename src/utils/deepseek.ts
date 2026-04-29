const API_URL = "https://api.deepseek.com/chat/completions";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamChat(
  messages: ChatMessage[],
  apiKey: string,
  callbacks: StreamCallbacks,
  model: string = "deepseek-v4-flash",
  temperature: number = 0.7,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature,
      }),
      signal,
    });

    if (!response.ok) {
      let errorMsg = `API 请求失败: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error?.message || errorMsg;
      } catch {
        /* 忽略解析错误 */
      }
      throw new Error(errorMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法获取响应流");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // 按行拆分，最后一行可能不完整，保留在 buffer 中
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            callbacks.onChunk(content);
          }
        } catch {
          /* 忽略单行解析错误 */
        }
      }
    }

    callbacks.onDone();
  } catch (error) {
    // 用户主动中断，静默处理
    if (error instanceof Error && error.name === "AbortError") {
      callbacks.onDone();
      return;
    }
    callbacks.onError(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
