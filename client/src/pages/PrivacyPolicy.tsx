import React from "react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>

        <div style={{ fontSize: "12px", lineHeight: "1.8", color: "var(--bp-text-primary)" }}>
          <p style={{ marginBottom: "16px", color: "var(--bp-text-muted)", fontSize: "11px" }}>
            Last Updated: August 9, 2026
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            1. Introduction
          </h2>
          <p style={{ marginBottom: "16px" }}>
            Space Planner Studio ("we", "us", "our", or "Company") operates the Space Planner Studio application
            ("Service"). This page informs you of our policies regarding the collection, use, and disclosure of
            personal data when you use our Service and the choices you have associated with that data.
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            2. Information Collection and Use
          </h2>
          <p style={{ marginBottom: "16px" }}>
            We collect several different types of information for various purposes to provide and improve our Service
            to you.
          </p>

          <h3 style={{ fontSize: "13px", marginTop: "16px", marginBottom: "8px" }}>
            Types of Data Collected:
          </h3>
          <ul style={{ marginLeft: "20px", marginBottom: "16px" }}>
            <li>Personal Data: Name, email address, usage preferences</li>
            <li>Usage Data: Browser type, IP address, pages visited, time spent on pages</li>
            <li>Content Data: Floor plans, room layouts, and furniture arrangements you create</li>
            <li>Device Data: Device type, operating system, unique device identifiers</li>
          </ul>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            3. Use of Data
          </h2>
          <p style={{ marginBottom: "16px" }}>
            Space Planner Studio uses the collected data for various purposes:
          </p>
          <ul style={{ marginLeft: "20px", marginBottom: "16px" }}>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our Service</li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            4. Security of Data
          </h2>
          <p style={{ marginBottom: "16px" }}>
            The security of your data is important to us but remember that no method of transmission over the Internet
            or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to
            protect your Personal Data, we cannot guarantee its absolute security.
          </p>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            5. Your Rights
          </h2>
          <p style={{ marginBottom: "16px" }}>
            You have the right to:
          </p>
          <ul style={{ marginLeft: "20px", marginBottom: "16px" }}>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent at any time</li>
          </ul>

          <h2 style={{ fontSize: "16px", marginTop: "24px", marginBottom: "12px", color: "var(--bp-cyan)" }}>
            6. Contact Us
          </h2>
          <p style={{ marginBottom: "16px" }}>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p style={{ marginBottom: "16px" }}>
            Email: privacy@spaceplanner.studio
          </p>
        </div>
      </div>
    </div>
  );
}
