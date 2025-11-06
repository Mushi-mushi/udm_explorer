// src/components/DetailsPanel.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DetailsPanel = ({ field, fullPathArray }) => {
  const [isPathCopied, setIsPathCopied] = useState(false);
  const [isLogstashCopied, setIsLogstashCopied] = useState(false);
  const [selectedEnumValue, setSelectedEnumValue] = useState(null);

  useEffect(() => {
    if (field?.type?.toLowerCase() === 'enum' && field.enumValues?.length > 0) {
      setSelectedEnumValue(field.enumValues[0]);
    } else {
      setSelectedEnumValue(null);
    }
  }, [field]);

  const formatPath = (pathArray) => {
    if (!pathArray || pathArray.length < 2) return '';
    const remainingParts = pathArray.slice(1);
    let pathString = remainingParts.map(p => p.name).join('.');
    
    // Lowercase the very first part of the path string for display
    const firstSegment = remainingParts[0]?.name.toLowerCase();
    const restOfPath = pathString.substring(pathString.indexOf('.') + 1);
    
    if(remainingParts.length > 1){
      return `${firstSegment}.${restOfPath}`;
    }
    return firstSegment;
  };

  const formattedPath = formatPath(fullPathArray);

  const handlePathCopyClick = () => {
    if (!formattedPath) return;
    navigator.clipboard.writeText(formattedPath).then(() => {
      setIsPathCopied(true);
      setTimeout(() => setIsPathCopied(false), 2000);
    }).catch(err => console.error('Failed to copy path: ', err));
  };

  let displayLogstashMapping = field?.logstashMapping;

  if (field && !displayLogstashMapping && field.type) {
    const fieldType = field.type.toLowerCase();
    const sourceFieldPlaceholder = `source_${field.name}_field`;

    const parentPath = fullPathArray ? fullPathArray.slice(0, -1) : [];
    const isNestedInRepeated = parentPath.some(segment => segment.repeated);

    // --- A. Handle fields nested in REPEATED objects (Special Case) ---
    if (isNestedInRepeated) {
        let logstashTargetPath = '[udm]';
        let isFirstRepeatedFound = false;

        fullPathArray.slice(1).forEach((segment, index) => {
            // FIX: Lowercase the first segment name (e.g., "Event" -> "event")
            const segmentName = index === 0 ? segment.name.toLowerCase() : segment.name;
            logstashTargetPath += `[${segmentName}]`;
            
            // Add the [0] index immediately after the first repeated parent
            if (segment.repeated && !isFirstRepeatedFound) {
                logstashTargetPath += '[0]';
                isFirstRepeatedFound = true;
            }
        });
        
        const nestedFilterTemplate = `mutate {
  # NOTE: Bracket notation is required here to target an array element.
  # This creates an array with one object and sets the nested field,
  # which is a common pattern for parsing single, related entities.
  add_field => { "${logstashTargetPath}" => "%{${sourceFieldPlaceholder}}" }
}`;
        displayLogstashMapping = nestedFilterTemplate;

    // --- B. Handle all other fields ---
    } else if (field.repeated) {
      if (fieldType === 'string') {
        const splitFilterTemplate = `mutate {
  # This splits a source string (e.g., "value1,value2") into an array.
  split => { "${sourceFieldPlaceholder}" => "," }
}
mutate {
  # Then, rename the new array to the UDM field.
  rename => { "${sourceFieldPlaceholder}" => "udm.${formattedPath}" }
}`;
        displayLogstashMapping = splitFilterTemplate;
      } else {
        const renameFilterTemplate = `mutate {
  # This assumes the source field is already a correctly typed array.
  rename => { "${sourceFieldPlaceholder}" => "udm.${formattedPath}" }
}`;
        displayLogstashMapping = renameFilterTemplate;
      }
    } else {
      const udmPathString = `udm.${formattedPath}`;
      if (fieldType.includes('timestamp')) {
        displayLogstashMapping = `date {\n  match => ["${field.name}", "ISO8601"]\n  target => "${udmPathString}"\n}`;
      } else if (fieldType === 'string') {
        displayLogstashMapping = `mutate {\n  rename => { "${sourceFieldPlaceholder}" => "${udmPathString}" }\n}`;
      } else if (fieldType.startsWith('int') || fieldType.startsWith('uint') || fieldType.startsWith('float') || fieldType.startsWith('double')) {
        const numericType = (fieldType.startsWith('int') || fieldType.startsWith('uint')) ? 'integer' : 'float';
        displayLogstashMapping = `mutate {\n  convert => { "${sourceFieldPlaceholder}" => "${numericType}" }\n}\nmutate {\n  rename => { "${sourceFieldPlaceholder}" => "${udmPathString}" }\n}`;
      } else if (fieldType === 'bool' || fieldType === 'boolean') {
        displayLogstashMapping = `if [${sourceFieldPlaceholder}] in ["true", "True", "TRUE", "yes", "1"] {\n  mutate {\n    add_field => { "${udmPathString}" => "true" }\n  }\n} else if [${sourceFieldPlaceholder}] in ["false", "False", "FALSE", "no", "0"] {\n  mutate {\n    add_field => { "${udmPathString}" => "false" }\n  }\n}\nmutate {\n  convert => { "${udmPathString}" => "boolean" }\n}`;
      } else if (fieldType === 'enum' && selectedEnumValue) {
        displayLogstashMapping = `mutate {\n  # Statically assign the selected value.\n  add_field => { "${udmPathString}" => "${selectedEnumValue}" }\n}`;
      }
    }
  }

  const handleLogstashCopyClick = () => {
    if (!displayLogstashMapping) return;
    navigator.clipboard.writeText(displayLogstashMapping).then(() => {
      setIsLogstashCopied(true);
      setTimeout(() => setIsLogstashCopied(false), 2000);
    }).catch(err => console.error('Failed to copy Logstash mapping: ', err));
  };
  
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
          <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-solarized-base00">
            Select a field to see its details.
          </motion.div>
        ) : (
          <motion.div key={field.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-6">
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

            {displayLogstashMapping && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-solarized-base1">Logstash Mapping</h3>
                  <button onClick={handleLogstashCopyClick} className="bg-solarized-base01 text-solarized-base1 text-xs font-mono px-2 py-1 rounded-md hover:bg-solarized-cyan hover:text-solarized-base03 transition-colors duration-200 flex-shrink-0">
                    {isLogstashCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-solarized-base03 text-solarized-blue p-4 rounded-md text-sm overflow-x-auto">
                  <code>{displayLogstashMapping}</code>
                </pre>
              </div>
            )}

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