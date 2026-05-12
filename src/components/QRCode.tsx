import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

type Props = { value: string; size?: number; className?: string };

export function QRCode({ value, size = 180, className }: Props) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    QRCodeLib.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#0a0a0a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(""));
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-label="QR code loading"
      />
    );
  }
  return (
    <img
      src={src}
      alt="QR code"
      width={size}
      height={size}
      className={`rounded-lg border border-border/60 bg-white p-1 ${className ?? ""}`}
    />
  );
}
