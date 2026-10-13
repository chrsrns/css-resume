import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installPrintImageDownscale } from "../js/print-image.js";

const makeImg = ({
  hidden = false,
  src = "img/profile.jpg",
  complete = true,
  w = 2169,
  h = 2170,
} = {}) => {
  const img = document.createElement("img");
  img.id = "profileImage";
  if (hidden) img.classList.add("hidden");
  if (src) img.setAttribute("src", src);
  Object.defineProperties(img, {
    naturalWidth: { value: w, configurable: true, writable: true },
    naturalHeight: { value: h, configurable: true, writable: true },
    complete: { value: complete, configurable: true, writable: true },
  });
  document.body.appendChild(img);
  return img;
};

let origCanvasMethods = null;

const stubCanvas = ({
  context = {
    fillStyle: "",
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  },
  toDataURL = vi.fn(() => "data:image/jpeg;base64,FAKE"),
} = {}) => {
  if (!origCanvasMethods) {
    origCanvasMethods = {
      getContext: Object.getOwnPropertyDescriptor(
        HTMLCanvasElement.prototype,
        "getContext",
      ),
      toDataURL: Object.getOwnPropertyDescriptor(
        HTMLCanvasElement.prototype,
        "toDataURL",
      ),
    };
  }
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    value: () => context,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
    value: toDataURL,
    configurable: true,
    writable: true,
  });
  return { context, toDataURL };
};

const restoreCanvas = () => {
  if (!origCanvasMethods) return;
  for (const [name, descriptor] of Object.entries(origCanvasMethods)) {
    if (descriptor) {
      Object.defineProperty(HTMLCanvasElement.prototype, name, descriptor);
    } else {
      delete HTMLCanvasElement.prototype[name];
    }
  }
  origCanvasMethods = null;
};

const beforePrint = () => window.dispatchEvent(new Event("beforeprint"));
const afterPrint = () => window.dispatchEvent(new Event("afterprint"));
const fireLoad = (img) => img.dispatchEvent(new Event("load"));

let uninstalls = [];

const install = (img, maxDim) => {
  const uninstall = installPrintImageDownscale(img, maxDim);
  uninstalls.push(uninstall);
  return uninstall;
};

