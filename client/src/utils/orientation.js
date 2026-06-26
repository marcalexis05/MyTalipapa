// Explicit orientation offsets (in degrees) for stalls where the generic spatial logic fails.
// Positive values rotate clockwise from North.
export const STALL_ORIENTATION = {
  meat: {
    // Stall 1 (entrance) faces forward, no offset needed.
    "1": 0,
    // Upside‑down stall 1(u) faces West, needs -90°.
    "1(u)": -90,
    // Add any other special cases here.
  },
  fish: {},
  veggies: {},
};
