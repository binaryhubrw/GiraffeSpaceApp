import React from "react";
import {
  Instagram,
  Linkedin,
  LocateIcon,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white shadow-md border-t border-gray-200 ">
      {/* Main Footer Content */}


      {/* Bottom Bar */}
      <div className="bg-gray-100  text-center text-gray-500 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 text-sm">
            <div className="font-medium flex items-center space-x-2">
              <img src="/logo.png" alt="GiraffeSpace" className="w-6 h-6 object-cover" />
              <span>GiraffeSpace</span>
            </div>
            <div className="text-center">
            © 2025 GiraffeSpace & Binary Hub.{" "}
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