describe("installPrintImageDownscale", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    uninstalls = [];
  });

  afterEach(() => {
    for (const uninstall of uninstalls) uninstall();
    uninstalls = [];
    vi.restoreAllMocks();
    restoreCanvas();
    document.body.innerHTML = "";
  });

  it("pre-generates the cache at install for an already-complete image", () => {
    const img = makeImg();
    const { toDataURL } = stubCanvas();
    install(img);
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.85);
  });

  it("generates the cache on load when the image was incomplete at install", () => {
    const img = makeImg({ complete: false });
    const { toDataURL } = stubCanvas();
    install(img);
    expect(toDataURL).not.toHaveBeenCalled();
    Object.defineProperty(img, "complete", { value: true, configurable: true });
    fireLoad(img);
    expect(toDataURL).toHaveBeenCalledOnce();
  });

  it("beforeprint installs the cached data URL", () => {
    const img = makeImg();
    stubCanvas();
    install(img);
    beforePrint();
    expect(img.getAttribute("src")).toBe("data:image/jpeg;base64,FAKE");
  });

  it("beforeprint does not run canvas work (cache is pre-generated)", () => {
    const img = makeImg();
    const { toDataURL, context } = stubCanvas();
    install(img);
    toDataURL.mockClear();
    context.drawImage.mockClear();
    beforePrint();
    expect(toDataURL).not.toHaveBeenCalled();
    expect(context.drawImage).not.toHaveBeenCalled();
  });

  it("caps the longer dimension at 512 preserving aspect", () => {
    const img = makeImg({ w: 1024, h: 2048 });
    const { context } = stubCanvas();
    install(img);
    expect(context.drawImage).toHaveBeenCalledWith(img, 0, 0, 256, 512);
  });

  it("fills a white background to flatten alpha", () => {
    const img = makeImg();
    const { context } = stubCanvas();
    install(img);
    expect(context.fillStyle).toBe("#ffffff");
    expect(context.fillRect).toHaveBeenCalled();
  });

  it("restores the original src attribute on afterprint", () => {
    const img = makeImg();
    stubCanvas();
    install(img);
    beforePrint();
    afterPrint();
    expect(img.getAttribute("src")).toBe("img/profile.jpg");
  });

  it("does not restore on afterprint when src changed during the swap window", () => {
    const img = makeImg();
    stubCanvas();
    install(img);
    beforePrint();
    img.setAttribute("src", "img/other.jpg");
    afterPrint();
    expect(img.getAttribute("src")).toBe("img/other.jpg");
  });

  it("does not install a stale cache when src changed after generation", () => {
    const img = makeImg();
    stubCanvas();
    install(img);
    img.setAttribute("src", "img/other.jpg");
    beforePrint();
    expect(img.getAttribute("src")).toBe("img/other.jpg");
  });

  it("regenerates the cache when src change fires a new load", () => {
    const img = makeImg();
    stubCanvas();
    install(img);
    img.setAttribute("src", "img/other.jpg");
    fireLoad(img);
    beforePrint();
    expect(img.getAttribute("src")).toBe("data:image/jpeg;base64,FAKE");
    afterPrint();
    expect(img.getAttribute("src")).toBe("img/other.jpg");
  });

  it("does not install when src was removed after generation", () => {
    const img = makeImg();
    stubCanvas();
    install(img);
    img.removeAttribute("src");
    beforePrint();
    expect(img.getAttribute("src")).toBeNull();
  });

  it("generates nothing and leaves src untouched when image is within 512px", () => {
    const img = makeImg({ w: 512, h: 512 });
    const { toDataURL, context } = stubCanvas();
    install(img);
    expect(toDataURL).not.toHaveBeenCalled();
    expect(context.drawImage).not.toHaveBeenCalled();
    beforePrint();
    expect(img.getAttribute("src")).toBe("img/profile.jpg");
  });

  it("generates nothing when the image is hidden", () => {
    const img = makeImg({ hidden: true });
    const { toDataURL } = stubCanvas();
    install(img);
    expect(toDataURL).not.toHaveBeenCalled();
    beforePrint();
    expect(img.getAttribute("src")).toBe("img/profile.jpg");
  });

  it("generates nothing when the image has no src", () => {
    const img = makeImg({ src: null });
    const { toDataURL } = stubCanvas();
    install(img);
    expect(toDataURL).not.toHaveBeenCalled();
    beforePrint();
    expect(img.getAttribute("src")).toBeNull();
  });

  it("keeps the original src when the canvas context is unavailable", () => {
    const img = makeImg();
    stubCanvas({ context: null });
    install(img);
    beforePrint();
    expect(img.getAttribute("src")).toBe("img/profile.jpg");
  });

  it("keeps the original src when toDataURL throws (CORS-tainted canvas)", () => {
    const img = makeImg();
    stubCanvas({
      toDataURL: vi.fn(() => {
        throw new Error("SecurityError");
      }),
    });
    install(img);
    expect(() => beforePrint()).not.toThrow();
    expect(img.getAttribute("src")).toBe("img/profile.jpg");
  });

  it("keeps the original src when drawImage throws", () => {
    const img = makeImg();
    stubCanvas({
      context: {
        fillStyle: "",
        fillRect: vi.fn(),
        drawImage: vi.fn(() => {
          throw new Error("tainted");
        }),
      },
    });
    install(img);
    expect(() => beforePrint()).not.toThrow();
    expect(img.getAttribute("src")).toBe("img/profile.jpg");
  });

  it("keeps the original src when toDataURL returns an empty payload", () => {
    const img = makeImg();
    stubCanvas({ toDataURL: vi.fn(() => "data:,") });
    install(img);
    beforePrint();
    expect(img.getAttribute("src")).toBe("img/profile.jpg");
  });

  it("returns an uninstall function that removes all listeners", () => {
    const img = makeImg();
    const { toDataURL } = stubCanvas();
    const uninstall = install(img);
    uninstall();
    fireLoad(img);
    beforePrint();
    expect(toDataURL).toHaveBeenCalledTimes(1);
    expect(img.getAttribute("src")).toBe("img/profile.jpg");
  });

  it("is a no-op when the image element is missing", () => {
    expect(() => install(null)).not.toThrow();
    expect(() => beforePrint()).not.toThrow();
    expect(() => afterPrint()).not.toThrow();
  });
});
