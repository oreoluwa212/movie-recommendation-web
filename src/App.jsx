// App.js - Improved version
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppInitialization } from './hooks/useAppInitialization';
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import MovieListingPage from "./pages/MovieListing";
import MovieDetails from "./pages/MovieDetails";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Navbar from "./components/layout/NavBar";

function App() {
  // Initialize the app once at the top level
  const { isLoading, error } = useAppInitialization();

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Optional: Show loading state during initialization */}
        {isLoading && (
          <div className="fixed top-0 left-0 w-full h-1 bg-gray-800 z-50">
            <div className="h-full bg-red-600 animate-pulse"></div>
          </div>
        )}

        {/* Optional: Show initialization error */}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-50">
            Initialization error: {error}
          </div>
        )}

        {/* Navigation */}
        <Navbar />
        
        {/* Main Content */}
        <main className="min-h-screen">
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

        {/* Footer */}
        <Footer />
        
        {/* Toast Container */}
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
        />
      </div>
    </Router>
  );
}

export default App;