import React from "react";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, setLocation] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bp-bg-primary)",
        color: "var(--bp-text-primary)",
        fontFamily: "'Space Mono', monospace",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "var(--bp-panel)",
          border: "1px solid var(--bp-grid-major)",
          borderRadius: "8px",
          padding: "40px",
        }}
      >
        <button
          onClick={() => setLocation("/")}
          style={{
            marginBottom: "24px",
            padding: "8px 16px",
            background: "transparent",
            border: "1px solid var(--bp-grid-major)",
            borderRadius: "4px",
            color: "var(--bp-text-secondary)",
            cursor: "pointer",
            fontFamily: "'Space Mono', monospace",
            fontSize: "10px",
          }}
        >
          ← BACK
        </button>

        <h1 style={{ fontSize: "28px", marginBottom: "24px", color: "var(--bp-cyan)" }}>
          Terms of Service
        </h1>

        <div style={{ fontSize: "12px", lineHeight: "1.8", color: "var(--bp-text-primary)" }}>
          <p style={{ marginBottom: "16px", color: "var(--bp-text-muted)", fontSize: "11px" }}>
            Last Updated: August 9, 2026
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ marginBottom: "16px" }}>
            By accessing and using Space Planner Studio, you accept and agree to be bound by the terms and provision
            of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            2. Use License
          </h2>
          <p style={{ marginBottom: "16px" }}>
            Permission is granted to temporarily download one copy of the materials (information or software) on Space
            Planner Studio for personal, non-commercial transitory viewing only. This is the grant of a license, not a
            transfer of title, and under this license you may not:
          </p>
          <ul style={{ marginLeft: "20px", marginBottom: "16px" }}>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            3. Disclaimer
          </h2>
          <p style={{ marginBottom: "16px" }}>
            The materials on Space Planner Studio are provided on an 'as is' basis. Space Planner Studio makes no
            warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without
            limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or
            non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            4. Limitations
          </h2>
          <p style={{ marginBottom: "16px" }}>
            In no event shall Space Planner Studio or its suppliers be liable for any damages (including, without
            limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or
            inability to use the materials on Space Planner Studio.
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            5. Accuracy of Materials
          </h2>
          <p style={{ marginBottom: "16px" }}>
            The materials appearing on Space Planner Studio could include technical, typographical, or photographic
            errors. Space Planner Studio does not warrant that any of the materials on the Service are accurate,
            complete, or current.
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            6. Links
          </h2>
          <p style={{ marginBottom: "16px" }}>
            Space Planner Studio has not reviewed all of the sites linked to its website and is not responsible for
            the contents of any such linked site. The inclusion of any link does not imply endorsement by Space Planner
            Studio of the site. Use of any such linked website is at the user's own risk.
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            7. Modifications
          </h2>
          <p style={{ marginBottom: "16px" }}>
            Space Planner Studio may revise these terms of service for the Service at any time without notice. By using
            this Service, you are agreeing to be bound by the then current version of these terms of service.
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            8. Governing Law
          </h2>
          <p style={{ marginBottom: "16px" }}>
            These terms and conditions are governed by and construed in accordance with the laws of the United States,
            and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            9. Contact Us
          </h2>
          <p style={{ marginBottom: "16px" }}>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p style={{ marginBottom: "16px" }}>
            Email: legal@spaceplanner.studio
          </p>
        </div>
      </div>
    </div>
  );
}
