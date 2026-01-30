import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";

interface ReportData {
  reportType: string;
  dateRange: string;
  facility: string;
  generatedAt: Date;
}

export const generatePDFReport = (
  reportType: string,
  reportData: ReportData
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor = [34, 197, 94]; // Green
  const secondaryColor = [59, 130, 246]; // Blue
  const accentColor = [139, 92, 246]; // Purple
  const textColor = [51, 51, 51];
  const lightGray = [243, 244, 246];
  const darkGray = [107, 114, 128];

  let yPos = margin;

  // Header with gradient effect
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Decorative line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(0, 45, pageWidth, 45);

  // Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("CannaCultivate", margin, 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Cultivation Management System", margin, 30);

  // Report Title with icon space
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(getReportTitle(reportType), margin, 38);

  yPos = 55;

  // Report Info Box with border
  doc.setFillColor(...lightGray);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 22, 3, 3, "FD");

  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Type: ${getReportTitle(reportType)}`, margin + 3, yPos + 7);
  doc.text(
    `Date Range: ${getDateRangeLabel(reportData.dateRange)}`,
    margin + 3,
    yPos + 12
  );
  doc.text(
    `Facility: ${getFacilityLabel(reportData.facility)}`,
    margin + 3,
    yPos + 17
  );

  doc.setFontSize(8);
  doc.setTextColor(...darkGray);
  doc.text(
    `Generated: ${reportData.generatedAt.toLocaleString()}`,
    pageWidth - margin - 3,
    yPos + 19,
    { align: "right" }
  );

  yPos += 32;

  // Generate report content based on type
  switch (reportType) {
    case "yield":
      generateYieldReport(doc, yPos, margin, contentWidth, pageWidth);
      break;
    case "compliance":
      generateComplianceReport(doc, yPos, margin, contentWidth, pageWidth);
      break;
    case "financial":
      generateFinancialReport(doc, yPos, margin, contentWidth, pageWidth);
      break;
    case "inventory":
      generateInventoryReport(doc, yPos, margin, contentWidth, pageWidth);
      break;
    case "environmental":
      generateEnvironmentalReport(doc, yPos, margin, contentWidth, pageWidth);
      break;
    case "ipm":
      generateIPMReport(doc, yPos, margin, contentWidth, pageWidth);
      break;
    default:
      generateDefaultReport(doc, yPos, margin, contentWidth, pageWidth);
  }

  // Footer on each page
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "Confidential - CannaCultivate ERP System",
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Save PDF
  const fileName = `${reportType}_report_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
};

const getReportTitle = (type: string): string => {
  const titles: Record<string, string> = {
    yield: "Yield Report",
    compliance: "Compliance Report",
    financial: "Financial Report",
    inventory: "Inventory Report",
    environmental: "Environmental Report",
    ipm: "IPM Management Report",
  };
  return titles[type] || "Report";
};

const getDateRangeLabel = (range: string): string => {
  const labels: Record<string, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    "1y": "Last year",
    custom: "Custom range",
  };
  return labels[range] || range;
};

const getFacilityLabel = (facility: string): string => {
  if (facility === "all") return "All Facilities";
  return `Facility ${facility}`;
};

