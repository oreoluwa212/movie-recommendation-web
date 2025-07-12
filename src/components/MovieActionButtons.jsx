// components/MovieActionButtons.js
import React from "react";
import { Play, Info, Heart, Plus, Eye, Share2 } from "lucide-react";
import Button from "./ui/Button";
import IconButton from "./ui/IconButton";

const MovieActionButtons = ({
  movie,
  onWatchNow,
  onWatchTrailer,
  onMoreInfo,
  onAddToFavorites,
  onAddToWatchlist,
  onMarkAsWatched,
  onShare,
  size = "medium",
  layout = "horizontal", // 'horizontal' or 'vertical'
  showLabels = true,
  variant = "primary",
}) => {
  const buttonSize = size;
  const iconSize =
    size === "small" ? "h-4 w-4" : size === "large" ? "h-6 w-6" : "h-5 w-5";

  const ActionButton = ({
    onClick,
    icon,
    label,
    variant: btnVariant = "secondary",
    disabled = false,
  }) => {
    if (showLabels) {
      return (
        <Button
          onClick={onClick}
          variant={btnVariant}
          size={buttonSize}
          leftIcon={React.cloneElement(icon, { className: iconSize })}
          disabled={disabled}
        >
          {label}
        </Button>
      );
    }

    return (
      <IconButton
        onClick={onClick}
        variant={btnVariant}
        size={buttonSize}
        tooltip={label}
        disabled={disabled}
      >
        {React.cloneElement(icon, { className: iconSize })}
      </IconButton>
    );
  };

  const buttons = [
    {
      key: "watch",
      onClick: onWatchNow,
      icon: <Play />,
      label: "Watch Now",
      variant: variant,
      show: !!onWatchNow,
    },
    {
      key: "trailer",
      onClick: onWatchTrailer,
      icon: <Play />,
      label: "Watch Trailer",
      variant: "outline",
      show: !!onWatchTrailer && !!movie?.trailer,
    },
    {
      key: "info",
      onClick: onMoreInfo,
      icon: <Info />,
      label: "More Info",
      variant: "secondary",
      show: !!onMoreInfo,
    },
    {
      key: "favorites",
      onClick: onAddToFavorites,
      icon: <Heart />,
      label: "Add to Favorites",
      variant: "ghost",
      show: !!onAddToFavorites,
    },
    {
      key: "watchlist",
      onClick: onAddToWatchlist,
      icon: <Plus />,
      label: "Add to Watchlist",
      variant: "ghost",
      show: !!onAddToWatchlist,
    },
    {
      key: "watched",
      onClick: onMarkAsWatched,
      icon: <Eye />,
      label: "Mark as Watched",
      variant: "ghost",
      show: !!onMarkAsWatched,
    },
    {
      key: "share",
      onClick: onShare,
      icon: <Share2 />,
      label: "Share",
      variant: "ghost",
      show: !!onShare,
    },
  ];

  const visibleButtons = buttons.filter((button) => button.show);

  const containerClass =
    layout === "vertical"
      ? "flex flex-col space-y-2"
      : "flex flex-wrap gap-2 sm:gap-4";

  return (
    <div className={containerClass}>
      {visibleButtons.map((button) => (
        <ActionButton
          key={button.key}
          onClick={button.onClick}
          icon={button.icon}
          label={button.label}
          variant={button.variant}
        />
      ))}
    </div>
  );
};

export default MovieActionButtons;
