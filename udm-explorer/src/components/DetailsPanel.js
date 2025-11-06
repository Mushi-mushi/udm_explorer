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

    const firstSegment = remainingParts[0]?.name.toLowerCase();
    const restOfPath = pathString.substring(pathString.indexOf('.') + 1);

    if(remainingParts.length > 1){
      return `event.idm.read_only_udm.${restOfPath}`;
    }
    return `event.idm.read_only_udm.${firstSegment}`;
  };

  const formatRawUdmPath = (pathArray) => {
    if (!pathArray || pathArray.length < 2) return '';
    const remainingParts = pathArray.slice(1);
    let pathString = remainingParts.map(p => p.name).join('.');

    const firstSegment = remainingParts[0]?.name.toLowerCase();
    const restOfPath = pathString.substring(pathString.indexOf('.') + 1);

    if(remainingParts.length > 1){
      return `${firstSegment}.${restOfPath}`;
    }
    return firstSegment;
  };

  const formattedPath = formatPath(fullPathArray);
  const rawUdmPath = formatRawUdmPath(fullPathArray);

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

    if (isNestedInRepeated) {
        let pathForMethod1 = '[event][idm][read_only_udm][udm]';
        let isFirstRepeatedFound_M1 = false;
        fullPathArray.slice(1).forEach((segment, index) => {
            const segmentName = index === 0 ? segment.name.toLowerCase() : segment.name;
            pathForMethod1 += `[${segmentName}]`;
            if (segment.repeated && !isFirstRepeatedFound_M1) {
                pathForMethod1 += '[0]';
                isFirstRepeatedFound_M1 = true;
            }
        });

        let pathSegmentsForParent = [];
        let relativePathSegments = [];
        let isFirstRepeatedFound_M2 = false;
        for (const segment of fullPathArray.slice(1)) {
            if (isFirstRepeatedFound_M2) {
                relativePathSegments.push(segment.name);
            } else {
                pathSegmentsForParent.push(segment.name);
            }
            if (segment.repeated) {
                isFirstRepeatedFound_M2 = true;
            }
        }
        if (pathSegmentsForParent.length > 0) {
            pathSegmentsForParent[0] = pathSegmentsForParent[0].toLowerCase();
        }
        const pathForMethod2 = 'event.idm.read_only_udm.' + pathSegmentsForParent.join('.');
        const relativePath = relativePathSegments.join('.');

        const nestedFilterTemplate = `
# To map a field inside a repeated object, you have two main patterns.

# METHOD 1: 'replace' with Bracket Notation (for one-off mappings)
# Use this when you are NOT in a loop. NOTE: Bracket notation is required.
mutate {
  replace => { "${pathForMethod1}" => "%{${sourceFieldPlaceholder}}" }
}

# METHOD 2: 'merge' Pattern (for loops or cleaner objects)
# Use this inside a 'for' loop to add a complete object to the array.
mutate {
  replace => {
    "temp_object.${relativePath}" => "%{${sourceFieldPlaceholder}}"
    # ... add other fields for this object to "temp_object" ...
  }
}
mutate {
  merge => { "${pathForMethod2}" => "temp_object" }
}`;
        displayLogstashMapping = nestedFilterTemplate.trim();

    } else if (field.repeated) {
      let repeatedFilterTemplate = `# Mapping to a repeated field requires knowing the source format. Choose one option below.

# --- OPTION 1: Source is a single, delimited string ---
# (e.g., source_field: "val1,val2,val3")
# 1. Use 'split' to turn the string into an array of strings.
mutate {
  split => { "${sourceFieldPlaceholder}" => "," }
}`;

      if (fieldType.startsWith('int') || fieldType.startsWith('uint') || fieldType.startsWith('float') || fieldType.startsWith('double')) {
        const numericType = (fieldType.startsWith('int') || fieldType.startsWith('uint')) ? 'integer' : 'float';
        repeatedFilterTemplate += `

# 2. Since 'convert' doesn't work on array elements in Gostash,
#    we must loop through the array to convert each item.
for index, value in ${sourceFieldPlaceholder} {
  mutate {
    # a. Create a temporary field for the current value.
    replace => { "temp_value" => "%{value}" }
    # b. Convert the temporary field to the correct numeric type.
    convert => { "temp_value" => "${numericType}" }
    # c. Merge the converted value into a new temporary array.
    merge   => { "temp_converted_array" => "temp_value" }
  }
}

# 3. Rename the new array of numbers to the final UDM field.
mutate {
  rename => { "temp_converted_array" => "event.idm.read_only_udm.${rawUdmPath}" }
}

# 4. Clean up the original source and temporary fields.
mutate {
  remove_field => [ "${sourceFieldPlaceholder}", "temp_value" ]
}`;
      } else { // For repeated strings
        repeatedFilterTemplate += `

# 2. Finally, rename the prepared array to the UDM field.
mutate {
  rename => { "${sourceFieldPlaceholder}" => "event.idm.read_only_udm.${rawUdmPath}" }
}`;
      }

      repeatedFilterTemplate += `

# --- OPTION 2: Source is a single value to be wrapped in an array ---
# (e.g., source_ip: "192.168.1.1" → ip: ["192.168.1.1"])
# Build a temp array with bracket notation, then rename.
mutate {
  replace => { "temp_${field.name}[0]" => "%{${sourceFieldPlaceholder}}" }
}
mutate {
  rename => { "temp_${field.name}" => "event.idm.read_only_udm.${rawUdmPath}" }
}
mutate {
  remove_field => [ "${sourceFieldPlaceholder}" ]
}

# --- OPTION 3: Source is multiple, separate fields ---
# (e.g., source_A: "val1", source_B: "val2")
# Build a temporary array with multiple values, then rename.
mutate {
  replace => { "temp_array[0]" => "%{source_field_A}" }
  replace => { "temp_array[1]" => "%{source_field_B}" }
}
mutate {
  rename => { "temp_array" => "event.idm.read_only_udm.${rawUdmPath}" }
}

# --- OPTION 4: Source is already a correctly typed array ---
# This is the simplest case. Just rename the field.
# mutate {
#   rename => { "${sourceFieldPlaceholder}" => "event.idm.read_only_udm.${rawUdmPath}" }
# }`;
      displayLogstashMapping = repeatedFilterTemplate;

    } else {
      const udmPathString = `event.idm.read_only_udm.${rawUdmPath}`;
      if (fieldType.includes('timestamp')) {
        displayLogstashMapping = `date {\n  match => ["${field.name}", "ISO8601"]\n  target => "${udmPathString}"\n}`;
      } else if (fieldType === 'string') {
        displayLogstashMapping = `mutate {\n  rename => { "${sourceFieldPlaceholder}" => "${udmPathString}" }\n}`;
      } else if (fieldType.startsWith('int') || fieldType.startsWith('uint') || fieldType.startsWith('float') || fieldType.startsWith('double')) {
        const numericType = (fieldType.startsWith('int') || fieldType.startsWith('uint')) ? 'integer' : 'float';
        displayLogstashMapping = `mutate {\n  convert => { "${sourceFieldPlaceholder}" => "${numericType}" }\n}\nmutate {\n  rename => { "${sourceFieldPlaceholder}" => "${udmPathString}" }\n}`;
      } else if (fieldType === 'bool' || fieldType === 'boolean') {
        displayLogstashMapping = `if [${sourceFieldPlaceholder}] in ["true", "True", "TRUE", "yes", "1"] {\n  mutate {\n    replace => { "${udmPathString}" => "true" }\n  }\n} else if [${sourceFieldPlaceholder}] in ["false", "False", "FALSE", "no", "0"] {\n  mutate {\n    replace => { "${udmPathString}" => "false" }\n  }\n}\nmutate {\n  convert => { "${udmPathString}" => "boolean" }\n}`;
      } else if (fieldType === 'enum' && selectedEnumValue) {
        displayLogstashMapping = `mutate {\n  # Statically assign the selected value.\n  replace => { "${udmPathString}" => "${selectedEnumValue}" }\n}`;
      }
    }
  }

  const handleLogstashCopyClick = () => {
    if (!displayLogstashMapping) return;
    navigator.clipboard.writeText(displayLogstashMapping).then(() => {
      setIsLogstashCopied(true);
      setTimeout(() => setIsLogstashCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy Logstash mapping: ', err);
    });
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
            <div>
              {formattedPath && (
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-solarized-base00 font-mono text-sm break-all">{formattedPath}</p>
                  <button
                    onClick={handlePathCopyClick}
                    className="bg-solarized-base01 text-solarized-base1 text-xs font-mono px-2 py-1 rounded-md hover:bg-solarized-cyan hover:text-solarized-base03 transition-colors duration-200 flex-shrink-0"
                  >
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
                  <h3 className="text-xl font-bold text-solarized-base1">Gostash Mapping</h3>
                  <button
                    onClick={handleLogstashCopyClick}
                    className="bg-solarized-base01 text-solarized-base1 text-xs font-mono px-2 py-1 rounded-md hover:bg-solarized-cyan hover:text-solarized-base03 transition-colors duration-200 flex-shrink-0"
                  >
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