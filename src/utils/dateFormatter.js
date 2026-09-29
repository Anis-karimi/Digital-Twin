/**
 * Utility for formatting server timestamps to Solar Hijri (Shamsi) or Gregorian dates
 * based on current application language (Persian vs English) and user timezone.
 */

import { toPersianDigits } from "./dateUtils";

export const formatChatDate = (timestamp, isRTL = true, timeZone = null) => {
  if (!timestamp) return "";

  try {
    const tz =
      timeZone ||
      (typeof Intl !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "Asia/Tehran";

    let dateObj;

    if (typeof timestamp === "number") {
      // If unix seconds (10 digits), convert to ms
      dateObj = new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp);
    } else if (typeof timestamp === "string") {
      const parsed = Date.parse(timestamp);
      if (isNaN(parsed)) {
        return timestamp;
      }
      dateObj = new Date(parsed);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else {
      return "";
    }

    if (isNaN(dateObj.getTime())) {
      return String(timestamp);
    }

    if (isRTL) {
      // Persian Solar Hijri calendar formatting
      return new Intl.DateTimeFormat("fa-IR", {
        day: "numeric",
        month: "long",
        timeZone: tz,
      }).format(dateObj);
    } else {
      // Gregorian calendar formatting
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: tz,
      }).format(dateObj);
    }
  } catch (error) {
    console.error("formatChatDate error:", error);
    return String(timestamp);
  }
};

export const formatChatTime = (timestamp, isRTL = true, timeZone = null) => {
  if (!timestamp) return "";

  try {
    const tz =
      timeZone ||
      (typeof Intl !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "Asia/Tehran";

    let dateObj;

    if (typeof timestamp === "number") {
      dateObj = new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === "string") {
      const trimmed = timestamp.trim();

      // If it's already HH:MM or HH:MM:SS with no date/timezone info
      if (
        /^[\d\u06F0-\u06F9]{1,2}:[\d\u06F0-\u06F9]{2}(:[\d\u06F0-\u06F9]{2})?$/.test(
          trimmed
        )
      ) {
        return isRTL ? toPersianDigits(trimmed.slice(0, 5)) : trimmed.slice(0, 5);
      }

      const parsed = Date.parse(trimmed);
      if (isNaN(parsed)) {
        return isRTL ? toPersianDigits(trimmed) : trimmed;
      }
      dateObj = new Date(parsed);
    } else {
      return "";
    }

    if (isNaN(dateObj.getTime())) {
      return String(timestamp);
    }

    const formatted = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(dateObj);

    return isRTL ? toPersianDigits(formatted) : formatted;
  } catch (error) {
    return String(timestamp);
  }
};
