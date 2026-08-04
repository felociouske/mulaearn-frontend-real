import { StarIcon } from "@/components/icons/Icons";

export default function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} size={13} filled={star <= rating} className={star <= rating ? "text-dash-warn-500" : "text-dash-text/20"} />
      ))}
    </div>
  );
}
