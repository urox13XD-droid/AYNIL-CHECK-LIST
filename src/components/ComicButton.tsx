export function ComicButton({
  children,
  onClick,
  variant = "outline",
  title,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "outline" | "solid";
  title?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`rounded-lg border-[2.5px] border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-comic-sm transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-comic-sm ${
        variant === "solid"
          ? "bg-black text-white hover:bg-white hover:text-black"
          : "bg-white text-black hover:bg-black hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
