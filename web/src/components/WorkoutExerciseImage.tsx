import { useState } from "react";

type ImageReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

interface WorkoutExerciseImageProps {
  imageUrl?: string | null;
  imageReviewStatus?: ImageReviewStatus;
  name: string;
  size?: "small" | "large";
}

export function WorkoutExerciseImage({
  imageUrl,
  imageReviewStatus,
  name,
  size = "large",
}: WorkoutExerciseImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const isSmall = size === "small";

  const imageClassName = isSmall ? "h-20 w-20 shrink-0" : "h-48 w-full sm:h-56";

  const isPending = imageReviewStatus === "PENDING";
  const isApproved = imageReviewStatus === "APPROVED";

  const canDisplay =
    Boolean(imageUrl) && imageUrl !== failedUrl && (isApproved || isPending);

  if (!canDisplay) {
    return (
      <div
        role="img"
        aria-label={`Imagem indisponível para ${name}`}
        className={`${imageClassName} flex items-center justify-center rounded-lg border border-border-default bg-page p-3 text-center text-xs text-text-secondary`}
      >
        Imagem não disponível
      </div>
    );
  }

  return (
    <figure
      className={
        isSmall
          ? "flex w-20 shrink-0 flex-col gap-1"
          : "flex w-full flex-col gap-2"
      }
    >
      <img
        src={imageUrl ?? undefined}
        alt={`Ilustração do exercício: ${name}`}
        loading="lazy"
        onError={() => setFailedUrl(imageUrl ?? null)}
        className={`${imageClassName} rounded-lg border border-border-default bg-page object-contain`}
      />

      {isPending && (
        <figcaption
          className={
            isSmall
              ? "text-center text-[9px] leading-tight text-amber-600 dark:text-amber-400"
              : "rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
          }
        >
          {isSmall
            ? "Imagem provisória"
            : "Imagem ilustrativa — pendente de revisão técnica."}
        </figcaption>
      )}
    </figure>
  );
}
