// src/components/UdmField.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper function for search matching ---
const nodeContainsSearchMatch = (node, query) => {
  if (node.name.toLowerCase().includes(query)) {
    return true;
  }
  if (node.children) {
    return node.children.some(child => nodeContainsSearchMatch(child, query));
  }
  return false;
};

// --- Helper function for use case matching ---
const nodeContainsKeyField = (node, useCase) => {
  if (node.keyFieldInfo && node.keyFieldInfo.includes(useCase)) {
    return true;
  }
  if (node.children) {
    return node.children.some(child => nodeContainsKeyField(child, useCase));
  }
  return false;
};

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

const UdmField = ({ field, selectedField, searchQuery, selectedUseCase, onSelect }) => {
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const hasChildren = field.children && field.children.length > 0;
  const query = searchQuery ? searchQuery.toLowerCase() : '';

  const isSelected = selectedField === field;
  const isDirectSearchMatch = query && field.name.toLowerCase().includes(query);
  const isDirectUseCaseMatch = selectedUseCase && field.keyFieldInfo && field.keyFieldInfo.includes(selectedUseCase);

  // --- Core Logic for Auto-Expansion ---
  let shouldExpand = false;
  if (searchQuery) {
    // If searching, expand if a child contains a search match
    shouldExpand = hasChildren && field.children.some(child => nodeContainsSearchMatch(child, query));
  } else if (selectedUseCase) {
    // If filtering by use case, expand if a child contains a use case match
    shouldExpand = hasChildren && field.children.some(child => nodeContainsKeyField(child, selectedUseCase));
  } else {
    // Otherwise, rely on the user's manual clicks
    shouldExpand = isManuallyExpanded;
  }

  // --- Dynamic Highlighting ---
  const selectionClass = isSelected
    ? 'bg-blue-800'
    : isDirectSearchMatch
    ? 'bg-yellow-800 bg-opacity-40'
    : isDirectUseCaseMatch
    ? 'bg-purple-800 bg-opacity-40'
    : 'hover:bg-gray-700';

  // --- Dynamic Filtering ---
  if (searchQuery && !nodeContainsSearchMatch(field, query)) {
    return null;
  }
  if (selectedUseCase && !nodeContainsKeyField(field, selectedUseCase)) {
    return null;
  }

  return (
    <div className="ml-6 my-1">
      <div
        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-150 ${selectionClass}`}
        onClick={() => {
          onSelect(field);
          if (hasChildren) {
            setIsManuallyExpanded(!isManuallyExpanded);
          }
        }}
      >
        {hasChildren ? <ArrowIcon isExpanded={shouldExpand} /> : <div className="w-5 h-5" />}
        <div className="ml-2 flex flex-wrap items-baseline">
          <span className="font-mono text-lg text-cyan-400 mr-4">{field.name}</span>
          {field.type && <span className="text-sm font-light text-gray-400">({field.type})</span>}
        </div>
      </div>
      
      <AnimatePresence>
        {shouldExpand && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-l border-gray-600"
          >
            {field.children.map((child, index) => (
              <UdmField
                key={`${field.name}-${child.name}-${index}`}
                field={child}
                selectedField={selectedField}
                searchQuery={searchQuery}
                selectedUseCase={selectedUseCase}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UdmField;