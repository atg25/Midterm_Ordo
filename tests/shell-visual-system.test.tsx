import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/AppShell";
import { AccountMenu } from "@/components/AccountMenu";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ChatHeader } from "@/frameworks/ui/ChatHeader";
import type { User } from "@/core/entities/user";

let pathname = "/dashboard";

const pushMock = vi.fn();
const switchRoleMock = vi.fn();
const logoutMock = vi.fn();

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const matchMediaMock = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

const authenticatedUser: User = {
  id: "usr_1",
  email: "user@example.com",
  name: "Test User",
  roles: ["AUTHENTICATED"],
};

const anonymousUser: User = {
  id: "usr_anon",
  email: "anon@example.com",
  name: "Anonymous Visitor",
  roles: ["ANONYMOUS"],
};

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/useMockAuth", () => ({
  useMockAuth: () => ({
    switchRole: switchRoleMock,
    logout: logoutMock,
  }),
}));

beforeEach(() => {
  pathname = "/dashboard";
  pushMock.mockReset();
  switchRoleMock.mockReset();
  logoutMock.mockReset();
  localStorageMock.getItem.mockReset();
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  localStorageMock.clear.mockReset();
  vi.stubGlobal("localStorage", localStorageMock);
  vi.stubGlobal("matchMedia", matchMediaMock);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("shell visual system", () => {
  it("reuses shell brand sizing and truthful footer roles across shell surfaces", () => {
    const { container } = render(
      <ThemeProvider>
        <AppShell user={authenticatedUser}>
          <div>Shell Content</div>
        </AppShell>
      </ThemeProvider>,
    );

    expect(screen.queryByText("Global Status: Optimal")).toBeNull();

    const brandMarks = Array.from(
      container.querySelectorAll<HTMLElement>('[data-shell-brand-mark="true"]'),
    );

    expect(brandMarks).toHaveLength(2);
    for (const mark of brandMarks) {
      expect(mark.className).toContain("shell-brand-mark");
    }

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Library" }).className).toContain("shell-nav-label");
    expect(within(nav).getByRole("link", { name: /studio ordo home/i }).className).toContain("whitespace-nowrap");

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("Explore").className).toContain("shell-section-heading");
    expect(within(footer).getByText(/© 2026 Studio Ordo/i).className).toContain("shell-micro-text");
  });

  it("uses shared shell role primitives inside the real account menu", async () => {
    render(
      <ThemeProvider>
        <AccountMenu user={authenticatedUser} />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /test user/i }));

    const legibilityToggle = await screen.findByRole("button", { name: "System Legibility" });
    expect(screen.getByRole("button", { name: /test user/i }).className).toContain("shell-account-trigger");
    expect(legibilityToggle.className).toContain("shell-account-label");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "Dashboard" }).className).toContain("shell-account-label");
    expect(screen.getByRole("link", { name: "Profile" }).className).toContain("shell-account-label");
    expect(screen.queryByRole("link", { name: "Profile Settings" })).toBeNull();

    fireEvent.click(legibilityToggle);

    expect(screen.getByText("Type Scale").className).toContain("shell-micro-text");
    expect(screen.getByRole("button", { name: "Sign Out" }).className).toContain("shell-section-heading");
  });

  it("applies shared shell heading and meta roles in the real chat header", () => {
    render(
      <ChatHeader
        title="PD Advisor"
        subtitle="Intelligent Orchestrator"
        isFloating={false}
        onFullScreenToggle={() => undefined}
        isFullScreen={false}
        searchQuery=""
        onSearchChange={() => undefined}
        density="normal"
        onDensityChange={() => undefined}
        gridEnabled={false}
        onGridToggle={() => undefined}
      />,
    );

    expect(screen.getByRole("heading", { name: "PD Advisor" }).className).toContain("shell-panel-heading");
    expect(screen.getByText("Intelligent Orchestrator").className).toContain("shell-meta-text");
    expect(screen.getByRole("button", { name: "Set density to compact" }).className).toContain("shell-micro-text");
  });

  it("keeps unauthenticated account links on shared shell nav label styling", () => {
    render(
      <ThemeProvider>
        <AccountMenu user={anonymousUser} />
      </ThemeProvider>,
    );

    expect(screen.getByRole("link", { name: "Sign In" }).className).toContain("shell-account-trigger");
    expect(screen.getByRole("link", { name: "Sign In" }).className).toContain("shell-account-label");
    expect(screen.getByRole("link", { name: "Register" }).className).toContain("shell-account-trigger");
    expect(screen.getByRole("link", { name: "Register" }).className).toContain("shell-account-label");
  });

  it("applies shared shell meta roles in the floating chat header variant", () => {
    render(
      <ChatHeader
        title="PD Advisor"
        subtitle="Intelligent Orchestrator"
        isFloating
        onMinimize={() => undefined}
        onFullScreenToggle={() => undefined}
        isFullScreen={false}
        searchQuery=""
        onSearchChange={() => undefined}
        density="normal"
        onDensityChange={() => undefined}
        gridEnabled={false}
        onGridToggle={() => undefined}
      />,
    );

    expect(screen.getByText("Intelligent Orchestrator").className).toContain("shell-meta-text");
    expect(screen.getByRole("button", { name: "Enter Full Screen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minimize Chat" })).toBeInTheDocument();
  });
});