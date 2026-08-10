import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { useLocation } from "wouter";

type OnboardingStep = "welcome" | "profile" | "preferences" | "privacy" | "complete";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [unitSystem, setUnitSystem] = useState<"feet" | "meters">("feet");
  const [theme, setTheme] = useState<"dark" | "light" | "auto">("dark");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReportingEnabled, setCrashReportingEnabled] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get profile
  const { data: profile } = trpc.onboarding.getProfile.useQuery();

  // Mutations
  const updateProfileMutation = trpc.onboarding.updateProfile.useMutation();
  const acceptPrivacyMutation = trpc.onboarding.acceptPrivacyPolicy.useMutation();
  const acceptTermsMutation = trpc.onboarding.acceptTermsOfService.useMutation();
  const completeOnboardingMutation = trpc.onboarding.completeOnboarding.useMutation();

  // Initialize from profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setEmail(user?.email || "");
      setBio(profile.bio || "");
      setUnitSystem(profile.unitSystem as "feet" | "meters");
      setTheme(profile.theme as "dark" | "light" | "auto");
      setNotificationsEnabled(profile.notificationsEnabled === 1);
      setAnalyticsEnabled(profile.analyticsEnabled === 1);
      setCrashReportingEnabled(profile.crashReportingEnabled === 1);

      // Skip to complete if already onboarded
      if (profile.onboardingCompleted === 1) {
        setLocation("/");
      }
    }
  }, [profile, setLocation]);

  const handleNext = async () => {
    try {
      setIsLoading(true);

      if (currentStep === "welcome") {
        setCurrentStep("profile");
      } else if (currentStep === "profile") {
        // Save profile
        await updateProfileMutation.mutateAsync({
          displayName: displayName || undefined,
          bio: bio || undefined,
        });
        setCurrentStep("preferences");
      } else if (currentStep === "preferences") {
        // Save preferences
        await updateProfileMutation.mutateAsync({
          unitSystem,
          theme,
          notificationsEnabled,
          analyticsEnabled,
          crashReportingEnabled,
        });
        setCurrentStep("privacy");
      } else if (currentStep === "privacy") {
        // Accept policies
        if (privacyAccepted) {
          await acceptPrivacyMutation.mutateAsync();
        }
        if (termsAccepted) {
          await acceptTermsMutation.mutateAsync();
        }
        setCurrentStep("complete");
      } else if (currentStep === "complete") {
        // Complete onboarding
        await completeOnboardingMutation.mutateAsync();
        notifySuccess("Welcome to Space Planner Studio!");
        setLocation("/");
      }
    } catch (error) {
      notifyError((error as Error).message || "Onboarding failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "profile") setCurrentStep("welcome");
    else if (currentStep === "preferences") setCurrentStep("profile");
    else if (currentStep === "privacy") setCurrentStep("preferences");
    else if (currentStep === "complete") setCurrentStep("privacy");
  };

  const canProceed = () => {
    if (currentStep === "privacy") {
      return privacyAccepted && termsAccepted;
    }
    return true;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bp-bg-primary)",
        color: "var(--bp-text-primary)",
        fontFamily: "'Space Mono', monospace",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
          background: "var(--bp-panel)",
          border: "1px solid var(--bp-grid-major)",
          borderRadius: "8px",
          padding: "40px",
        }}
      >
        {/* Welcome Step */}
        {currentStep === "welcome" && (
          <div>
            <h1 style={{ fontSize: "28px", marginBottom: "16px", color: "var(--bp-cyan)" }}>
              Welcome to Space Planner Studio
            </h1>
            <p style={{ fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
              Create professional floor plans and space layouts with our intuitive design tool. Let's get you started!
            </p>
            <div style={{ fontSize: "12px", color: "var(--bp-text-muted)", lineHeight: "1.8" }}>
              <p>✓ Upload and analyze floor plans</p>
              <p>✓ Design custom room layouts</p>
              <p>✓ Place furniture and fixtures</p>
              <p>✓ Share plans with others</p>
              <p>✓ Export measurements and reports</p>
            </div>
          </div>
        )}

        {/* Profile Step */}
        {currentStep === "profile" && (
          <div>
            <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "var(--bp-cyan)" }}>
              Create Your Profile
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "8px" }}>
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--bp-bg-primary)",
                  border: "1px solid var(--bp-grid-major)",
                  borderRadius: "4px",
                  color: "var(--bp-text-primary)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "8px" }}>
                Email (Read-only)
              </label>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--bp-bg-primary)",
                  border: "1px solid var(--bp-grid-major)",
                  borderRadius: "4px",
                  color: "var(--bp-text-muted)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  opacity: 0.6,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "8px" }}>
                Bio (Optional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--bp-bg-primary)",
                  border: "1px solid var(--bp-grid-major)",
                  borderRadius: "4px",
                  color: "var(--bp-text-primary)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  minHeight: "80px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}

        {/* Preferences Step */}
        {currentStep === "preferences" && (
          <div>
            <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "var(--bp-cyan)" }}>
              Preferences
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "8px" }}>
                Unit System
              </label>
              <select
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value as "feet" | "meters")}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--bp-bg-primary)",
                  border: "1px solid var(--bp-grid-major)",
                  borderRadius: "4px",
                  color: "var(--bp-text-primary)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              >
                <option value="feet">Feet & Inches</option>
                <option value="meters">Meters & Centimeters</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "8px" }}>
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as "dark" | "light" | "auto")}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--bp-bg-primary)",
                  border: "1px solid var(--bp-grid-major)",
                  borderRadius: "4px",
                  color: "var(--bp-text-primary)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", fontSize: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                Enable Notifications (for important updates)
              </label>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", fontSize: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                Enable Analytics (helps us improve the app)
              </label>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", fontSize: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={crashReportingEnabled}
                  onChange={(e) => setCrashReportingEnabled(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                Enable Crash Reporting (helps us fix bugs)
              </label>
            </div>
          </div>
        )}

        {/* Privacy Step */}
        {currentStep === "privacy" && (
          <div>
            <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "var(--bp-cyan)" }}>
              Privacy & Terms
            </h2>

            <div
              style={{
                background: "var(--bp-bg-primary)",
                border: "1px solid var(--bp-grid-major)",
                borderRadius: "4px",
                padding: "12px",
                marginBottom: "16px",
                maxHeight: "200px",
                overflowY: "auto",
                fontSize: "11px",
                lineHeight: "1.6",
              }}
            >
              <p>
                <strong>Privacy Policy:</strong> We collect minimal data needed to provide the service. Your floor plans
                are stored securely and never shared without your permission.
              </p>
              <p>
                <strong>Terms of Service:</strong> By using Space Planner Studio, you agree to our terms. You own all
                content you create.
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", fontSize: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                I accept the Privacy Policy
              </label>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", fontSize: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                I accept the Terms of Service
              </label>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "16px", color: "var(--bp-cyan)" }}>
              All Set!
            </h2>
            <p style={{ fontSize: "14px", marginBottom: "24px" }}>
              Your profile is ready. Let's start creating amazing floor plans!
            </p>
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>✓</div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "32px",
            justifyContent: "space-between",
          }}
        >
          {currentStep !== "welcome" && (
            <button
              onClick={handleBack}
              disabled={isLoading}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "1px solid var(--bp-grid-major)",
                borderRadius: "4px",
                color: "var(--bp-text-secondary)",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              BACK
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleNext}
            disabled={isLoading || !canProceed()}
            style={{
              padding: "10px 20px",
              background: canProceed() ? "var(--bp-cyan)" : "var(--bp-grid-major)",
              border: "none",
              borderRadius: "4px",
              color: "var(--bp-bg-primary)",
              cursor: isLoading || !canProceed() ? "not-allowed" : "pointer",
              fontFamily: "'Space Mono', monospace",
              fontSize: "10px",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {currentStep === "complete" ? "GET STARTED" : "NEXT"}
          </button>
        </div>

        {/* Progress Indicator */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            marginTop: "24px",
            fontSize: "10px",
          }}
        >
          {["welcome", "profile", "preferences", "privacy", "complete"].map((step) => (
            <div
              key={step}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  step === currentStep
                    ? "var(--bp-cyan)"
                    : ["welcome", "profile", "preferences", "privacy", "complete"].indexOf(step) <
                      ["welcome", "profile", "preferences", "privacy", "complete"].indexOf(currentStep)
                    ? "var(--bp-grid-major)"
                    : "var(--bp-bg-primary)",
                border: "1px solid var(--bp-grid-major)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
