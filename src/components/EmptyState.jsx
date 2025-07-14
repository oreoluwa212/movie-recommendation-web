// components/EmptyState.jsx
import React from "react";
import { Plus } from "lucide-react";
import Button from "./ui/Button";

const EmptyState = ({
  icon,
  title,
  description,
  buttonText,
  buttonAction,
  showButton = true,
}) => {
  const Icon = icon;

  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        {Icon && <Icon className="h-16 w-16 mx-auto mb-4 opacity-50" />}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>
      {showButton && buttonText && buttonAction && (
        <Button
          variant="primary"
          size="medium"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={buttonAction}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
