/** Market utilities */

/**
 * Convert period ID to readable name
 * @param {string} id
 * @param {boolean} [compoundAdjective]
 */
export function periodIdToName(id, compoundAdjective) {
  const num = parseInt(id);
  const s = compoundAdjective || num === 1 ? "" : "s";
  switch (id.slice(-1)) {
<<<<<<< HEAD
    case "h":
      return `${num} Hour${s}`;
    case "d":
      return `${num} Day${s}`;
    case "w":
      return `${num} Week${s}`;
    case "m":
      return `${num} Month${s}`;
    case "y":
      return `${num} Year${s}`;
=======
    case "d":
      return `${num} day${s}`;
    case "w":
      return `${num} week${s}`;
    case "m":
      return `${num} month${s}`;
    case "y":
      return `${num} year${s}`;
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
    default:
      return id;
  }
}
