export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  sources?: RetrievedChunk[];
}
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  sources?: RetrievedChunk[];
  isStreaming?: boolean;
}
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
export interface ChatSettings {
  apiKey: string;
  model: string;
  systemPrompt: string;
  temperature: number;
}

// RAG
export interface DocumentChunk {
  id: string;
  content: string;
  docId: string;
  docName: string;
  chunkIndex: number;
  embedding?: number[];
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  chunks: number;
  createdAt: Date;
  status: "processing" | "ready" | "error";
  errorMsg?: string;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  docName: string;
  score: number;
}

export interface LLMConfig {
  provider: "openai" | "ollama" | "custom";
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface EmbeddingProgress {
  status: "idle" | "loading" | "ready" | "error";
  progress: number;
  message: string;
}

export interface RAGStats {
  totalDocs: number;
  totalChunks: number;
  embeddingModel: string;
  searchAlgorithm: string;
}
