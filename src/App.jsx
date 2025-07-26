// App.js
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import MovieListingPage from "./pages/MovieListing";
import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import UserPage from "./pages/UserPage";
import Navbar from "./components/layout/NavBar";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Global modal state handler - can be used by navbar
  const handleModalState = (isOpen) => {
    setIsModalOpen(isOpen);
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white relative">
        <ScrollToTop />

        {/* Navigation - Always stays on top */}
        <div className={`relative ${isModalOpen ? 'z-50' : 'z-40'}`}>
          <Navbar onModalStateChange={handleModalState} />
        </div>

        {/* Main Content */}
        <main className="min-h-screen relative z-10">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/movie/:id" element={<MovieDetails />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* User Routes - All routes that should use UserPage */}
            <Route path="/favorites" element={<UserPage />} />
            <Route path="/watchlist" element={<UserPage />} />
            <Route path="/watched" element={<UserPage />} />
            <Route path="/profile" element={<UserPage />} />

            {/* Alternative user routes with section parameter */}
            <Route path="/user/:section" element={<UserPage />} />

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

        {/* Footer */}
        <Footer />

        {/* Toast Container - High z-index to stay above modal */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastClassName="bg-gray-800 text-white"
          progressClassName="bg-red-600"
          style={{ zIndex: 9999 }}
        />
      </div>
    </Router>
  );
}

export default App;