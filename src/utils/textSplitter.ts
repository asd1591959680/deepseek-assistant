//将文本拆分为用于 RAG 的重叠块
export function splitTextIntoChunks(
  text: string,
  chunkSize = 512,
  chunkOverlap = 64,
): string[] {
  const sentences = text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[。！？.!?\n])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const chunks: string[] = [];
  let current = "";
  let overlapBuffer = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // 从当前块的末尾构建重叠部分
      const words = current.split(" ");
      overlapBuffer = words.slice(-Math.floor(chunkOverlap / 5)).join(" ");
      current = overlapBuffer + " " + sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  // 如果未找到句子边界，回退到硬拆分
  if (chunks.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
      chunks.push(text.slice(i, i + chunkSize));
    }
  }

  return chunks.filter((c) => c.length > 20);
}

/**
 * 从文件对象（PDF、DOCX、TXT、MD）中提取文本
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    return await file.text();
  }

  if (ext === "pdf") {
    return await extractFromPDF(file);
  }

  if (ext === "docx") {
    return await extractFromDOCX(file);
  }

  throw new Error(`不支持的文件类型: .${ext}`);
}

async function extractFromPDF(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        // 类型守卫：检查是否有 str 属性
        if ("str" in item) {
          return item.str;
        }
        return "";
      })
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

async function extractFromDOCX(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
