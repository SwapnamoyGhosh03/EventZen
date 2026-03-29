import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="section-cream section-padding" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] as const }}
          >
            <div className="relative">
              <div className="bg-white rounded-xl border border-border-light shadow-warm-md p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber/10 rounded-lg p-6 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">&#127891;</span>
                    <span className="font-accent text-xs text-amber font-semibold uppercase tracking-wider">
                      Workshops
                    </span>
                  </div>
                  <div className="bg-sage/10 rounded-lg p-6 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">&#127908;</span>
                    <span className="font-accent text-xs text-sage font-semibold uppercase tracking-wider">
                      Conferences
                    </span>
                  </div>
                  <div className="bg-burgundy/10 rounded-lg p-6 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">&#127926;</span>
                    <span className="font-accent text-xs text-burgundy font-semibold uppercase tracking-wider">
                      Concerts
                    </span>
                  </div>
                  <div className="bg-dusty-blue/10 rounded-lg p-6 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">&#129309;</span>
                    <span className="font-accent text-xs text-dusty-blue font-semibold uppercase tracking-wider">
                      Meetups
                    </span>
                  </div>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full bg-amber/10 rounded-xl" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 1, 0.5, 1] as const }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-near-black mb-6">
              Built for Organizers,{" "}
              <span className="text-amber italic">Loved</span> by Attendees
            </h2>
            <p className="font-body text-dark-gray leading-relaxed mb-4">
              EventZen is the all-in-one platform that empowers organizers to
              create, manage, and scale events effortlessly while delivering
              seamless experiences for every attendee.
            </p>
            <p className="font-body text-dark-gray leading-relaxed mb-8">
              From venue booking and ticket management to real-time check-in
              analytics and financial reporting, we handle the complexity so you
              can focus on what matters &mdash; creating unforgettable moments.
            </p>
            <Link to="/events">
              <Button variant="primary">Learn More</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
