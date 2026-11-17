import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, blockConfigIssues } from "./course-blocks";

// Mirrors the backend config records (signa-api content/dto/config/*Config.java), camelCased.
const BACKEND_KEYS: Record<string, string[]> = {
  INFO: ["title", "text"],
  INTRODUCE_SIGN: ["meaning"],
  SELECT_MEANING: ["sign", "options"],
  SELECT_SIGN: ["word", "options"],
  CONTEXT_RESPONSE: ["question", "answer", "options"],
  MATCH: ["concepts"],
  VISUAL_RECOGNITION: ["signSequence", "options"],
  PERFORM_SIGN: ["signs"],
  SPELL_NAME: [],
  INVISIBLE_SIGNS: ["signs"],
};

describe("BLOCK_TYPES", () => {
  it("defines exactly the block types the backend knows", () => {
    expect(Object.keys(BLOCK_TYPES).sort()).toEqual(Object.keys(BACKEND_KEYS).sort());
  });

  it.each(Object.entries(BACKEND_KEYS))(
    "%s edits the same config keys as the backend",
    (t, keys) => {
      expect(BLOCK_TYPES[t]!.fields.map(([key]) => key)).toEqual(keys);
    },
  );

  it("edits PERFORM_SIGN as a list of signs", () => {
    expect(BLOCK_TYPES.PERFORM_SIGN!.fields).toEqual([["signs", "signs", "Seña a realizar"]]);
  });
});

describe("blockConfigIssues", () => {
  it("accepts a filled PERFORM_SIGN block", () => {
    expect(blockConfigIssues("PERFORM_SIGN", { signs: ["café"] })).toEqual([]);
  });

  it("flags a PERFORM_SIGN block without signs", () => {
    expect(blockConfigIssues("PERFORM_SIGN", { signs: [] })).toHaveLength(1);
    expect(blockConfigIssues("PERFORM_SIGN", {})).toHaveLength(1);
  });

  it("flags blank strings and blank list entries", () => {
    expect(blockConfigIssues("INTRODUCE_SIGN", { meaning: "  " })).toHaveLength(1);
    expect(blockConfigIssues("MATCH", { concepts: ["a", ""] })).toHaveLength(1);
  });

  it("does not require anything from SPELL_NAME", () => {
    expect(blockConfigIssues("SPELL_NAME", {})).toEqual([]);
  });

  it("flags unknown block types", () => {
    expect(blockConfigIssues("NOPE", {})).toHaveLength(1);
  });
});
