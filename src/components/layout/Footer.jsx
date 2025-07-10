import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    'Home': [
      { name: 'Categories', href: '#' },
      { name: 'Devices', href: '#' },
      { name: 'Pricing', href: '#' },
      { name: 'FAQ', href: '#' }
    ],
    'Movies': [
      { name: 'Genres', href: '#' },
      { name: 'Trending', href: '#' },
      { name: 'New Release', href: '#' },
      { name: 'Popular', href: '#' }
    ],
    'Shows': [
      { name: 'Genres', href: '#' },
      { name: 'Trending', href: '#' },
      { name: 'New Release', href: '#' },
      { name: 'Popular', href: '#' }
    ],
    'Support': [
      { name: 'Contact Us', href: '#' },
      { name: 'Help Center', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Privacy Policy', href: '#' }
    ],
    'Subscription': [
      { name: 'Plans', href: '#' },
      { name: 'Features', href: '#' },
      { name: 'Free Trial', href: '#' },
      { name: 'Gift Cards', href: '#' }
    ]
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' }
  ];

  return (
    <footer className="bg-black border-t border-gray-800 mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Film className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-white">StreamVibe</span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Your ultimate destination for movies and TV shows. Stream thousands of titles across all genres, from the latest blockbusters to classic favorites.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@streamvibe.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>123 Stream Street, Movie City, MC 12345</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-white font-semibold mb-2">Stay Updated</h3>
              <p className="text-gray-400 text-sm">
                Subscribe to our newsletter for the latest movies and exclusive content.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none sm:w-64"
              />
              <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Social Links and Copyright */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                &copy; {currentYear} StreamVibe. All rights reserved.
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Additional Links */}
        <div className="border-t border-gray-800 pt-6 mt-6">
          <div className="flex flex-wrap justify-center md:justify-start space-x-6 text-xs text-gray-500">
            <Link to="#" className="hover:text-gray-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="hover:text-gray-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="#" className="hover:text-gray-400 transition-colors">
              Cookie Policy
            </Link>
            <Link to="#" className="hover:text-gray-400 transition-colors">
              Accessibility
            </Link>
            <Link to="#" className="hover:text-gray-400 transition-colors">
              Corporate Information
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;