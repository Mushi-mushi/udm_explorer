// src/components/UdmField.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper functions (no changes) ---
const nodeContainsSearchMatch = (node, query) => {
  const isDirectMatch = node.name.toLowerCase().includes(query) ||
                        ((query === 'repeated' || query === 'array') && node.repeated);
  if (isDirectMatch) return true;
  if (node.children) {
    return node.children.some(child => nodeContainsSearchMatch(child, query));
  }
  return false;
};

const nodeContainsKeyField = (node, useCase) => {
  if (node.keyFieldInfo && node.keyFieldInfo.includes(useCase)) return true;
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

// --- PROP CHANGES ARE HERE ---
const UdmField = ({ field, path, selectedField, searchQuery, selectedUseCase, onSelect }) => {
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const hasChildren = field.children && field.children.length > 0;
  const query = searchQuery ? searchQuery.toLowerCase() : '';

  // --- PATH CALCULATION ---
  const currentPath = [...path, field.name];

  const isSelected = selectedField === field;

  const isDirectSearchMatch = query &&
    (field.name.toLowerCase().includes(query) ||
    ((query === 'repeated' || query === 'array') && field.repeated));

  const isDirectUseCaseMatch = selectedUseCase && field.keyFieldInfo && field.keyFieldInfo.includes(selectedUseCase);

  const isAutoExpandedBySearch = searchQuery && hasChildren && field.children.some(child => nodeContainsSearchMatch(child, query));
  const isAutoExpandedByUseCase = selectedUseCase && hasChildren && field.children.some(child => nodeContainsKeyField(child, selectedUseCase));
  const shouldExpand = isManuallyExpanded || isAutoExpandedBySearch || isAutoExpandedByUseCase;

  const selectionClass = isSelected
    ? 'bg-solarized-orange'
    : isDirectSearchMatch || isDirectUseCaseMatch
    ? 'bg-solarized-blue bg-opacity-40'
    : 'hover:bg-solarized-base01';

  if ((searchQuery && !nodeContainsSearchMatch(field, query)) || (selectedUseCase && !nodeContainsKeyField(field, selectedUseCase))) {
    return null;
  }

  return (
    <div className="ml-6 my-1">
      <div
        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-150 ${selectionClass}`}
        onClick={() => {
          // --- ONCLICK CHANGE IS HERE ---
          // Pass the generated path string on select
          onSelect(field, currentPath.join('.'));
          if (hasChildren) {
            setIsManuallyExpanded(!isManuallyExpanded);
          }
        }}
      >
        {hasChildren ? <ArrowIcon isExpanded={shouldExpand} /> : <div className="w-5 h-5" />}
        <div className="ml-2 flex flex-wrap items-baseline gap-x-2">
          <span className={`font-mono text-lg ${isSelected ? 'text-solarized-base03' : 'text-solarized-cyan'}`}>{field.name}</span>
          {field.type && (
            <div className="flex items-baseline gap-x-2">
              <span className={`text-sm font-light ${isSelected ? 'text-solarized-base03' : 'text-solarized-base00'}`}>({field.type})</span>
              {field.repeated && (
                <span className={`text-xs font-mono ${isSelected ? 'text-solarized-base03' : 'text-solarized-base01'}`}>[repeated]</span>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {shouldExpand && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-l border-solarized-base01"
          >
            {field.children.map((child, index) => (
              <UdmField
                key={`${field.name}-${child.name}-${index}`}
                field={child}
                // --- PASSING PATH TO CHILDREN ---
                path={currentPath}
                selectedField={selectedField}
                searchQuery={isManuallyExpanded ? '' : searchQuery}
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