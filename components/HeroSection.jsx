"use client";

import { AuroraBackground } from "@/app/ui/aurora-background";
import { TypewriterEffectSmooth } from "@/app/ui/typewriter-effect";
import { motion } from "framer-motion";
import Link from "next/link";

export function HeroSection() {
  const words = [
    {
      text: "Quantum",
    },
    {
      text: "powered",
    },
    {
      text: "email",
    },
    {
        text: "messaging",
      },
    {
      text: "with",
    },
    {
      text: "QuMail.",
      className: "text-blue-500",
    },
  ];
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4 overflow-x-clip h-screen"
      >
        <div className="flex flex-col items-center justify-center h-[40rem]  ">
          <p className="text-neutral-800 text-xs sm:text-base  ">
            The road to qubit phase transitions starts here!
          </p>
          <TypewriterEffectSmooth words={words} />
          <div className="flex flex-col">
            <Link
              className="group relative inline-flex justify-center items-center overflow-hidden rounded-full border border-current px-8 py-3  focus:outline-none focus:ring bg-white text-black "
           href="/login"
            >
              <span className="absolute -start-full transition-all group-hover:start-4">
                <svg
                  className="size-5 rtl:rotate-180"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>

              <span className="text-sm tracking-widest font-extrabold  rounded-full transition-all group-hover:ms-4 text-center bg-white px-1 py-0.5 focus:outline-none">
                Log In
              </span>
            </Link>
          </div>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
