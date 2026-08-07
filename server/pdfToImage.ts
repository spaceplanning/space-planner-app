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
      console.error("[convertPdfToImage] PDF input size:", pdfBuffer.length, "bytes");

      // Convert first page to PNG with optimal DPI for floor plans
      const pngPath = path.join(tmpDir, "output.png");
      try {
        // Use 200 DPI for better clarity of floor plan details (dimensions, room labels)
        execSync(`pdftoppm -png -singlefile -f 1 -l 1 -r 200 "${pdfPath}" "${path.join(tmpDir, "output")}"`, {
          timeout: 30000,
        });
      } catch (e) {
        throw new Error(`PDF conversion failed: ${(e as Error).message}`);
      }

      // Read PNG file
      if (!fs.existsSync(pngPath)) {
        throw new Error("PDF conversion produced no output");
      }

      let imageBuffer = fs.readFileSync(pngPath);
      console.error("[convertPdfToImage] PNG size after conversion:", imageBuffer.length, "bytes");

      // Compress if too large - convert to JPEG with higher quality for floor plans
      if (imageBuffer.length > 2 * 1024 * 1024) {
        const jpgPath = path.join(tmpDir, "output.jpg");
        try {
          // Use higher quality (85) to preserve floor plan details
          execSync(`convert "${pngPath}" -resize 2000x2000 -strip -quality 85 "${jpgPath}"`, {
            timeout: 30000,
          });
          if (fs.existsSync(jpgPath)) {
            imageBuffer = fs.readFileSync(jpgPath);
            console.error("[convertPdfToImage] Compressed to JPEG:", imageBuffer.length, "bytes");
          }
        } catch (e) {
          console.error("[convertPdfToImage] JPEG compression skipped:", (e as Error).message);
        }
      }

      const imageBase64 = imageBuffer.toString("base64");
      console.error("[convertPdfToImage] Final base64 length:", imageBase64.length, "chars");

      return imageBase64;
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
