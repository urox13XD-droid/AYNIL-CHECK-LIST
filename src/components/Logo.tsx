import Image from "next/image";

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="inline-flex flex-col items-start select-none">
      <Image
        src="/aynil-logo.jpg"
        alt="AYNIL"
        width={960}
        height={169}
        priority
        className="h-9 w-auto rounded-md border-[3px] border-black"
      />
      {subtitle && (
        <div className="mt-1 rounded-sm bg-black px-1.5 py-0.5 text-center text-[9px] font-bold tracking-[0.25em] text-white">
          {subtitle}
        </div>
      )}
    </div>
  );
}
