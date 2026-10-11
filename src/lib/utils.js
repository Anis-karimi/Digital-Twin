/**
 * Utility functions
 */

/**
 * Merges class names into a single string, filtering out falsy values.
 * @param  {...(string|boolean|undefined|null)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

export default cn;
