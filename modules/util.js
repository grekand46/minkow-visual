/**
 * @param {boolean} test
 * @param {msg} string
 */
export function assert(test, msg) {
    if (!test) throw new Error(msg);
}

/**
 * @param {object} obj 
 * @param {string} key 
 * @returns {null | any}
 */
export function attr(obj, key) {
    if (obj === undefined || obj === null) return null;
    return obj[key];
}

export function hdist(a, b) {
    return Math.sqrt((a.y - b.y) ** 2 - (a.x - b.x) ** 2);
}