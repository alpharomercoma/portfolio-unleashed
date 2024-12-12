'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { certifications } from '../../data/certifications';
import { CertificationCard } from './certification-card';
import { SearchBar } from './search-bar';

function Certifications() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(9);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setItemsPerPage(4);
            } else if (window.innerWidth < 1024) {
                setItemsPerPage(6);
            } else {
                setItemsPerPage(9);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const filteredCertifications = useMemo(() => {
        return certifications.filter(cert =>
            cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.company.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredCertifications.length / itemsPerPage);

    const visibleCertifications = useMemo(() => {
        const start = currentPage * itemsPerPage;
        return filteredCertifications.slice(start, start + itemsPerPage);
    }, [filteredCertifications, currentPage, itemsPerPage]);

    useEffect(() => {
        if (currentPage >= totalPages) {
            setCurrentPage(Math.max(0, totalPages - 1));
        }
    }, [currentPage, totalPages]);

    const handlePrevious = () => {
        setCurrentPage(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
    };

    return (
        <section className="py-12 bg-gray-50" id="certifications">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-10 text-center">My Certifications</h2>
                <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <div className="relative overflow-hidden mb-8" style={{ minHeight: '360px' }}>
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
                        >
                            {visibleCertifications.map(cert => (
                                <CertificationCard key={cert.id} certification={cert} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="flex justify-between items-center">
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 0}
                        className="flex items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors duration-200"
                    >
                        <ChevronLeft size={20} className="mr-2" />
                        <span className="hidden sm:inline">Previous</span>
                    </button>
                    <span className="text-sm font-medium">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages - 1}
                        className="flex items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors duration-200"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight size={20} className="ml-2" />
                    </button>
                </div>
            </div>
        </section>
    );
}

export default Certifications;