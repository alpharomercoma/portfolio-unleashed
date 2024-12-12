import { motion } from 'framer-motion';

export const SkeletonLoader = () => {
  return (
    <div className="flex items-end space-x-2 mb-4">
      <motion.div
        className="w-8 h-8 bg-gray-300 rounded-full"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="h-10 w-3/4 bg-gray-300 rounded-2xl rounded-bl-none"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
    </div>
  );
}
