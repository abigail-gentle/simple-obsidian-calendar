/**
 * Tests for src/ui/sources/tags.ts
 *
 * Key behaviours confirmed from source analysis:
 *   - Uses parseFrontMatterTags (obsidian mock) to get tags
 *   - Strips leading '#' from all tags
 *   - Non-emoji tags → data-tags attribute (space-joined)
 *   - First emoji tag → data-emoji-tag attribute
 *   - Attributes are only set when non-empty (no empty string attributes)
 *   - null file or null cache → empty dataAttributes, no throw
 */

describe("customTagsSource", () => {
  it.todo("has id 'tags'");

  it.todo("has defaultSettings with display 'calendar-and-menu'");

  // -------------------------------------------------------------------------
  // Null file
  // -------------------------------------------------------------------------

  describe("getMetadata('day', date, null)", () => {
    it.todo(
      "returns { dots: [], dataAttributes: {} } without accessing metadataCache"
    );
  });

  // -------------------------------------------------------------------------
  // File with no frontmatter
  // -------------------------------------------------------------------------

  describe("getMetadata with a file that has no frontmatter", () => {
    it.todo("returns empty dataAttributes");
  });

  // -------------------------------------------------------------------------
  // File with frontmatter but no tags
  // -------------------------------------------------------------------------

  describe("getMetadata with a file that has no tags in frontmatter", () => {
    it.todo("returns empty dataAttributes");
  });

  // -------------------------------------------------------------------------
  // Text tags
  // -------------------------------------------------------------------------

  describe("getMetadata with a file that has only text tags", () => {
    it.todo("sets a non-empty data-tags attribute");

    it.todo("includes each tag name in the data-tags attribute value");

    it.todo("strips the leading '#' from each tag");
  });

  // -------------------------------------------------------------------------
  // Emoji tags
  // -------------------------------------------------------------------------

  describe("getMetadata with a file that has only emoji tags", () => {
    it.todo("sets the data-emoji-tag attribute to the first emoji tag");

    it.todo("does not set the data-tags attribute");
  });

  // -------------------------------------------------------------------------
  // Mixed text and emoji tags
  // -------------------------------------------------------------------------

  describe("getMetadata with a file that has both text and emoji tags", () => {
    it.todo("puts text tags in data-tags");

    it.todo("puts only the first emoji tag in data-emoji-tag");

    it.todo("does not include emoji tags in data-tags");
  });

  // -------------------------------------------------------------------------
  // Null metadataCache response
  // -------------------------------------------------------------------------

  describe("when metadataCache.getFileCache returns null", () => {
    it.todo("returns empty dataAttributes without throwing");
  });

  // -------------------------------------------------------------------------
  // Week granularity
  // -------------------------------------------------------------------------

  describe("getMetadata('week', date, file)", () => {
    it.todo(
      "behaves identically to the 'day' case (unified API — same code path)"
    );
  });
});
