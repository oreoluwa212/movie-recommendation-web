import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/NavBar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import MovieListingPage from "./pages/MovieListing";
import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";

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

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Movie Listing Routes */}
            <Route path="/popular" element={<MovieListingPage />} />
            <Route path="/top-rated" element={<MovieListingPage />} />
            <Route path="/now-playing" element={<MovieListingPage />} />
            <Route path="/upcoming" element={<MovieListingPage />} />
            <Route path="/trending" element={<MovieListingPage />} />
            <Route path="/recommendations" element={<MovieListingPage />} />

            {/* Catch-all route for dynamic category pages */}
            <Route path="/movies/:category" element={<MovieListingPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
