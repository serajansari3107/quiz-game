// Coin rules (server-side). Client kabhi coins ya balance nahi bhejta.
const DAILY_CAP = 500; // ek account ke liye 1 din (IST) mein max coins
const PERFECT_BONUS = { 5: 5, 10: 10, 20: 20 };

// Har correct answer = 1 coin; perfect round (saare sawal sahi) par bonus.
function roundCoins(n, right) {
  const base = right > 0 ? right : 0;
  const bonus = right === n ? PERFECT_BONUS[n] || 0 : 0;
  return { base, bonus, total: base + bonus };
}

module.exports = { DAILY_CAP, PERFECT_BONUS, roundCoins };
