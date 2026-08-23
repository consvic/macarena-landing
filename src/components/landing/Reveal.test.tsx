import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "@/components/landing/Reveal";

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let observerCallback: ObserverCallback;
const observeMock = vi.fn();
const disconnectMock = vi.fn();

function stubIntersectionObserver() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: ObserverCallback) {
        observerCallback = callback;
      }
      observe = observeMock;
      disconnect = disconnectMock;
    },
  );
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches }));
}

describe("Reveal", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    observeMock.mockReset();
    disconnectMock.mockReset();
  });

  it("reveals content when the observer reports intersection, then disconnects", () => {
    stubMatchMedia(false);
    stubIntersectionObserver();

    render(<Reveal>contenido</Reveal>);
    const wrapper = screen.getByText("contenido").closest(".reveal");

    expect(wrapper).not.toBeNull();
    expect(observeMock).toHaveBeenCalledOnce();
    expect(wrapper).not.toHaveClass("is-revealed");

    observerCallback([{ isIntersecting: true }]);

    expect(wrapper).toHaveClass("is-revealed");
    expect(disconnectMock).toHaveBeenCalled();
  });

  it("does not reveal while the element stays out of view", () => {
    stubMatchMedia(false);
    stubIntersectionObserver();

    render(<Reveal>contenido</Reveal>);
    observerCallback([{ isIntersecting: false }]);

    expect(screen.getByText("contenido").closest(".reveal")).not.toHaveClass(
      "is-revealed",
    );
  });

  it("reveals immediately without observing when reduced motion is preferred", () => {
    stubMatchMedia(true);
    stubIntersectionObserver();

    render(<Reveal>contenido</Reveal>);

    expect(screen.getByText("contenido").closest(".reveal")).toHaveClass(
      "is-revealed",
    );
    expect(observeMock).not.toHaveBeenCalled();
  });

  it("disconnects the observer on unmount", () => {
    stubMatchMedia(false);
    stubIntersectionObserver();

    const { unmount } = render(<Reveal>contenido</Reveal>);
    unmount();

    expect(disconnectMock).toHaveBeenCalled();
  });
});
