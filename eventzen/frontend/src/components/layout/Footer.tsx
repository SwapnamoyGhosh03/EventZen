import { Link } from "react-router-dom";
import { useState } from "react";
import { Send } from "lucide-react";
import Logo from "@/components/ui/Logo";

const footerLinks = {
  Product: [
    { label: "Events", path: "/events" },
    { label: "Venues", path: "/events" },
    { label: "Pricing", path: "/" },
    { label: "Features", path: "/" },
  ],
  Company: [
    { label: "About Us", path: "/" },
    { label: "Careers", path: "/" },
    { label: "Blog", path: "/" },
    { label: "Contact", path: "/" },
  ],
  Resources: [
    { label: "Help Center", path: "/" },
    { label: "Documentation", path: "/" },
    { label: "API Reference", path: "/" },
    { label: "Community", path: "/" },
  ],
  Legal: [
    { label: "Privacy Policy", path: "/" },
    { label: "Terms of Service", path: "/" },
    { label: "Cookie Policy", path: "/" },
    { label: "GDPR", path: "/" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-near-black text-cream">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="inline-block mb-4">
              <Logo size={34} showText dark />
            </Link>
            <p className="font-body text-sm text-cream/60 leading-relaxed max-w-xs mb-6">
              Plan, organize, and deliver unforgettable events with the platform
              built for modern event professionals.
            </p>

            {/* Newsletter */}
            <div className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="
                  flex-1 bg-white/10 border border-cream/20 rounded-l-md
                  px-4 py-2.5 text-sm font-body text-cream
                  placeholder:text-cream/40
                  focus:outline-none focus:border-amber
                  transition-colors
                "
              />
              <button className="px-4 bg-amber text-white rounded-r-md hover:bg-amber-dark transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-accent text-xs font-semibold uppercase tracking-widest text-cream/40 mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="font-body text-sm text-cream/70 hover:text-amber transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cream/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-cream/40">
            &copy; {new Date().getFullYear()} EventZen. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {["Twitter", "LinkedIn", "Instagram", "GitHub"].map((social) => (
              <a
                key={social}
                href="#"
                className="font-body text-xs text-cream/40 hover:text-amber transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
