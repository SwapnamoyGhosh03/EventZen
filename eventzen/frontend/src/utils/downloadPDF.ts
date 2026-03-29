import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures a DOM element and saves it as a PDF file.
 * Uses 2× scale for retina-quality output.
 */
export async function downloadElementAsPDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pxW = canvas.width / 2;
  const pxH = canvas.height / 2;

  const pdf = new jsPDF({
    orientation: pxW > pxH ? "landscape" : "portrait",
    unit: "px",
    format: [pxW, pxH],
    hotfixes: ["px_scaling"],
  });

  pdf.addImage(imgData, "PNG", 0, 0, pxW, pxH);
  pdf.save(filename);
}
