// src/components/UdmField.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// A simple arrow icon that will rotate when expanded
const ArrowIcon = ({ isExpanded }) => (
  <motion.svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 transition-transform flex-shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
    animate={{ rotate: isExpanded ? 90 : 0 }}
    transition={{ duration: 0.2 }}
  >
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </motion.svg>
);

const UdmField = ({ field }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = field.children && field.children.length > 0;

  return (
    <div className="ml-6 my-1">
      {/* Clickable Header for the field */}
      <div
        className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors duration-150"
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? <ArrowIcon isExpanded={isExpanded} /> : <div className="w-5 h-5" />}
        <div className="ml-2 flex flex-wrap items-baseline">
          <span className="font-mono text-lg text-cyan-400 mr-4">{field.name}</span>
          {field.type && <span className="text-sm font-light text-gray-400">({field.type})</span>}
        </div>
      </div>

      {/* Animated container for child fields */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-l border-gray-600"
          >
            {field.children.map((child) => (
              // This is the recursion! The component renders itself for each child.
              <UdmField key={child.name} field={child} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UdmField;