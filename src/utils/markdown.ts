import { marked } from "marked";

marked.use({
  breaks: true,
  gfm: true,
  async: false, // 关键：同步解析
});

export function renderMarkdown(content: string): string {
  if (!content) return "";
  try {
    return marked.parse(content, { async: false }) as string;
  } catch {
    return content;
  }
}
