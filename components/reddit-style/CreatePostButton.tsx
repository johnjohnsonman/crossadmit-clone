import Link from "next/link";

type Props = {
  category?: string;
  className?: string;
};

const baseClass =
  "inline-flex items-center justify-center shrink-0 px-3 py-1.5 bg-[#FF4500] text-white text-xs font-bold rounded-full hover:bg-[#e03d00] transition-colors";

export default function CreatePostButton({ category, className = "" }: Props) {
  const href = category
    ? `/submit?category=${encodeURIComponent(category)}`
    : "/submit";

  return (
    <Link href={href} className={`${baseClass} ${className}`.trim()}>
      + Create Post
    </Link>
  );
}
