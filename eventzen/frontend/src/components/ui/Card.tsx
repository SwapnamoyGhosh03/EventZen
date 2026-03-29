import { type HTMLAttributes } from "react";
import { motion } from "framer-motion";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  hover = true,
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const Component = hover ? motion.div : "div";
  const motionProps = hover
    ? {
        whileHover: { y: -4, transition: { duration: 0.2 } },
      }
    : {};

  return (
    <Component
      className={`
        bg-white border border-border-light rounded-lg
        transition-shadow duration-300
        ${hover ? "hover:shadow-card-hover cursor-pointer" : ""}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...motionProps}
      {...(props as any)}
    >
      {children}
    </Component>
  );
}
