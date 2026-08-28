/**
 * Client-side receipt renderer for the booking portal.
 * Generates printable 80mm thermal receipt HTML.
 */

export type CompanyReceiptConfig = {
  headerText?: string;
  accentColor?: string;
  showLogo?: boolean;
  logoUrl?: string | null;
  footerText?: string;
};

export type ReceiptData = {
  code: string;
  seat: number | string;
  name: string;
  phone: string | null;
  fare: number;
  method: string;
  route: string;
  origin: string;
  destination: string;
  vehiclePlate: string;
  departureTime: string;
  date: string;
  saccoName: string;
};

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderBookingReceiptHtml(data: ReceiptData, company?: CompanyReceiptConfig | null): string {
  const row = (label: string, value: string) =>
    `<div style="display:flex;justify-content:space-between;margin:3px 0"><span>${label}</span><b>${escape(value)}</b></div>`;

  const lines: string[] = [];

  // Logo
  const headerColor = company?.accentColor || "#8B7D3C";
  if (company?.showLogo && company?.logoUrl) {
    lines.push(`<img src="${escape(company.logoUrl)}" style="height:50px;margin:0 auto 6px;display:block" />`);
  } else {
    lines.push(`<div style="text-align:center;font-size:22px;font-weight:bold;margin-bottom:4px">🦘</div>`);
  }

  // Header
  const headerText = company?.headerText || data.saccoName;
  lines.push(`<h1 style="font-size:16px;text-align:center;margin:0 0 2px;color:${headerColor}">${escape(headerText)}</h1>`);
  lines.push(`<div style="text-align:center;font-size:10px;letter-spacing:1px">PASSENGER BOARDING TICKET</div>`);

  // Divider
  lines.push(`<hr style="border:none;border-top:1px dashed #000;margin:8px 0" />`);

  // Big seat number
  lines.push(`<div style="font-size:24px;font-weight:bold;text-align:center;margin:4px 0">SEAT ${data.seat}</div>`);

  // Divider
  lines.push(`<hr style="border:none;border-top:1px dashed #000;margin:8px 0" />`);

  // Receipt code
  lines.push(`<div style="text-align:center;font-size:11px;font-weight:bold">${escape(data.code)}</div>`);

  // Divider
  lines.push(`<hr style="border:none;border-top:1px dashed #000;margin:8px 0" />`);

  // Details
  lines.push(row("Passenger", data.name));
  if (data.phone) lines.push(row("Phone", data.phone));
  lines.push(row("Route", data.route));
  lines.push(row("From", data.origin));
  lines.push(row("To", data.destination));
  lines.push(row("Vehicle", data.vehiclePlate));
  lines.push(row("Departure", data.departureTime));
  lines.push(row("Date", data.date));
  lines.push(row("Issued", new Date().toLocaleString("en-KE")));

  // Divider
  lines.push(`<hr style="border:none;border-top:1px dashed #000;margin:8px 0" />`);

  // Fare
  lines.push(row("FARE PAID", `KES ${data.fare.toLocaleString("en-KE")}`));
  lines.push(row("Paid via", data.method.toUpperCase()));

  // Divider
  lines.push(`<hr style="border:none;border-top:1px dashed #000;margin:8px 0" />`);

  // Footer
  const footer = company?.footerText || `Thank you for traveling with ${data.saccoName}! 🦘`;
  lines.push(`<div style="text-align:center;margin-top:6px;font-size:10px">${escape(footer)}</div>`);
  lines.push(`<div style="text-align:center;font-size:9px;margin-top:2px">Show this ticket to the conductor. Safe journey!</div>`);
  lines.push(`<div style="text-align:center;font-size:9px;margin-top:4px">📞 0720 363 215</div>`);

  return `<html><head><title>${escape(data.code)}</title><style>
    @page{size:80mm auto;margin:4mm}
    body{margin:0;padding:0}
  </style></head><body>
    <div style="font-family:'Courier New',monospace;font-size:12px;width:72mm;padding:4mm;border:3px solid ${headerColor};border-radius:6px">
      ${lines.join("\n")}
    </div>
  </body></html>`;
}

export function printBookingReceipt(data: ReceiptData, company?: CompanyReceiptConfig | null) {
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return;
  w.document.write(renderBookingReceiptHtml(data, company));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
