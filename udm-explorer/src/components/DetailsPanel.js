// src/components/DetailsPanel.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DetailsPanel = ({ field }) => {
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
            {/* --- Main Details Section --- */}
            <div>
              <h2 className="font-mono text-2xl text-solarized-cyan">{field.name}</h2>
              {field.type && (
                <p className="text-solarized-base00 mt-2">Type: {field.type}</p>
              )}
              <p className="text-solarized-base0 mt-4 break-normal">{field.description}</p>
            </div>

            {/* --- Key Field Use Cases Section (Conditional) --- */}
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

            {/* --- Logstash Mapping Section (Conditional) --- */}
            {field.logstashMapping && (
              <div>
                <h3 className="text-xl font-bold text-solarized-base1 mb-2">Logstash Mapping</h3>
                <pre className="bg-solarized-base03 text-solarized-blue p-4 rounded-md text-sm overflow-x-auto">
                  <code>{field.logstashMapping}</code>
                </pre>
              </div>
            )}

            {/* --- Enum Values Section (Conditional) --- */}
            {field.enumValues && field.enumValues.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-solarized-base1 mb-3">Acceptable Values</h3>
                <div className="flex flex-wrap gap-2">
                  {field.enumValues.map(value => (
                    <span key={value} className="bg-solarized-base01 text-solarized-base03 font-mono text-xs px-2 py-1 rounded-full">
                      {value}
                    </span>
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