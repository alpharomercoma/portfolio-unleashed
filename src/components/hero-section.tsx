'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ParticleBackground from './particle-background';

export default function HeroSection() {
    const [hoverPrimary, setHoverPrimary] = useState(false);
    const [hoverSecondary, setHoverSecondary] = useState(false);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white" id="home">
            <ParticleBackground />
            <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
                <motion.h1
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Alpha Romer Coma
                </motion.h1>
                <motion.p
                    className="mt-3 max-w-md mx-auto text-balance text-base sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Crafting intelligent solutions at the intersection of software engineering and machine learning.
                </motion.p>
                <div className="mt-10 flex justify-center gap-4">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onHoverStart={() => setHoverPrimary(true)}
                        onHoverEnd={() => setHoverPrimary(false)}
                    >
                        <Link href="/projects" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            View Projects
                            <motion.span
                                className="ml-2"
                                animate={{ x: hoverPrimary ? 5 : 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                →
                            </motion.span>
                        </Link>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onHoverStart={() => setHoverSecondary(true)}
                        onHoverEnd={() => setHoverSecondary(false)}
                    >
                        <Link href="/contact" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50">
                            Get in Touch
                            <motion.span
                                className="ml-2"
                                animate={{ x: hoverSecondary ? 5 : 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                →
                            </motion.span>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
