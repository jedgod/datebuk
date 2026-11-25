import { countSegments } from "./sms-segments";

describe("SMS segment accounting", () => {
  it("GSM-7: 160 chars fit in one segment, 161 need two (153 each)", () => {
    expect(countSegments("a".repeat(160))).toMatchObject({ encoding: "GSM-7", segments: 1 });
    expect(countSegments("a".repeat(161)).segments).toBe(2);
    expect(countSegments("a".repeat(306)).segments).toBe(2);
    expect(countSegments("a".repeat(307)).segments).toBe(3);
  });
  it("extension characters count double", () => {
    expect(countSegments("{".repeat(80))).toMatchObject({ encoding: "GSM-7", length: 160, segments: 1 });
    expect(countSegments("{".repeat(81)).segments).toBe(2);
  });
  it("a single emoji forces UCS-2 (70 / 67 per segment)", () => {
    expect(countSegments("hi 😀")).toMatchObject({ encoding: "UCS-2", segments: 1 });
    expect(countSegments("é".repeat(70)).encoding).toBe("GSM-7");
    expect(countSegments("😀".repeat(36)).segments).toBe(2); // 72 UTF-16 units
    expect(countSegments("a".repeat(70) + "😀").segments).toBe(2);
  });
  it("empty text is one segment", () => {
    expect(countSegments("").segments).toBe(1);
  });
});
