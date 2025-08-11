import {
  Instagram,
  Linkedin,
  LocateIcon,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-white shadow-md border-t border-gray-200 ">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="GiraffeSpace" className="w-8 h-8 object-cover" />
              <span className="text-xl font-bold text-gray-900">
                GiraffeSpace
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Next-Gen Event And Venue Management System
              Empowering your organization to create, manage, and elevate every event and venue experience.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Linkedin />
              </a>

              <a
                href="#"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Youtube />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Instagram />
              </a>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-semibold text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Home
                </a>
              </li>
              
              <li>
                <a
                  href="https://urbinaryhub.rw/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="https://urbinaryhub.rw/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-semibold text-sm uppercase tracking-wider">
              Contact Us
            </h3>

            <p className="text-gray-600 text-sm flex gap-3">
              <MapPin />
              Binary Hub , University of Rwanda - Nyarugenge Campus
            </p>
            <p className="text-gray-600 text-sm flex gap-3">
              <Mail />
              <a
                href="mailto:urbinaryhub@gmail.com"
                className="hover:text-blue-600 transition-colors"
              >
                urbinaryhub@gmail.com
              </a>
            </p>
            <p className="text-gray-600 text-sm flex gap-3">
              <Phone />
              <a
                href="tel:+250790289399"
                className="hover:text-blue-600 transition-colors"
              >
                +250 790 289 399
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-100  text-center text-gray-500 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 text-sm">
            <div className="font-medium">GiraffeSpace</div>
            <div className="text-center">
            © 2025 GiraffeSpace.{" "}
              <span className="font-semibold">All rights reserved.</span> 
            </div>
            <div>
              Powered by {" "}
              <a
                href="https://urbinaryhub.rw"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 transition-colors"
              >
                Binary Hub team
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
