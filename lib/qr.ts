import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL (PNG) for the given payload.
 * Used for submission IDs so judges can scan to open the project.
 */
export async function generateQRDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    type: "image/png",
    margin: 2,
    width: 256,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
