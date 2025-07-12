import MovieSection from "./MovieSection";
import AuthCTA from "./AuthCTA";
import { MovieSectionSkeleton } from "./loaders/SkeletonLoaders";

const MovieSectionsList = ({
  homeData,
  loadingStates,
  errors,
  isAuthenticated,
  user,
  onRetry,
  getTrendingMovies,
  isLoadingTrending,
  isLoadingPopular,
  isLoadingNowPlaying,
  isLoadingTopRated,
  isLoadingUpcoming,
}) => {
  const sectionConfig = [
    {
      key: "personalized",
      title: `Recommended for ${user?.username || "You"}`,
      viewAllLink: "/movies/recommendations",
      condition: isAuthenticated,
    },
    {
      key: "trending",
      title: "Trending Now",
      viewAllLink: "/movies/trending",
      condition: !!getTrendingMovies,
      globalLoading: isLoadingTrending,
    },
    {
      key: "popular",
      title: "Popular Movies",
      viewAllLink: "/movies/popular",
      condition: true,
      globalLoading: isLoadingPopular,
    },
    {
      key: "nowPlaying",
      title: "Now Playing in Theaters",
      viewAllLink: "/movies/now-playing",
      condition: true,
      globalLoading: isLoadingNowPlaying,
    },
    {
      key: "topRated",
      title: "Top Rated Movies",
      viewAllLink: "/movies/top-rated",
      condition: true,
      globalLoading: isLoadingTopRated,
    },
    {
      key: "upcoming",
      title: "Coming Soon",
      viewAllLink: "/movies/upcoming",
      condition: true,
      globalLoading: isLoadingUpcoming,
    },
  ];

  return (
    <>
      {sectionConfig.map((section) => {
        if (!section.condition) return null;

        const isLoading = loadingStates[section.key] || section.globalLoading;
        const sectionData = homeData[section.key];

        return (
          <div key={section.key}>
            {isLoading ? (
              <MovieSectionSkeleton
                cardSize="medium"
                cardCount={6}
                showViewAll={true}
                showScrollButtons={true}
              />
            ) : (
              <MovieSection
                title={section.title}
                movies={sectionData}
                loading={false}
                error={errors[section.key]}
                showViewAll={sectionData?.length > 0}
                viewAllLink={section.viewAllLink}
                cardSize="medium"
                onRetry={() => onRetry(section.key)}
              />
            )}
          </div>
        );
      })}

      {/* Auth CTA Section */}
      {!isAuthenticated && <AuthCTA />}
    </>
  );
};

export default MovieSectionsList;
