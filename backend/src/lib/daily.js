// Daily Challenge ke rules (server-side). Client sirf result (r, w) bhejta hai; coins server nikalta hai.
const QUESTIONS = 10; // ek challenge mein sawal
const BASE = 10; // challenge complete karne par
const PERFECT = 10; // 10/10 sahi par extra bonus

function dailyCoins(r) {
  const bonus = r === QUESTIONS ? PERFECT : 0;
  return { base: BASE, bonus, total: BASE + bonus };
}

module.exports = { QUESTIONS, BASE, PERFECT, dailyCoins };