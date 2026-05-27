import CreatePostButton from "./CreatePostButton";

type Props = {
  category: string;
  className?: string;
};

export default function WritePostCta({ category, className = "" }: Props) {
  return (
    <div
      className={`rounded-lg border border-[#EDEFF1] dark:border-[#343536] bg-white dark:bg-[#1A1A1B] p-4 ${className}`.trim()}
    >
      <p className="text-sm font-semibold text-[#1C1C1C] dark:text-[#D7DADC] mb-1">
        Have something to share?
      </p>
      <p className="text-xs text-[#7C7C7C] dark:text-[#818384] mb-3">
        Post anonymously — visa tips, campus life, scholarships, and more.
      </p>
      <CreatePostButton
        category={category}
        className="w-full sm:w-auto px-4 py-2 text-sm"
      />
    </div>
  );
}
