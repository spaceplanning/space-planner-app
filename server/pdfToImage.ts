// SPACE PLANNER STUDIO — PDF to Image Converter
// Converts PDF files to PNG images for LLM processing
// ============================================================

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Convert PDF base64 to PNG base64 for LLM processing
 * @param pdfBase64 - Base64 encoded PDF
 * @returns Base64 encoded PNG image
 */
export async function convertPdfToImage(pdfBase64: string): Promise<string> {
  try {
    // Create temporary directory
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-convert-"));

    try {
      // Write PDF to temporary file
      const pdfPath = path.join(tmpDir, "input.pdf");
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Convert first page to PNG
      const pngPath = path.join(tmpDir, "output.png");
      try {
        execSync(`pdftoppm -png -singlefile -f 1 -l 1 "${pdfPath}" "${path.join(tmpDir, "output")}"`, {
          timeout: 30000,
        });
      } catch (e) {
        throw new Error(`PDF conversion failed: ${(e as Error).message}`);
      }

      // Read PNG file
      if (!fs.existsSync(pngPath)) {
        throw new Error("PDF conversion produced no output");
      }

      const pngBuffer = fs.readFileSync(pngPath);
      const pngBase64 = pngBuffer.toString("base64");

      return pngBase64;
    } finally {
      // Clean up temporary files
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Failed to clean up temp directory:", e);
      }
    }
  } catch (error) {
    throw new Error(`PDF to image conversion failed: ${(error as Error).message}`);
  }
}
