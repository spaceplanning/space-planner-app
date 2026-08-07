import sgMail from "@sendgrid/mail";
import { generateMeasurementsPdf } from "./measurementsPdf";
import { generateMeasurementsReport } from "./measurements";

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  pdfBuffer?: Buffer;
  pdfFileName?: string;
}

/**
 * Send email with optional PDF attachment
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn("[Email] SendGrid API key not configured. Email not sent.");
      return false;
    }

    const msg: any = {
      to: options.to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@spaceplanner.studio",
      subject: options.subject,
      html: options.html,
    };

    // Add PDF attachment if provided
    if (options.pdfBuffer && options.pdfFileName) {
      msg.attachments = [
        {
          content: options.pdfBuffer.toString("base64"),
          filename: options.pdfFileName,
          type: "application/pdf",
          disposition: "attachment",
        },
      ];
    }

    await sgMail.send(msg);
    console.log(`[Email] Successfully sent email to ${options.to}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/**
 * Send floor plan PDF via email
 */
export async function sendFloorPlanEmail(
  recipientEmail: string,
  planName: string,
  rooms: any[],
  senderName?: string
): Promise<boolean> {
  try {
    // Generate measurements report
    const measurements = generateMeasurementsReport(planName, rooms);
    
    // Generate PDF
    const pdfBuffer = generateMeasurementsPdf(measurements);

    // Create email HTML
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22d3ee;">Floor Plan: ${planName}</h2>
        <p>Hello,</p>
        <p>${senderName || "A user"} has shared a floor plan with you.</p>
        <p>Please find the floor plan PDF attached to this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          This email was sent from Space Planner Studio.
        </p>
      </div>
    `;

    return await sendEmail({
      to: recipientEmail,
      subject: `Floor Plan: ${planName}`,
      html,
      pdfBuffer,
      pdfFileName: `${planName}.pdf`,
    });
  } catch (error) {
    console.error("[Email] Failed to send floor plan email:", error);
    return false;
  }
}
