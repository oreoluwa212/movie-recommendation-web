import React, { useState } from 'react';
import { BookmarkPlus, Loader2 } from 'lucide-react';
import Button from './ui/Button';
import WatchlistModal from './WatchlistModal';

const WatchlistButton = ({ 
  movie, 
  variant = "secondary", 
  size = "medium",
  showIcon = true,
  className = "",
  onSuccess
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        leftIcon={showIcon ? <BookmarkPlus className="h-5 w-5" /> : null}
        onClick={handleClick}
        className={className}
      >
        Add to Watchlist
      </Button>

      <WatchlistModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        movie={movie}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default WatchlistButton;