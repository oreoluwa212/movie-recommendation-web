import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/NavBar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import MovieListingPage from "./pages/MovieListing";
import MovieDetails from "./pages/MovieDetails";
// import Login from "./pages/auth/Login";
// import Register from "./pages/auth/Register";
// import Profile from "./pages/Profile";
// import Watchlists from "./pages/Watchlists";
// import WatchlistDetail from "./pages/WatchlistDetail";
// import Reviews from "./pages/Reviews";
// import Favorites from "./pages/Favorites";
// import Watched from "./pages/Watched";
// import ProtectedRoute from "./components/auth/ProtectedRoute";
// import Toast from "./components/ui/Toast";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/movie/:id" element={<MovieDetails />} />

            {/* Movie Listing Routes */}
            <Route path="/popular" element={<MovieListingPage />} />
            <Route path="/top-rated" element={<MovieListingPage />} />
            <Route path="/now-playing" element={<MovieListingPage />} />
            <Route path="/upcoming" element={<MovieListingPage />} />
            <Route path="/trending" element={<MovieListingPage />} />
            <Route path="/recommendations" element={<MovieListingPage />} />

            {/* Catch-all route for dynamic category pages */}
            <Route path="/movies/:category" element={<MovieListingPage />} />

            {/* <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} /> */}

            {/* Protected Routes */}
            {/* <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/watchlists"
                    element={
                      <ProtectedRoute>
                        <Watchlists />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/watchlist/:id"
                    element={
                      <ProtectedRoute>
                        <WatchlistDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reviews"
                    element={
                      <ProtectedRoute>
                        <Reviews />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/favorites"
                    element={
                      <ProtectedRoute>
                        <Favorites />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/watched"
                    element={
                      <ProtectedRoute>
                        <Watched />
                      </ProtectedRoute>
                    }
                  /> */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
