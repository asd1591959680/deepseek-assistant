import { streamChat } from "../utils/deepseek";
import type { Message, Conversation, ChatSettings } from "../types";
import { computed, ref, watch } from "vue";
const SETTINGS_KEY = "dp-assist-settings";
const STORAGE_KEY = "dp-assist-conversations";
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function loadConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
function loadSettings(): ChatSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);

      const obj = {
        apiKey: parsed.key || "",
        model: parsed.modelNm || "deepseek-v4-flash",
        systemPrompt: parsed.systemPrompt || "",
        temperature:
          typeof parsed.temperature === "number" ? parsed.temperature : 0.7,
      };
      return obj;
    }
  } catch {
    /* 忽略 */
  }
  return {
    apiKey: "",
    model: "deepseek-v4-flash",
    systemPrompt: "你是一个有用的AI助手。",
    temperature: 0.7,
  };
}
export function useChat() {
  //读取本地数据对话列表
  const conversations = ref<Conversation[]>(loadConversations());
  const currentId = ref<string>("");
  const errorMsg = ref("");
  const isLoading = ref(false);
  const abortController = ref<AbortController | null>(null);
  //读取本地数据设置
  const settings = ref<ChatSettings>(loadSettings());
  //监听对话列表变化，动态更新当前对话
  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === currentId.value),
  );
  //赋值当前对话的消息
  const currentMessages = computed(
    () => currentConversation.value?.messages || [],
  );

  // 持久化对话列表到本地存储
  watch(
    conversations,
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    },
    { deep: true },
  );
  // 持久化设置到本地存储
  watch(
    settings,
    (val) => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(val));
    },
    { deep: true },
  );
  // 新建对话
  function createConversation() {
    const conv: Conversation = {
      id: generateId(),
      title: "新对话",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // 将新对话添加到列表顶部
    conversations.value.unshift(conv);
    currentId.value = conv.id;
    return conv;
  }
  // 删除对话
  function deleteConversation(id: string) {
    conversations.value = conversations.value.filter((c) => c.id !== id);
    if (currentId.value === id) {
      currentId.value = conversations.value[0]?.id || "";
    }
  }
  // 切换对话
  function switchConversation(id: string) {
    currentId.value = id;
  }
  // 发送消息
  async function sendMessage(content: string) {
    if (!content.trim()) return;
    // 确保有当前会话
    if (!currentConversation.value) createConversation();
    const conv = currentConversation.value!;
    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };
    conv.messages.push(userMsg);
    // 用第一条用户消息作为标题
    if (conv.messages.filter((m) => m.role === "user").length === 1) {
      conv.title =
        content.trim().slice(0, 12) + (content.trim().length > 12 ? "..." : "");
    }
    // 助手消息占位
    const assistantMsg: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };
    conv.messages.push(assistantMsg);
    conv.updatedAt = Date.now();
    isLoading.value = true;
    abortController.value = new AbortController();
    // 构建发送给 API 的消息列表
    const chatMessages = [
      ...(settings.value.systemPrompt
        ? [{ role: "system" as const, content: settings.value.systemPrompt }]
        : []),
      ...conv.messages
        .filter((m) => m.role !== "system" && m.id !== assistantMsg.id)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    ];
    await streamChat(
      chatMessages,
      settings.value.apiKey,
      {
        onChunk(text: string) {
          const msg = conv.messages.find((m) => m.id === assistantMsg.id);
          if (msg) msg.content += text;
        },
        onDone() {
          const msg = conv.messages.find((m) => m.id === assistantMsg.id);
          if (msg) msg.isStreaming = false;
          isLoading.value = false;
          abortController.value = null;
        },
        onError(error: Error) {
          const msg = conv.messages.find((m) => m.id === assistantMsg.id);
          if (msg) {
            msg.content = `请求出错: ${error.message}`;
            msg.isStreaming = false;
          }
          isLoading.value = false;
          abortController.value = null;
          errorMsg.value = error.message;
        },
      },
      settings.value.model,
      settings.value.temperature,
    );
  }
  // 中断对话生成
  function stopGeneration() {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
    isLoading.value = false;
    const conv = currentConversation.value;
    if (conv) {
      const streaming = conv.messages.find((m) => m.isStreaming);
      if (streaming) streaming.isStreaming = false;
    }
  }
  // 更新设置
  function updateSettings(newSettings: ChatSettings) {
    settings.value = { ...newSettings };
  }
  return {
    conversations,
    currentId,
    currentConversation,
    currentMessages,
    settings,
    isLoading,
    errorMsg,
    createConversation,
    deleteConversation,
    switchConversation,
    sendMessage,
    stopGeneration,
    updateSettings,
  };
}
