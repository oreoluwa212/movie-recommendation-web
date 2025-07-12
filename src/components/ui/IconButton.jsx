// components/ui/IconButton.js
import React from "react";
import { cn } from "../../utils/cn";

const IconButton = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "medium",
      children,
      disabled = false,
      loading = false,
      tooltip,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      secondary: "bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500",
      outline:
        "border border-white text-white hover:bg-white hover:text-red-600 focus:ring-white",
      ghost: "bg-transparent text-white hover:bg-white/10 focus:ring-white/20",
      danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    };

    const sizes = {
      small: "p-2",
      medium: "p-3",
      large: "p-4",
    };

    const LoadingSpinner = () => (
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    );

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        ref={ref}
        title={tooltip}
        {...props}
      >
        {loading ? <LoadingSpinner /> : children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
