import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function CTABanner() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="section-terracotta section-padding" ref={ref}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] as const }}
          className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
        >
          Ready to Elevate Your Events?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 1, 0.5, 1] as const }}
          className="font-body text-lg text-white/80 mb-10 max-w-xl mx-auto"
        >
          Join thousands of event professionals who trust EventZen to deliver
          exceptional experiences.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 1, 0.5, 1] as const }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link to="/auth">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-terracotta hover:bg-cream"
            >
              Sign Up Free
            </Button>
          </Link>
          <Link to="/events">
            <Button
              variant="secondary"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-terracotta"
            >
              Browse Events
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
