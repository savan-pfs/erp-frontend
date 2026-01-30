import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface PlantLabelProps {
  plantTag: string;
  batch: string;
  strain: string;
  room: string;
  stage: string;
  plantedDate?: string;
  facilityName?: string;
  licenseNumber?: string;
}

const getStageConfig = (stage: string) => {
  switch (stage.toLowerCase()) {
    case "clone":
      return { bg: "#3b82f6", text: "#ffffff", icon: "🌱" };
    case "seedling":
      return { bg: "#06b6d4", text: "#ffffff", icon: "🌱" };
    case "vegetative":
      return { bg: "#22c55e", text: "#ffffff", icon: "🌿" };
    case "flowering":
      return { bg: "#a855f7", text: "#ffffff", icon: "🌸" };
    case "harvest":
      return { bg: "#f59e0b", text: "#000000", icon: "🌾" };
    case "drying":
      return { bg: "#78716c", text: "#ffffff", icon: "🍂" };
    case "curing":
      return { bg: "#92400e", text: "#ffffff", icon: "📦" };
    default:
      return { bg: "#6b7280", text: "#ffffff", icon: "🌿" };
  }
};

export const PlantLabel = ({
  plantTag,
  batch,
  strain,
  room,
  stage,
  plantedDate,
  facilityName = "PassionFarm",
  licenseNumber = "LIC-2024-001",
}: PlantLabelProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const qrData = JSON.stringify({
    tag: plantTag,
    batch,
    strain,
    room,
    stage,
    facility: facilityName,
    license: licenseNumber,
    url: `${window.location.origin}/plants?tag=${plantTag}`,
  });

  useEffect(() => {
    QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR code:", err));
  }, [qrData]);

  const stageConfig = getStageConfig(stage);
  const printDate = new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div
      className="plant-label"
      style={{
        width: "4in",
        height: "2.5in",
        border: "2px solid #1a1a1a",
        backgroundColor: "#fff",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a9e7a 0%, #16a34a 100%)",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}
          >
            🌿
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#fff",
                letterSpacing: "0.5px",
              }}
            >
              {facilityName.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: "7px",
                color: "rgba(255,255,255,0.8)",
                letterSpacing: "0.3px",
              }}
            >
              {licenseNumber}
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: stageConfig.bg,
            color: stageConfig.text,
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "8px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>{stageConfig.icon}</span>
          {stage}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, padding: "10px" }}>
        {/* Left - QR Code Section */}
        <div
          style={{
            width: "120px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRight: "1px dashed #e5e7eb",
            paddingRight: "12px",
            marginRight: "12px",
          }}
        >
          <div
            style={{
              padding: "6px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code for ${plantTag}`}
                style={{
                  width: "90px",
                  height: "90px",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  backgroundColor: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  color: "#9ca3af",
                  borderRadius: "4px",
                }}
              >
                Loading...
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: "6px",
              color: "#9ca3af",
              marginTop: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              textAlign: "center",
            }}
          >
            Scan to Verify
          </div>
        </div>

        {/* Right - Plant Info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Plant Tag - Primary Identifier */}
          <div
            style={{
              backgroundColor: "#111827",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: "6px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                fontSize: "6px",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "2px",
              }}
            >
              Plant Tag ID
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "800",
                fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                letterSpacing: "2px",
              }}
            >
              {plantTag}
            </div>
          </div>

          {/* Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              flex: 1,
            }}
          >
            <InfoCell label="Strain" value={strain} highlight />
            <InfoCell label="Batch" value={batch} mono />
            <InfoCell label="Room" value={room} />
            <InfoCell
              label="Planted"
              value={
                plantedDate
                  ? new Date(plantedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })
                  : "N/A"
              }
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "6px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f9fafb",
          fontSize: "7px",
          color: "#6b7280",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: "600" }}>Track</span>
          <span style={{ color: "#d1d5db" }}>•</span>
          <span style={{ fontWeight: "600" }}>Trace</span>
          <span style={{ color: "#d1d5db" }}>•</span>
          <span style={{ fontWeight: "600" }}>Comply</span>
        </div>
        <div>Printed: {printDate}</div>
      </div>
    </div>
  );
};

// Helper component for info cells
const InfoCell = ({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) => (
  <div
    style={{
      backgroundColor: highlight ? "#f0fdf4" : "#f9fafb",
      padding: "6px 8px",
      borderRadius: "4px",
      border: highlight ? "1px solid #bbf7d0" : "1px solid #f3f4f6",
    }}
  >
    <div
      style={{
        fontSize: "6px",
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "2px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "10px",
        fontWeight: "700",
        color: highlight ? "#166534" : "#111827",
        fontFamily: mono ? "'JetBrains Mono', 'Consolas', monospace" : "inherit",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </div>
  </div>
);

// Compact label variant for smaller printing
export const PlantLabelCompact = ({
  plantTag,
  batch,
  strain,
  stage,
}: Pick<PlantLabelProps, "plantTag" | "batch" | "strain" | "stage">) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const stageConfig = getStageConfig(stage);

  useEffect(() => {
    QRCode.toDataURL(
      JSON.stringify({ tag: plantTag, batch, strain }),
      { width: 100, margin: 1, errorCorrectionLevel: "M" }
    )
      .then((url) => setQrDataUrl(url))
      .catch(console.error);
  }, [plantTag, batch, strain]);

  return (
    <div
      style={{
        width: "2in",
        height: "1in",
        border: "1px solid #1a1a1a",
        backgroundColor: "#fff",
        fontFamily: "'Inter', Arial, sans-serif",
        display: "flex",
        overflow: "hidden",
        borderRadius: "4px",
      }}
    >
      {/* QR Code */}
      <div
        style={{
          width: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR" style={{ width: "50px", height: "50px" }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: "6px 8px", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: "800",
            fontFamily: "monospace",
            marginBottom: "4px",
          }}
        >
          {plantTag}
        </div>
        <div style={{ fontSize: "7px", color: "#6b7280", marginBottom: "2px" }}>
          {strain}
        </div>
        <div style={{ fontSize: "6px", color: "#9ca3af" }}>{batch}</div>
        <div
          style={{
            marginTop: "auto",
            fontSize: "6px",
            fontWeight: "700",
            color: stageConfig.text,
            backgroundColor: stageConfig.bg,
            padding: "2px 6px",
            borderRadius: "8px",
            width: "fit-content",
            textTransform: "uppercase",
          }}
        >
          {stage}
        </div>
      </div>
    </div>
  );
};

// Label sheet component for printing multiple labels
export const PlantLabelSheet = ({
  plants,
  compact = false,
}: {
  plants: Array<PlantLabelProps>;
  compact?: boolean;
}) => {
  return (
    <div
      className="label-sheet"
      style={{
        display: "grid",
        gridTemplateColumns: compact ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
        gap: compact ? "0.125in" : "0.25in",
        padding: "0",
        backgroundColor: "#fff",
      }}
    >
      {plants.map((plant, index) =>
        compact ? (
          <PlantLabelCompact key={`${plant.plantTag}-${index}`} {...plant} />
        ) : (
          <PlantLabel key={`${plant.plantTag}-${index}`} {...plant} />
        )
      )}
    </div>
  );
};
