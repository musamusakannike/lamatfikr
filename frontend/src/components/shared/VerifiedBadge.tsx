import Image from "next/image";

export function VerifiedBadge({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/images/verify.png"
      alt="Verified"
      width={size}
      height={size}
      className={className}
    />
  );
}
