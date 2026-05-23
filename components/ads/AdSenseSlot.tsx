"use client";

type Props = {
  slot?: string;
  format?: "auto" | "rectangle" | "vertical";
  className?: string;
};

function PlaceholderAd({ format }: { format: Props["format"] }) {
  const h =
    format === "vertical"
      ? "min-h-[250px]"
      : format === "rectangle"
        ? "min-h-[90px]"
        : "min-h-[100px]";
  return (
    <div
      className={`flex items-center justify-center rounded border border-dashed border-[#EDEFF1] bg-[#F8F9FA] text-xs text-[#7C7C7C] ${h}`}
      aria-hidden
    >
      Ad Space
    </div>
  );
}

export default function AdSenseSlot({
  slot = "placeholder",
  format = "auto",
  className = "",
}: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (!client) {
    return (
      <div className={className}>
        <PlaceholderAd format={format} />
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format === "auto" ? "auto" : undefined}
        data-full-width-responsive="true"
      />
    </div>
  );
}
