import { browseGenderWhere, seekingValueFor, targetGenderFor } from "./browse-filter";

describe("browse gender rules", () => {
  it("women browse men and men browse women by default", () => {
    expect(targetGenderFor({ gender: "FEMALE" })).toBe("MALE");
    expect(targetGenderFor({ gender: "MALE" })).toBe("FEMALE");
    expect(targetGenderFor({ gender: "FEMALE", genderPreference: null })).toBe("MALE");
  });

  it("an explicit preference from signup wins over the default", () => {
    expect(targetGenderFor({ gender: "FEMALE", genderPreference: "WOMEN" })).toBe("FEMALE");
    expect(targetGenderFor({ gender: "MALE", genderPreference: "MEN" })).toBe("MALE");
    expect(targetGenderFor({ gender: "FEMALE", genderPreference: "MEN" })).toBe("MALE");
  });

  it("'everyone', or an unstated/non-binary gender with no preference, applies no restriction", () => {
    expect(targetGenderFor({ gender: "FEMALE", genderPreference: "EVERYONE" })).toBeNull();
    expect(targetGenderFor({ gender: "NON_BINARY" })).toBeNull();
    expect(targetGenderFor({ gender: "OTHER" })).toBeNull();
    expect(targetGenderFor({ gender: "PREFER_NOT_TO_SAY" })).toBeNull();
    expect(targetGenderFor({ gender: null })).toBeNull();
    expect(targetGenderFor({})).toBeNull();
  });

  it("maps the viewer's gender to what a candidate must be seeking", () => {
    expect(seekingValueFor("MALE")).toBe("MEN");
    expect(seekingValueFor("FEMALE")).toBe("WOMEN");
    expect(seekingValueFor("NON_BINARY")).toBeNull();
    expect(seekingValueFor(null)).toBeNull();
  });

  it("builds the query: gender restriction + mutual interest (open, everyone, or seeking the viewer)", () => {
    expect(browseGenderWhere({ gender: "FEMALE" })).toEqual([
      { gender: "MALE" },
      { OR: [{ genderPreference: null }, { genderPreference: "EVERYONE" }, { genderPreference: "WOMEN" }] },
    ]);
    expect(browseGenderWhere({ gender: "MALE" })).toEqual([
      { gender: "FEMALE" },
      { OR: [{ genderPreference: null }, { genderPreference: "EVERYONE" }, { genderPreference: "MEN" }] },
    ]);
  });

  it("a viewer with no restriction still can't see people who only want a specific gender they aren't", () => {
    expect(browseGenderWhere({ gender: "NON_BINARY" })).toEqual([{ OR: [{ genderPreference: null }, { genderPreference: "EVERYONE" }] }]);
  });
});
