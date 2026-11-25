/**
 * SMS segment accounting. A message is billed per segment:
 *  - GSM-7 text: 160 chars in one segment, 153 per segment when concatenated
 *  - anything outside GSM-7 (emoji, many non-Latin scripts) forces UCS-2: 70 / 67
 * Characters in the GSM-7 extension table (e.g. { } [ ] ~ \ ^ | EUR) count as two.
 */
const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXT = "^{}\\[~]|€\f";

export type SegmentInfo = { encoding: "GSM-7" | "UCS-2"; length: number; segments: number };

export function countSegments(text: string): SegmentInfo {
  let units = 0;
  let gsm = true;
  for (const ch of text) {
    if (GSM7_BASIC.includes(ch)) units += 1;
    else if (GSM7_EXT.includes(ch)) units += 2;
    else {
      gsm = false;
      break;
    }
  }
  if (gsm) {
    return { encoding: "GSM-7", length: units, segments: units === 0 ? 1 : units <= 160 ? 1 : Math.ceil(units / 153) };
  }
  // UCS-2 counts UTF-16 code units (an emoji is 2).
  const u16 = text.length;
  return { encoding: "UCS-2", length: u16, segments: u16 <= 70 ? 1 : Math.ceil(u16 / 67) };
}
