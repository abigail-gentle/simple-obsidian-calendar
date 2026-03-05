/**
 * Tests for src/ui/context.ts
 */

import { DISPLAYED_MONTH, IS_MOBILE } from "src/ui/context";

describe("context symbols", () => {
  it("IS_MOBILE is a Symbol", () => {
    expect(typeof IS_MOBILE).toBe("symbol");
  });

  it("DISPLAYED_MONTH is a Symbol", () => {
    expect(typeof DISPLAYED_MONTH).toBe("symbol");
  });

  it("IS_MOBILE and DISPLAYED_MONTH are distinct symbols", () => {
    expect(IS_MOBILE).not.toBe(DISPLAYED_MONTH);
  });
});
