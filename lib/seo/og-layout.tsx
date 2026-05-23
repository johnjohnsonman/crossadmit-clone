import type { ReactNode } from "react";

type OgLayoutProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  footer?: ReactNode;
};

export function OgImageLayout({ title, subtitle, badge, footer }: OgLayoutProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {badge ? (
        <div
          style={{
            fontSize: 22,
            color: "#c4b5fd",
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {badge}
        </div>
      ) : null}
      <div
        style={{
          fontSize: title.length > 40 ? 48 : 64,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          lineHeight: 1.15,
          marginBottom: 20,
          maxWidth: 1000,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            fontSize: 28,
            color: "#a5b4fc",
            textAlign: "center",
            marginBottom: 32,
            maxWidth: 900,
          }}
        >
          {subtitle}
        </div>
      ) : null}
      {footer ?? (
        <div
          style={{
            fontSize: 22,
            color: "#cbd5e1",
            display: "flex",
            gap: 32,
          }}
        >
          <span>crossadmit.com</span>
        </div>
      )}
    </div>
  );
}
