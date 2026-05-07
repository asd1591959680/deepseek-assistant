// src/utils/pdfLoader.ts
import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// 统一在一处配置 workerSrc，其他地方不要重复设置
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

/**
 * 从 PDF 文件中提取纯文本
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    // 禁用 worker 内部的字体渲染，纯文本提取不需要
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .filter((item): item is TextItem => "str" in item)
      .map((item) => item.str)
      .join(" ");

    pageTexts.push(pageText);
    onProgress?.(i, totalPages);
  }

  return pageTexts.join("\n");
}
