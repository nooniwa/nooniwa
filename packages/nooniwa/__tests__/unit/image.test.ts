import { describe, test, expect } from "vitest";
import {
  isImageFile,
  computeRelativeImagePath,
} from "../../plugins/remark/image";

describe("isImageFile", () => {
  test("returns true for image extensions, case-insensitive", () => {
    expect(isImageFile("a.png")).toBe(true);
    expect(isImageFile("a.PNG")).toBe(true);
    expect(isImageFile("photo.jpeg")).toBe(true);
    expect(isImageFile("pic.avif")).toBe(true);
    expect(isImageFile("PIC.AVIF")).toBe(true);
  });

  test("returns false for non-images and extensionless names", () => {
    expect(isImageFile("note.md")).toBe(false);
    expect(isImageFile("noext")).toBe(false);
  });
});

describe("computeRelativeImagePath", () => {
  test("walks up with ../ when the image is in another folder", () => {
    expect(
      computeRelativeImagePath(
        "wikilink/basic.md",
        "attachments/test-image.jpg",
      ),
    ).toBe("../attachments/test-image.jpg");
  });

  test("walks up with ../../ when the image is in a nested folder", () => {
    expect(
      computeRelativeImagePath(
        "wikilink/basic/index.md",
        "attachments/test-image.jpg",
      ),
    ).toBe("../../attachments/test-image.jpg");
  });

  test("prefixes ./ for same-folder and root-level images", () => {
    expect(computeRelativeImagePath("folder/note.md", "folder/pic.png")).toBe(
      "./pic.png",
    );
    expect(computeRelativeImagePath("index.md", "img.png")).toBe("./img.png");
  });
});
