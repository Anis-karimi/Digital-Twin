import React from "react";
import { parseMarkdownBlocks } from "@/utils/markdownUtils.js";
import { isPersianText } from "@/utils/textUtils";

/**
 * Parses inline markdown tokens (bold, italic, inline code) into React elements.
 * @param {string} text
 * @returns {React.ReactNode[]}
 */
function renderInlineMarkdown(text) {
  if (!text) return [];

  // Match: `code`, **bold**, __bold__, *italic*, _italic_
  const regex = /(`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_))/g;
  const elements = [];
  let lastIndex = 0;
  let match;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // Inline code
      elements.push(
        <code
          key={`code-${keyIdx++}`}
          className="font-mono text-[11px] sm:text-xs bg-neutral-200/70 dark:bg-neutral-800 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-neutral-300/50 dark:border-neutral-700 mx-0.5 inline-block align-middle"
        >
          {match[2]}
        </code>
      );
    } else if (match[3] || match[4]) {
      // Bold
      const boldText = match[3] || match[4];
      elements.push(
        <strong
          key={`bold-${keyIdx++}`}
          className="font-bold text-neutral-900 dark:text-neutral-100"
        >
          {boldText}
        </strong>
      );
    } else if (match[5] || match[6]) {
      // Italic
      const italicText = match[5] || match[6];
      elements.push(
        <em
          key={`italic-${keyIdx++}`}
          className="italic text-neutral-800 dark:text-neutral-200"
        >
          {italicText}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

/**
 * FormattedMarkdown renders rich text with styled bold, italic, inline code,
 * numbered points, and bullet items without raw markdown artifacts.
 *
 * @param {Object} props
 * @param {string} props.content - Markdown text to render
 * @param {string} [props.className] - Additional wrapper class names
 * @param {boolean} [props.isRTL] - Force RTL or LTR (auto-detected if omitted)
 */
export const FormattedMarkdown = ({
  content,
  className = "",
  isRTL: forcedRTL,
}) => {
  if (!content || typeof content !== "string" || !content.trim()) {
    return null;
  }

  const isRTL =
    typeof forcedRTL === "boolean" ? forcedRTL : isPersianText(content);
  const blocks = parseMarkdownBlocks(content);

  if (!blocks.length) {
    return null;
  }

  return (
    <div
      className={`space-y-2 text-xs sm:text-sm leading-relaxed ${
        isRTL
          ? "fa-body font-vazir text-right"
          : "en-body font-inter text-left"
      } ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {blocks.map((block, idx) => {
        if (block.type === "header") {
          return (
            <div
              key={`h-${idx}`}
              className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 pt-1 pb-0.5 border-b border-amber-200/50 dark:border-amber-500/20"
            >
              {renderInlineMarkdown(block.text)}
            </div>
          );
        }

        if (block.type === "numbered") {
          return (
            <div
              key={`num-${idx}`}
              className="flex items-start gap-2 pt-0.5"
            >
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold shrink-0 border border-amber-200 dark:border-amber-700/40 select-none">
                {block.num}
              </span>
              <div className="flex-1 text-neutral-700 dark:text-neutral-200">
                {renderInlineMarkdown(block.text)}
              </div>
            </div>
          );
        }

        if (block.type === "bullet") {
          return (
            <div
              key={`b-${idx}`}
              className="flex items-start gap-2 pt-0.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-2 shrink-0 select-none" />
              <div className="flex-1 text-neutral-700 dark:text-neutral-200">
                {renderInlineMarkdown(block.text)}
              </div>
            </div>
          );
        }

        return (
          <p
            key={`p-${idx}`}
            className="text-neutral-700 dark:text-neutral-200"
          >
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
};

export default FormattedMarkdown;
