import { cleanMessageText } from "./textUtils.js";

/**
 * Splits markdown text into structured block items: header, numbered, bullet, paragraph.
 * @param {string} rawText
 * @returns {Array<{type: string, text: string, level?: number, num?: string}>}
 */
export function parseMarkdownBlocks(rawText) {
  if (!rawText || typeof rawText !== "string") return [];
  const cleaned = cleanMessageText(rawText);
  if (!cleaned) return [];

  const lines = cleaned.split(/\r?\n/);
  const blocks = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Header (#, ##, ###)
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      blocks.push({
        type: "header",
        level: headerMatch[1].length,
        text: headerMatch[2],
      });
      continue;
    }

    // Numbered list item (e.g., "1.", "۲.", "1-", "۲-", "1)")
    const numMatch = trimmed.match(/^([0-9\u06F0-\u06F9]+)[\.\-\)]\s+(.*)$/);
    if (numMatch) {
      blocks.push({
        type: "numbered",
        num: numMatch[1],
        text: numMatch[2],
      });
      continue;
    }

    // Bullet list item ("- ", "* ", "• ")
    const bulletMatch = trimmed.match(/^[\*\-\•]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({
        type: "bullet",
        text: bulletMatch[1],
      });
      continue;
    }

    // Standard paragraph line
    blocks.push({
      type: "paragraph",
      text: trimmed,
    });
  }

  return blocks;
}

/**
 * Converts markdown into safe, beautifully styled inline HTML suitable for PDF generation.
 * @param {string} rawText
 * @param {{isRTL?: boolean}} options
 * @returns {string} Clean HTML string
 */
export function markdownToCleanHtml(rawText, { isRTL = true } = {}) {
  if (!rawText || typeof rawText !== "string") return "";
  const cleaned = cleanMessageText(rawText);
  if (!cleaned) return "";

  const blocks = parseMarkdownBlocks(cleaned);
  if (!blocks.length) return "";

  const renderInlineHtml = (text) => {
    // Escape HTML special characters
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold: **text** or __text__
    escaped = escaped.replace(
      /(\*\*|__)(.*?)\1/g,
      '<strong style="font-weight: 700; color: #0f172a;">$2</strong>'
    );

    // Italic: *text* or _text_
    escaped = escaped.replace(
      /(\*|_)(.*?)\1/g,
      '<em style="font-style: italic; color: #334155;">$2</em>'
    );

    // Code: `code`
    escaped = escaped.replace(
      /`([^`]+)`/g,
      '<code style="background: #f1f5f9; padding: 1px 4px; border-radius: 4px; font-family: monospace; font-size: 10px; color: #b45309;">$1</code>'
    );

    return escaped;
  };

  const htmlParts = blocks.map((block) => {
    const inline = renderInlineHtml(block.text);

    if (block.type === "header") {
      return `<div style="font-weight: 700; color: #0f172a; margin-top: 6px; margin-bottom: 3px; font-size: 11px;">${inline}</div>`;
    }

    if (block.type === "numbered") {
      const marginSide = isRTL ? "margin-left: 6px;" : "margin-right: 6px;";
      return `<div style="display: flex; align-items: flex-start; margin-bottom: 3px;"><span style="font-weight: 700; color: #b45309; ${marginSide} flex-shrink: 0;">${block.num}.</span><div style="flex: 1;">${inline}</div></div>`;
    }

    if (block.type === "bullet") {
      const marginSide = isRTL ? "margin-left: 6px;" : "margin-right: 6px;";
      return `<div style="display: flex; align-items: flex-start; margin-bottom: 3px;"><span style="color: #d97706; font-size: 13px; line-height: 1; ${marginSide} flex-shrink: 0; margin-top: 2px;">•</span><div style="flex: 1;">${inline}</div></div>`;
    }

    return `<div style="margin-bottom: 3px;">${inline}</div>`;
  });

  return htmlParts.join("");
}

/**
 * Strips all markdown syntax characters and returns plain clean text.
 * @param {string} rawText
 * @returns {string} Plain text
 */
export function stripMarkdown(rawText) {
  if (!rawText || typeof rawText !== "string") return "";
  let text = cleanMessageText(rawText);
  // Remove headers
  text = text.replace(/^#{1,6}\s+/gm, "");
  // Remove bold & italic
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, "$1");
  // Remove bullets
  text = text.replace(/^[\*\-\•]\s+/gm, "");
  return text.trim();
}

export default {
  parseMarkdownBlocks,
  markdownToCleanHtml,
  stripMarkdown,
};
