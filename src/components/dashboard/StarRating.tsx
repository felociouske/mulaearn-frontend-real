import { StarIcon } from "@/components/icons/Icons";

export default function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={`transition-colors ${star <= value ? "text-dash-warn-500" : "text-dash-text/20"}`}
        >
          <StarIcon size={24} filled={star <= value} />
        </button>
      ))}
    </div>
  );
}
