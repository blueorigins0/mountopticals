import { jsPDF } from "jspdf";

interface InvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variation?: string;
  hsn?: string;
}

interface InvoiceData {
  invoice_number: string;
  order_number: string;
  date: string;
  buyer_name: string;
  buyer_email?: string;
  buyer_phone?: string;
  company_name?: string;
  gst_number?: string;
  shipping_address?: {
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  billing_address?: {
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  gst_percentage?: number;
  shipping: number;
  total: number;
}

function formatINR(amount: number): string {
  return `Rs.${amount.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

function drawBorderedRect(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h, "S");
}

export function generateGSTInvoice(data: InvoiceData): jsPDF {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const m = 12;
  const contentW = pw - 2 * m;
  let y = 0;

  const isGST = !!data.gst_number;
  const gstRate = data.gst_percentage || 18;

  // ─── OUTER BORDER ───
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(m - 2, 8, contentW + 4, doc.internal.pageSize.getHeight() - 16, "S");

  // ─── HEADER ───
  y = 14;
  // Company logo/name on left
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("VendorHub", m + 2, y + 6);

  // Invoice title on right
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Tax Invoice/Bill of Supply/Cash Memo", pw - m - 2, y, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("(Original for Recipient)", pw - m - 2, y + 5, { align: "right" });

  // Horizontal line
  y = 28;
  doc.setLineWidth(0.3);
  doc.line(m - 2, y, pw - m + 2, y);

  // ─── SOLD BY / BILLING ADDRESS ───
  y = 33;
  const halfW = contentW / 2;

  // Sold By (left)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Sold By:", m + 2, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("VendorHub Private Limited", m + 2, y); y += 3.5;
  doc.text("123 Business Street,", m + 2, y); y += 3.5;
  doc.text("New Delhi, India - 110001", m + 2, y); y += 3.5;
  doc.text("IN", m + 2, y);

  // Billing Address (right)
  let ry = 33;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Billing Address:", pw - m - 2, ry, { align: "right" });
  ry += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(data.buyer_name, pw - m - 2, ry, { align: "right" }); ry += 3.5;
  if (data.company_name) { doc.text(data.company_name, pw - m - 2, ry, { align: "right" }); ry += 3.5; }
  const billing = data.billing_address || data.shipping_address;
  if (billing) {
    if (billing.address) { doc.text(billing.address, pw - m - 2, ry, { align: "right" }); ry += 3.5; }
    const cityLine = [billing.city, billing.state, billing.postal_code].filter(Boolean).join(", ");
    if (cityLine) { doc.text(cityLine, pw - m - 2, ry, { align: "right" }); ry += 3.5; }
    if (billing.country) { doc.text(billing.country || "IN", pw - m - 2, ry, { align: "right" }); }
  }

  y = Math.max(y, ry) + 6;

  // ─── PAN / GST + SHIPPING ADDRESS ───
  doc.setLineWidth(0.2);
  doc.line(m - 2, y, pw - m + 2, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PAN No: AXXXX1234X", m + 2, y);
  y += 4;
  if (data.gst_number) {
    doc.text(`GST Registration No: ${data.gst_number}`, m + 2, y);
  } else {
    doc.text("GST Registration No: 07AXXXX1234X1Z5", m + 2, y);
  }

  // Shipping Address (right side)
  let sy = y - 4;
  doc.setFont("helvetica", "bold");
  doc.text("Shipping Address:", pw - m - 2, sy, { align: "right" });
  sy += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(data.buyer_name, pw - m - 2, sy, { align: "right" }); sy += 3.5;
  if (data.shipping_address) {
    const addr = data.shipping_address;
    if (addr.address) { doc.text(addr.address, pw - m - 2, sy, { align: "right" }); sy += 3.5; }
    const cityLine2 = [addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ");
    if (cityLine2) { doc.text(cityLine2, pw - m - 2, sy, { align: "right" }); sy += 3.5; }
    if (addr.country) { doc.text(addr.country || "IN", pw - m - 2, sy, { align: "right" }); }
  }

  y = Math.max(y, sy) + 6;
  doc.line(m - 2, y, pw - m + 2, y);
  y += 4;

  // ─── ORDER / INVOICE DETAILS ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`Order Number: ${data.order_number}`, m + 2, y);
  doc.text(`Invoice Number: ${data.invoice_number}`, pw - m - 2, y, { align: "right" });
  y += 4;
  doc.text(`Order Date: ${data.date}`, m + 2, y);
  doc.text(`Invoice Date: ${data.date}`, pw - m - 2, y, { align: "right" });

  y += 6;
  doc.line(m - 2, y, pw - m + 2, y);

  // ─── ITEMS TABLE ───
  y += 1;
  const tableX = m - 2;
  const tableW = contentW + 4;

  // Column definitions for Amazon-style
  const colWidths = isGST
    ? [10, 55, 22, 10, 22, 18, 14, 12, 18, 22]
    // Sl, Description, Unit Price, Qty, Net Amount, Discount, Tax Rate, Tax Type, Tax Amount, Total
    : [10, 80, 22, 10, 22, 22, 22];

  const headers = isGST
    ? ["Sl.\nNo", "Description", "Unit\nPrice", "Qty", "Net\nAmount", "Discount", "Tax\nRate", "Tax\nType", "Tax\nAmount", "Total\nAmount"]
    : ["Sl.\nNo", "Description", "Unit Price", "Qty", "Net Amount", "Tax", "Total Amount"];

  // Table header row
  const headerH = 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(tableX, y, tableW, headerH, "F");
  drawBorderedRect(doc, tableX, y, tableW, headerH);

  // Draw header cells
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);

  let cx = tableX;
  const actualColWidths = isGST
    ? [12, 52, 20, 12, 20, 18, 14, 14, 18, 22]
    : [12, 78, 25, 15, 25, 25, 22];

  // Adjust widths to fit tableW
  const totalColW = actualColWidths.reduce((a, b) => a + b, 0);
  const scale = tableW / totalColW;
  const scaledWidths = actualColWidths.map(w => w * scale);

  for (let i = 0; i < headers.length; i++) {
    doc.line(cx, y, cx, y + headerH);
    const lines = headers[i].split("\n");
    if (lines.length > 1) {
      doc.text(lines[0], cx + scaledWidths[i] / 2, y + 4, { align: "center" });
      doc.text(lines[1], cx + scaledWidths[i] / 2, y + 7.5, { align: "center" });
    } else {
      doc.text(headers[i], cx + scaledWidths[i] / 2, y + 6, { align: "center" });
    }
    cx += scaledWidths[i];
  }
  doc.line(cx, y, cx, y + headerH);

  y += headerH;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  data.items.forEach((item, idx) => {
    if (y > 245) { doc.addPage(); y = 20; }

    const rowH = item.variation ? 14 : 10;
    drawBorderedRect(doc, tableX, y, tableW, rowH);

    cx = tableX;
    const slNo = String(idx + 1);
    const discount = 0;
    const taxAmt = isGST ? item.total_price * (gstRate / 100) : (data.tax / data.items.length);
    const totalWithTax = item.total_price + (isGST ? taxAmt : 0);

    if (isGST) {
      const values = [
        slNo,
        "", // description handled separately
        formatINR(item.unit_price),
        String(item.quantity),
        formatINR(item.total_price),
        formatINR(discount),
        `${gstRate}%`,
        "IGST",
        formatINR(taxAmt),
        formatINR(totalWithTax),
      ];

      for (let i = 0; i < values.length; i++) {
        doc.line(cx, y, cx, y + rowH);
        if (i === 1) {
          // Description - left aligned with padding
          const descText = item.name;
          const maxDescW = scaledWidths[1] - 4;
          const splitDesc = doc.splitTextToSize(descText, maxDescW);
          doc.setFont("helvetica", "normal");
          doc.text(splitDesc[0], cx + 2, y + 5);
          if (item.hsn) {
            doc.setFontSize(6);
            doc.text(`HSN:${item.hsn}`, cx + 2, y + 8.5);
            doc.setFontSize(7);
          }
          if (item.variation) {
            doc.setFontSize(6);
            doc.text(`Variant: ${item.variation}`, cx + 2, y + 11.5);
            doc.setFontSize(7);
          }
        } else {
          doc.text(values[i], cx + scaledWidths[i] / 2, y + 5, { align: "center" });
        }
        cx += scaledWidths[i];
      }
      doc.line(cx, y, cx, y + rowH);
    } else {
      const values = [
        slNo,
        "",
        formatINR(item.unit_price),
        String(item.quantity),
        formatINR(item.total_price),
        formatINR(data.tax / data.items.length),
        formatINR(item.total_price + (data.tax / data.items.length)),
      ];

      for (let i = 0; i < values.length; i++) {
        doc.line(cx, y, cx, y + rowH);
        if (i === 1) {
          const maxDescW = scaledWidths[1] - 4;
          const splitDesc = doc.splitTextToSize(item.name, maxDescW);
          doc.text(splitDesc[0], cx + 2, y + 5);
          if (item.variation) {
            doc.setFontSize(6);
            doc.text(`Variant: ${item.variation}`, cx + 2, y + 8.5);
            doc.setFontSize(7);
          }
        } else {
          doc.text(values[i], cx + scaledWidths[i] / 2, y + 5, { align: "center" });
        }
        cx += scaledWidths[i];
      }
      doc.line(cx, y, cx, y + rowH);
    }

    y += rowH;
  });

  // Shipping row
  const shippingRowH = 10;
  drawBorderedRect(doc, tableX, y, tableW, shippingRowH);
  cx = tableX;
  for (let i = 0; i < scaledWidths.length; i++) {
    doc.line(cx, y, cx, y + shippingRowH);
    if (i === 1) {
      doc.setFont("helvetica", "normal");
      doc.text("Shipping Charges", cx + 2, y + 5);
    }
    if (isGST) {
      if (i === 2) doc.text(formatINR(data.shipping), cx + scaledWidths[i] / 2, y + 5, { align: "center" });
      if (i === 4) doc.text(formatINR(0), cx + scaledWidths[i] / 2, y + 5, { align: "center" });
      if (i === 5) doc.text(formatINR(0), cx + scaledWidths[i] / 2, y + 5, { align: "center" });
      if (i === 6) doc.text(`${gstRate}%`, cx + scaledWidths[i] / 2, y + 5, { align: "center" });
      if (i === 7) doc.text("IGST", cx + scaledWidths[i] / 2, y + 5, { align: "center" });
      if (i === 8) doc.text(formatINR(0), cx + scaledWidths[i] / 2, y + 5, { align: "center" });
      if (i === 9) doc.text(formatINR(0), cx + scaledWidths[i] / 2, y + 5, { align: "center" });
    } else {
      if (i === 2) doc.text(formatINR(data.shipping), cx + scaledWidths[i] / 2, y + 5, { align: "center" });
      if (i === 6) doc.text(formatINR(data.shipping), cx + scaledWidths[i] / 2, y + 5, { align: "center" });
    }
    cx += scaledWidths[i];
  }
  doc.line(cx, y, cx, y + shippingRowH);
  y += shippingRowH;

  // ─── TOTAL ROW ───
  const totalRowH = 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(tableX, y, tableW, totalRowH, "F");
  drawBorderedRect(doc, tableX, y, tableW, totalRowH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  // "Total:" on left
  doc.text("Total:", tableX + 4, y + 6);

  // Tax total and Grand total on right
  if (isGST) {
    const taxTotal = data.subtotal * (gstRate / 100);
    cx = tableX;
    for (let i = 0; i < scaledWidths.length; i++) {
      doc.line(cx, y, cx, y + totalRowH);
      if (i === scaledWidths.length - 2) {
        doc.text(formatINR(taxTotal), cx + scaledWidths[i] / 2, y + 6, { align: "center" });
      }
      if (i === scaledWidths.length - 1) {
        doc.text(formatINR(data.total), cx + scaledWidths[i] / 2, y + 6, { align: "center" });
      }
      cx += scaledWidths[i];
    }
    doc.line(cx, y, cx, y + totalRowH);
  } else {
    cx = tableX;
    for (let i = 0; i < scaledWidths.length; i++) {
      doc.line(cx, y, cx, y + totalRowH);
      if (i === scaledWidths.length - 1) {
        doc.text(formatINR(data.total), cx + scaledWidths[i] / 2, y + 6, { align: "center" });
      }
      cx += scaledWidths[i];
    }
    doc.line(cx, y, cx, y + totalRowH);
  }

  y += totalRowH;

  // ─── AMOUNT IN WORDS ───
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Amount in Words:", m, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text(numberToWords(Math.round(data.total)) + " Point " + ((data.total % 1) * 10).toFixed(0) + " only", m, y);

  // ─── AUTHORIZED SIGNATORY ───
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("For VendorHub Private Limited:", pw - m - 2, y, { align: "right" });
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.text("Authorized Signatory", pw - m - 2, y, { align: "right" });

  // ─── FOOTER ───
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("This is a computer-generated invoice and does not require a physical signature.", pw / 2, footerY, { align: "center" });

  return doc;
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }
  return convert(num);
}
