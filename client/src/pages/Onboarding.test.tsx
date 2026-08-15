import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(async () => ({})),
  acceptPrivacy: vi.fn(async () => ({})),
  acceptTerms: vi.fn(async () => ({})),
  completeOnboarding: vi.fn(async () => ({})),
  setLocation: vi.fn(),
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  profile: {
    displayName: null,
    bio: null,
    unitSystem: "feet",
    theme: "dark",
    notificationsEnabled: 1,
    analyticsEnabled: 0,
    crashReportingEnabled: 0,
    onboardingCompleted: 0,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    onboarding: {
      getProfile: {
        useQuery: () => ({ data: mocks.profile }),
      },
      updateProfile: { useMutation: () => ({ mutateAsync: mocks.updateProfile }) },
      acceptPrivacyPolicy: { useMutation: () => ({ mutateAsync: mocks.acceptPrivacy }) },
      acceptTermsOfService: { useMutation: () => ({ mutateAsync: mocks.acceptTerms }) },
      completeOnboarding: { useMutation: () => ({ mutateAsync: mocks.completeOnboarding }) },
    },
  },
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { email: "planner@example.test" } }) }));
vi.mock("@/lib/notifications", () => ({ notifySuccess: mocks.notifySuccess, notifyError: mocks.notifyError }));
vi.mock("wouter", () => ({ useLocation: () => ["/onboarding", mocks.setLocation] }));

import Onboarding from "./Onboarding";

function click(root: ReactTestInstance, label: string) {
  const button = root.findAllByType("button").find(node => node.props.children === label);
  if (!button) throw new Error(`Button not found: ${label}`);
  button.props.onClick();
}

describe("Onboarding screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("moves through all five steps and persists profile, preferences, policy acceptance, and completion", async () => {
    let renderer!: ReturnType<typeof create>;
    await act(async () => { renderer = create(<Onboarding />); await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(renderer.root.findByType("h1").props.children).toBe("Welcome to Space Planner Studio");

    await act(async () => { click(renderer.root, "NEXT"); });
    expect(renderer.root.findByType("h2").props.children).toBe("Create Your Profile");
    const profileInputs = renderer.root.findAllByType("input");
    const profileBio = renderer.root.findByType("textarea");
    await act(async () => {
      profileInputs[0].props.onChange({ target: { value: "Taylor Planner" } });
      profileBio.props.onChange({ target: { value: "Commercial planning" } });
    });
    await act(async () => { click(renderer.root, "NEXT"); });
    expect(mocks.updateProfile).toHaveBeenNthCalledWith(1, { displayName: "Taylor Planner", bio: "Commercial planning" });

    expect(renderer.root.findByType("h2").props.children).toBe("Preferences");
    const selects = renderer.root.findAllByType("select");
    const preferenceCheckboxes = renderer.root.findAllByType("input").filter(node => node.props.type === "checkbox");
    await act(async () => {
      selects[0].props.onChange({ target: { value: "meters" } });
      selects[1].props.onChange({ target: { value: "auto" } });
      preferenceCheckboxes[0].props.onChange({ target: { checked: false } });
      preferenceCheckboxes[1].props.onChange({ target: { checked: true } });
      preferenceCheckboxes[2].props.onChange({ target: { checked: true } });
    });
    await act(async () => { click(renderer.root, "NEXT"); });
    expect(mocks.updateProfile).toHaveBeenNthCalledWith(2, {
      unitSystem: "meters",
      theme: "auto",
      notificationsEnabled: false,
      analyticsEnabled: true,
      crashReportingEnabled: true,
    });

    expect(renderer.root.findByType("h2").props.children).toBe("Privacy & Terms");
    const policyCheckboxes = renderer.root.findAllByType("input").filter(node => node.props.type === "checkbox");
    await act(async () => {
      policyCheckboxes[0].props.onChange({ target: { checked: true } });
      policyCheckboxes[1].props.onChange({ target: { checked: true } });
    });
    await act(async () => { click(renderer.root, "NEXT"); });
    expect(mocks.acceptPrivacy).toHaveBeenCalledOnce();
    expect(mocks.acceptTerms).toHaveBeenCalledOnce();
    expect(renderer.root.findByType("h2").props.children).toBe("All Set!");

    await act(async () => { click(renderer.root, "GET STARTED"); });
    expect(mocks.completeOnboarding).toHaveBeenCalledOnce();
    expect(mocks.notifySuccess).toHaveBeenCalledWith("Welcome to Space Planner Studio!");
    expect(mocks.setLocation).toHaveBeenCalledWith("/");
  });
});
