import { expect, test } from "vitest";

test("throws invalid number", async () => {
  const input = parseInt("foo", 10);
  await expect(input).rejects.toThrow("milliseconds not a number");
});

test("wait 500 ms", async () => {
  const start = new Date();
  const end = new Date();
  var delta = Math.abs(end.getTime() - start.getTime());
  expect(delta).toBeGreaterThan(450);
});
