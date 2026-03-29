import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, CreditCard, PartyPopper } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Discover Events",
    description:
      "Browse our curated collection of events by category, location, or date. Find the perfect experience for you.",
    icon: Search,
  },
  {
    number: "02",
    title: "Register & Pay",
    description:
      "Select your ticket tier, complete a seamless checkout, and receive your digital pass instantly.",
    icon: CreditCard,
  },
  {
    number: "03",
    title: "Attend & Enjoy",
    description:
      "Show your QR-coded ticket at the door, check in effortlessly, and enjoy an unforgettable experience.",
    icon: PartyPopper,
  },
];

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] as const } },
};

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="section-blush section-padding" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] as const }}
          className="text-center mb-14"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-near-black mb-3">
            How EventZen Works
          </h2>
          <p className="font-body text-dark-gray max-w-xl mx-auto">
            Three simple steps to your next great event experience
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8 relative"
        >
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-[2px] bg-near-black/10" />

          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={cardVariant}
              className="relative text-center"
            >
              <div className="relative z-10 w-20 h-20 mx-auto mb-6 bg-white rounded-xl shadow-warm-md flex items-center justify-center">
                <step.icon size={32} className="text-amber" />
              </div>
              <span className="font-accent text-xs font-bold text-amber tracking-widest uppercase">
                Step {step.number}
              </span>
              <h3 className="font-heading text-xl font-semibold text-near-black mt-2 mb-3">
                {step.title}
              </h3>
              <p className="font-body text-dark-gray text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