const generateYieldReport = (
  doc: jsPDF,
  startY: number,
  margin: number,
  contentWidth: number,
  pageWidth: number
) => {
  let yPos = startY;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("Executive Summary", margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 51, 51);

  const summaryData = [
    ["Total Yield", "5,320 oz", "+12.5%"],
    ["Average Yield per Plant", "2.4 oz", "Above target"],
    ["Total Revenue", "$532,000", "+15.2%"],
    ["Harvest Efficiency", "115%", "Exceeded target"],
  ];

  summaryData.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.text(row[0] + ":", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(row[1], margin + 50, yPos);
    doc.setTextColor(34, 197, 94);
    doc.text(row[2], margin + 100, yPos);
    doc.setTextColor(51, 51, 51);
    yPos += 7;
  });

  yPos += 5;

  // Strain Performance Table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(139, 92, 246);
  doc.text("Strain Performance", margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [
      ["Strain", "Batches", "Total Yield (oz)", "Avg/Plant (oz)", "Revenue"],
    ],
    body: [
      ["Blue Dream", "12", "1,820", "2.5", "$182,000"],
      ["OG Kush", "10", "1,450", "2.3", "$145,000"],
      ["Gelato", "8", "1,200", "2.4", "$120,000"],
      ["Sour Diesel", "6", "850", "2.1", "$85,000"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || yPos;
  yPos = finalY + 10;

  // Recent Harvests
  if (yPos > 250) {
    doc.addPage();
    yPos = margin + 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246);
  doc.text("Recent Harvests", margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Batch", "Strain", "Plants", "Yield (oz)", "Efficiency"]],
    body: [
      ["B-2024-001", "Blue Dream", "150", "375", "125%"],
      ["B-2024-002", "OG Kush", "200", "460", "115%"],
      ["B-2024-003", "Gelato", "100", "240", "120%"],
      ["B-2024-004", "Sour Diesel", "130", "273", "105%"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      4: { cellWidth: 30 },
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });
};

const generateComplianceReport = (
  doc: jsPDF,
  startY: number,
  margin: number,
  contentWidth: number,
  pageWidth: number
) => {
  let yPos = startY;

  // Compliance Score
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("Compliance Overview", margin, yPos);
  yPos += 10;

  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("98%", margin, yPos);
  yPos += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 51, 51);
  doc.text("Overall Compliance Score", margin, yPos);
  yPos += 15;

  // Compliance Checklist
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(139, 92, 246);
  doc.text("Compliance Checklist", margin, yPos);
  yPos += 10;

  const checklist = [
    ["✓", "All plant tags verified", "100%"],
    ["✓", "Audit logs up to date", "100%"],
    ["✓", "Inventory reconciled", "100%"],
    ["⚠", "Environmental logs pending", "2 pending"],
    ["✓", "Waste records complete", "100%"],
    ["✓", "License compliance", "Active"],
  ];

  checklist.forEach((item) => {
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94);
    doc.text(item[0], margin, yPos);
    doc.setTextColor(51, 51, 51);
    doc.text(item[1], margin + 8, yPos);
    doc.setTextColor(107, 114, 128);
    doc.text(item[2], pageWidth - margin - 20, yPos, { align: "right" });
    yPos += 7;
  });

  yPos += 5;

  // Audit Trail
  if (yPos > 250) {
    doc.addPage();
    yPos = margin + 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246);
  doc.text("Recent Audit Events", margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Date", "Event Type", "Entity", "User", "Status"]],
    body: [
      ["2024-11-15", "Plant Created", "PLT-001-001", "John Smith", "✓"],
      ["2024-11-14", "Batch Transfer", "B-2024-001", "Jane Doe", "✓"],
      ["2024-11-13", "Harvest Recorded", "H-2024-005", "Mike Johnson", "✓"],
      ["2024-11-12", "Inventory Adjusted", "INV-001", "John Smith", "✓"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });
};

const generateFinancialReport = (
  doc: jsPDF,
  startY: number,
  margin: number,
  contentWidth: number,
  pageWidth: number
) => {
  let yPos = startY;

  // Financial Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("Financial Summary", margin, yPos);
  yPos += 10;

  const financialData = [
    ["Total Revenue", "$532,000", "+15.2%"],
    ["Total Costs", "$36,000", "-12%"],
    ["Net Profit", "$496,000", "+18.5%"],
    ["Cost per Gram", "$3.25", "-12%"],
  ];

  financialData.forEach((row) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(row[0] + ":", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(row[1], margin + 60, yPos);
    doc.setTextColor(34, 197, 94);
    doc.text(row[2], margin + 120, yPos);
    doc.setTextColor(51, 51, 51);
    yPos += 8;
  });

  yPos += 5;

  // Cost Breakdown
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(139, 92, 246);
  doc.text("Cost Breakdown", margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Category", "Amount", "Percentage"]],
    body: [
      ["Labor", "$18,000", "50%"],
      ["Nutrients", "$12,500", "35%"],
      ["Utilities", "$3,500", "10%"],
      ["Supplies", "$2,000", "5%"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    margin: { left: margin, right: margin },
  });
};

const generateInventoryReport = (
  doc: jsPDF,
  startY: number,
  margin: number,
  contentWidth: number,
  pageWidth: number
) => {
  let yPos = startY;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(139, 92, 246);
  doc.text("Current Inventory", margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Lot Number", "Type", "Strain", "Weight (lbs)", "THC %", "Status"]],
    body: [
      ["LOT-001", "Flower", "Blue Dream", "125.5", "22.5", "Available"],
      ["LOT-002", "Flower", "OG Kush", "98.2", "24.1", "Available"],
      ["LOT-003", "Trim", "Gelato", "45.8", "18.2", "Available"],
      ["LOT-004", "Flower", "Sour Diesel", "87.3", "21.8", "QA Pending"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });
};

const generateEnvironmentalReport = (
  doc: jsPDF,
  startY: number,
  margin: number,
  contentWidth: number,
  pageWidth: number
) => {
  let yPos = startY;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246);
  doc.text("Environmental Conditions", margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Room", "Avg Temp (°F)", "Avg Humidity (%)", "Avg VPD", "Status"]],
    body: [
      ["Flower Room A", "75.2", "55.1", "1.2", "Optimal"],
      ["Flower Room B", "74.8", "54.3", "1.15", "Optimal"],
      ["Veg Room 1", "78.1", "65.2", "0.95", "Optimal"],
      ["Clone Room", "80.0", "80.0", "0.6", "Optimal"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });
};

const generateIPMReport = (
  doc: jsPDF,
  startY: number,
  margin: number,
  contentWidth: number,
  pageWidth: number
) => {
  let yPos = startY;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94);
  doc.text("IPM Treatment History", margin, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [["Date", "Room", "Type", "Product", "Pest/Disease", "Status"]],
    body: [
      [
        "2024-11-15",
        "Flower Room A",
        "Preventive",
        "Neem Oil",
        "-",
        "Completed",
      ],
      [
        "2024-11-14",
        "Veg Room 1",
        "Curative",
        "Spinosad",
        "Spider Mites",
        "Completed",
      ],
      ["2024-11-13", "Clone Room", "Preventive", "H2O2", "-", "Completed"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: margin, right: margin },
  });
};

const generateDefaultReport = (
  doc: jsPDF,
  startY: number,
  margin: number,
  contentWidth: number,
  pageWidth: number
) => {
  let yPos = startY;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 51, 51);
  doc.text("Report content will be generated here.", margin, yPos);
};
