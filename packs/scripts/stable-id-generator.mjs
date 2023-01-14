/**
 * Generate a cryptographically secure random id
 * @param {number} length 
 * @returns {string} random alphanumerical string of the given length
 */
export function getId (length) {
  const randomBits = globalThis.crypto.getRandomValues(new Uint8Array(length * 2));
  const base64 = Buffer.from(randomBits).toString('base64');
  const base62 = base64.replace(/[+/]/g, '');
  const id = base62.substring(0, length);
  if (id.length == 16) {
    return id;
  }
  return getId(length);
}

/**
 * Generator function that returns a new stable id for each call.
 * Each individual generator keeps track of already generated ids to avoid
 * duplicates (even tho the probability is very low).
 */
export default function* getStableIdGenerator () {
  const usedIds = new Set();
  let id;
  while (true) {
    do {
      id = getId(16);
    } while (usedIds.has(id));
    yield id;
  }
};