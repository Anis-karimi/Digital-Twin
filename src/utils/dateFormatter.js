/**
 * Utility for formatting server timestamps to Solar Hijri (Shamsi) or Gregorian dates
 * based on current application language (Persian vs English).
 */

export const formatChatDate = (timestamp, isRTL = true) => {
  if (!timestamp) return "";

  try {
    let dateObj;

    if (typeof timestamp === "number") {
      // If unix seconds (10 digits), convert to ms
      dateObj = new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp);
    } else if (typeof timestamp === "string") {
      // Check if it's already a non-date text
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
      }).format(dateObj);
    } else {
      // Gregorian calendar formatting
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(dateObj);
    }
  } catch (error) {
    console.error("formatChatDate error:", error);
    return String(timestamp);
  }
};

export const formatChatTime = (timestamp, isRTL = true) => {
  if (!timestamp) return "";

  try {
    let dateObj = typeof timestamp === "number" 
      ? new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp)
      : new Date(timestamp);

    if (isNaN(dateObj.getTime())) return "";

    return new Intl.DateTimeFormat(isRTL ? "fa-IR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dateObj);
  } catch (error) {
    return "";
  }
};
