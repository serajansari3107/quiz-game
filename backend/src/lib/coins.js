// Coin rules (server-side). Client kabhi coins ya balance nahi bhejta.
const DAILY_CAP = 500; // ek account ke liye 1 din (IST) mein max coins
const PERFECT_BONUS = { 5: 5, 10: 10, 20: 20 };

// Coin Shop: dono items ki price server tay karta hai (client price nahi bhejta)
const SHOP_PRICE = 10;
const SHOP_ITEMS = ["xl", "ss"]; // xl = Extra Lifeline, ss = Streak Skip

// Ek round mein har item (Streak Skip aur Extra Lifeline) ki max use: 5 sawal = 1, 10 sawal = 2, 20 sawal = 3
const MAX_ITEM_USE = { 5: 1, 10: 2, 20: 3 };
const maxItemUse = (n) => MAX_ITEM_USE[n] || 0;

// Perfect round: jitne sawal count hue (Streak Skip wale nahi) sab sahi. k = valid Streak Skips.
function isPerfect(n, right, k) {
  return right > 0 && right + (k || 0) === n;
}

// Har correct answer = 1 coin; perfect round (saare sawal sahi) par bonus.
function roundCoins(n, right, k) {
  const base = right > 0 ? right : 0;
  const bonus = isPerfect(n, right, k) ? PERFECT_BONUS[n] || 0 : 0;
  return { base, bonus, total: base + bonus };
}

module.exports = { DAILY_CAP, PERFECT_BONUS, SHOP_PRICE, SHOP_ITEMS, maxItemUse, isPerfect, roundCoins };
