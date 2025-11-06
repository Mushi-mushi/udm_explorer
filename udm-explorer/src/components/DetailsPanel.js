// src/components/DetailsPanel.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DetailsPanel = ({ field, fullPath }) => {
  // --- States for copy buttons and interactivity ---
  const [isPathCopied, setIsPathCopied] = useState(false);
  const [isLogstashCopied, setIsLogstashCopied] = useState(false);
  const [selectedEnumValue, setSelectedEnumValue] = useState(null);

  // --- MODIFIED: Effect to auto-select the FIRST enum value on field change ---
  useEffect(() => {
    // If the new field is an enum with values, default to the first one.
    if (field?.type?.toLowerCase() === 'enum' && field.enumValues?.length > 0) {
      setSelectedEnumValue(field.enumValues[0]);
    } else {
      // Otherwise, clear the selection.
      setSelectedEnumValue(null);
    }
  }, [field]); // Reruns whenever the selected 'field' prop changes.

  // --- (formatPath and handlePathCopyClick functions are unchanged) ---
  const formatPath = (path) => {
    if (!path) return '';
    const parts = path.split('.');
    if (parts.length > 1) {
      const remainingParts = parts.slice(1);
      remainingParts[0] = remainingParts[0].toLowerCase();
      return remainingParts.join('.');
    }
    return path.toLowerCase();
  };

  const formattedPath = formatPath(fullPath);

  const handlePathCopyClick = () => {
    if (!formattedPath) return;
    navigator.clipboard.writeText(formattedPath).then(() => {
      setIsPathCopied(true);
      setTimeout(() => setIsPathCopied(false), 2000);
    }).catch(err => console.error('Failed to copy path: ', err));
  };

  // --- Dynamic Gostash Mapping Logic ---
  let displayLogstashMapping = field?.logstashMapping; // Prioritize mapping from JSON

  if (field && !displayLogstashMapping && field.type) {
    const fieldType = field.type.toLowerCase();
    const udmPathString = `udm.${formattedPath}`;
    const sourceFieldPlaceholder = `source_${field.name}_field`;

    if (field.repeated) {
      if (fieldType === 'string') {
        const splitFilterTemplate = `mutate {
  # This splits a source string (e.g., "value1,value2") into an array.
  split => { "${sourceFieldPlaceholder}" => "," }
}
mutate {
  # Then, rename the new array to the UDM field.
  rename => { "${sourceFieldPlaceholder}" => "${udmPathString}" }
}`;
        displayLogstashMapping = splitFilterTemplate;
      } else {
        const renameFilterTemplate = `mutate {
  # This assumes the source field is already a correctly typed array.
  rename => { "${sourceFieldPlaceholder}" => "${udmPathString}" }
}`;
        displayLogstashMapping = renameFilterTemplate;
      }
    } else {
      if (fieldType.includes('timestamp')) {
        const dateFilterTemplate = `date {
  match => ["${field.name}", "ISO8601"]
  target => "${udmPathString}"
}`;
        displayLogstashMapping = dateFilterTemplate;
      } else if (fieldType === 'string') {
        const mutateFilterTemplate = `mutate {
  rename => { "${sourceFieldPlaceholder}" => "${udmPathString}" }
}`;
        displayLogstashMapping = mutateFilterTemplate;
      } else if (fieldType.startsWith('int') || fieldType.startsWith('uint') || fieldType.startsWith('float') || fieldType.startsWith('double')) {
        const numericType = (fieldType.startsWith('int') || fieldType.startsWith('uint')) ? 'integer' : 'float';
        const numericFilterTemplate = `mutate {
  convert => { "${sourceFieldPlaceholder}" => "${numericType}" }
}
mutate {
  rename => { "${sourceFieldPlaceholder}" => "${udmPathString}" }
}`;
        displayLogstashMapping = numericFilterTemplate;
      } else if (fieldType === 'bool' || fieldType === 'boolean') {
        const booleanFilterTemplate = `if [${sourceFieldPlaceholder}] in ["true", "True", "TRUE", "yes", "1"] {
  mutate {
    add_field => { "${udmPathString}" => "true" }
  }
} else if [${sourceFieldPlaceholder}] in ["false", "False", "FALSE", "no", "0"] {
  mutate {
    add_field => { "${udmPathString}" => "false" }
  }
}
mutate {
  convert => { "${udmPathString}" => "boolean" }
}`;
        displayLogstashMapping = booleanFilterTemplate;
      } 
      // --- MODIFIED: Enum logic is now much simpler ---
      else if (fieldType === 'enum' && selectedEnumValue) {
        // Always generate a static assignment based on the currently selected enum value.
        const staticAssignmentTemplate = `mutate {
  add_field => { "${udmPathString}" => "${selectedEnumValue}" }
}`;
        displayLogstashMapping = staticAssignmentTemplate;
      }
    }
  }

  // --- (handleLogstashCopyClick is unchanged) ---
  const handleLogstashCopyClick = () => {
    if (!displayLogstashMapping) return;
    navigator.clipboard.writeText(displayLogstashMapping).then(() => {
      setIsLogstashCopied(true);
      setTimeout(() => setIsLogstashCopied(false), 2000);
    }).catch(err => console.error('Failed to copy Gostash Mapping: ', err));
  };
  
  // --- MODIFIED: Enum click handler just sets the value ---
  const handleEnumValueSelect = (value) => {
    setSelectedEnumValue(value);
  };

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="bg-solarized-base02 rounded-xl p-6 shadow-lg sticky top-8"
    >
      <AnimatePresence mode="wait">
        {!field ? (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-solarized-base00"
          >
            Select a field to see its details.
          </motion.div>
        ) : (
          <motion.div
            key={field.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* --- Main Details Section (Unchanged) --- */}
            <div>
              {formattedPath && (
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-solarized-base00 font-mono text-sm break-all">{formattedPath}</p>
                  <button onClick={handlePathCopyClick} className="bg-solarized-base01 text-solarized-base1 text-xs font-mono px-2 py-1 rounded-md hover:bg-solarized-cyan hover:text-solarized-base03 transition-colors duration-200 flex-shrink-0">
                    {isPathCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
              <h2 className="font-mono text-2xl text-solarized-cyan">{field.name}</h2>
              {field.type && (<p className="text-solarized-base00 mt-2">Type: {field.type}</p>)}
              <p className="text-solarized-base0 mt-4 break-normal">{field.description}</p>
            </div>

            {/* --- Key Field Use Cases Section (No Changes) --- */}
            {field.keyFieldInfo && field.keyFieldInfo.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-solarized-base1 mb-3">Key Field Use Cases</h3>
                <div className="flex flex-wrap gap-2">
                  {field.keyFieldInfo.map(useCase => (
                    <span key={useCase} className="bg-solarized-cyan text-solarized-base03 font-mono text-xs px-2 py-1 rounded-full">
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* --- Gostash Mapping Section (Unchanged) --- */}
            {displayLogstashMapping && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-solarized-base1">Gostash Mapping</h3>
                  <button onClick={handleLogstashCopyClick} className="bg-solarized-base01 text-solarized-base1 text-xs font-mono px-2 py-1 rounded-md hover:bg-solarized-cyan hover:text-solarized-base03 transition-colors duration-200 flex-shrink-0">
                    {isLogstashCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-solarized-base03 text-solarized-blue p-4 rounded-md text-sm overflow-x-auto">
                  <code>{displayLogstashMapping}</code>
                </pre>
              </div>
            )}

            {/* --- Enum Values Section (Unchanged, but now drives interactive logic) --- */}
            {field.enumValues && field.enumValues.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-solarized-base1 mb-3">Acceptable Values</h3>
                <div className="flex flex-wrap gap-2">
                  {field.enumValues.map(value => (
                    <button
                      key={value}
                      onClick={() => handleEnumValueSelect(value)}
                      className={`font-mono text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                        selectedEnumValue === value
                          ? 'bg-solarized-cyan text-solarized-base03'
                          : 'bg-solarized-base01 text-solarized-base03 hover:bg-solarized-base00'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DetailsPanel;