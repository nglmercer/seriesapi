import { expect, test, describe, beforeEach, spyOn, mock } from "bun:test";
import { JSDOM } from "jsdom";

// Setup JSDOM
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  customElements: dom.window.customElements,
  Node: dom.window.Node,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null
  },
  navigator: dom.window.navigator,
  location: dom.window.location
});

// Mock modules using the exact same strings used in the component imports
// This is a trick to mock relative imports in Bun tests
mock.module("../../utils/i18n", () => ({
  default: {
    t: (key: string) => key,
    language: "en",
    changeLanguage: () => Promise.resolve(),
    use: () => ({ init: () => {} })
  },
  i18next: {
    t: (key: string) => key,
    language: "en",
    changeLanguage: () => Promise.resolve()
  }
}));

mock.module("../../services/media-service", () => ({
  mediaService: {
    fetchMediaDetail: mock(() => Promise.resolve({ id: 1, title: "Test Media" })),
    fetchMediaSeasons: mock(() => Promise.resolve([{ id: 1, season_number: 1, episode_count: 10, name: "Season 1" }]))
  }
}));

mock.module("../../services/auth-store", () => ({
  authStore: {
    user: null,
    subscribe: mock((fn: any) => {
      return () => {};
    }),
    logout: mock(() => Promise.resolve())
  }
}));

mock.module("../../utils/events", () => ({
  eventBus: {
    on: mock((event: string, fn: any) => {
      return () => {};
    }),
    emit: mock(() => {})
  }
}));

mock.module("../../utils/dom", () => ({
  toggleTheme: mock(() => {})
}));

mock.module("lit-i18n", () => ({
  translate: (key: string) => key
}));

// Import the component after mocks are set up
import "../../web/components/layout/public-app";
import { PublicApp } from "../../web/components/layout/public-app";

describe("PublicApp", () => {
  let el: PublicApp;

  beforeEach(() => {
    document.body.innerHTML = "<public-app></public-app>";
    el = document.body.querySelector("public-app") as PublicApp;
  });

  test("should be defined", () => {
    expect(el).toBeDefined();
    console.log("Element tag name:", el.tagName);
    console.log("Is PublicApp:", el instanceof PublicApp);
    expect(el instanceof HTMLElement).toBe(true);
  });

  test("should render the header and logo", async () => {
    // Wait for Lit to render and shadow root to be created
    await new Promise(r => setTimeout(r, 100));
    await el.updateComplete;
    
    const root = el.shadowRoot || el.renderRoot;
    expect(root).toBeDefined();
    
    const logo = (root as HTMLElement).querySelector(".logo");
    expect(logo).toBeDefined();
    expect(logo?.textContent?.trim()).toBe("header.explorer");
  });

  test("should show auth modal when openAuth is called", async () => {
    await el.updateComplete;
    // Use private method for testing or trigger click
    const signInBtn = el.shadowRoot?.querySelector(".sign-in-btn") as HTMLElement;
    signInBtn?.click();
    await el.updateComplete;
    
    // Check if auth-modal is rendered
    const modal = el.shadowRoot?.querySelector("auth-modal");
    expect(modal).toBeDefined();
  });

  test("should load media data when selectedMediaId changes", async () => {
    const { mediaService } = await import("../../web/services/media-service");
    
    el.selectedMediaId = 123;
    await el.updateComplete;
    
    expect(mediaService.fetchMediaDetail).toHaveBeenCalledWith(123);
    expect(mediaService.fetchMediaSeasons).toHaveBeenCalledWith(123);
  });

  test("should handle language change", async () => {
    const { default: i18next } = await import("../../web/utils/i18n");
    const changeLangSpy = spyOn(i18next, "changeLanguage");
    
    const esBtn = el.shadowRoot?.querySelectorAll(".lang-btn")[1] as HTMLElement;
    esBtn?.click();
    
    expect(changeLangSpy).toHaveBeenCalledWith("es");
  });

  test("should navigate to home when logo is clicked", async () => {
    el.selectedMediaId = 123;
    await el.updateComplete;
    
    const logo = el.shadowRoot?.querySelector(".logo") as HTMLElement;
    logo?.click();
    await el.updateComplete;
    
    expect(el.selectedMediaId).toBeNull();
    expect(el.selectedSeasonId).toBeNull();
  });
});
