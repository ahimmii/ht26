import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  header: {
    className: "h-10 w-[10.5rem] object-cover object-center md:h-12 md:w-[13rem]",
    width: 320,
    height: 90,
  },
  hero: {
    className: "h-auto w-full max-w-[760px] object-contain object-left",
    width: 1024,
    height: 682,
  },
  footer: {
    className: "h-14 w-[12rem] object-cover object-center",
    width: 320,
    height: 90,
  },
  compact: {
    className: "mx-auto h-auto w-full max-w-[280px] object-contain object-center",
    width: 560,
    height: 373,
  },
};

export function BrandMark({
  size = "header",
  priority = false,
  className,
}: {
  size?: keyof typeof sizes;
  priority?: boolean;
  className?: string;
}) {
  const spec = sizes[size];
  return (
    <Image
      src="/logo.png"
      alt="Halloweenn Tangier 2026"
      width={spec.width}
      height={spec.height}
      priority={priority}
      className={cn(spec.className, className)}
    />
  );
}
