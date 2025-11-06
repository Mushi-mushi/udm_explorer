// src/components/ParserGenerator.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import UDM schemas to check field properties
import udmEvent from '../data/udm-event.json';
import udmEntity from '../data/udm-entity.json';
import udmMetadata from '../data/udm-metadata.json';
import udmEntityMetadata from '../data/udm-entity-metadata.json';
import udmNoun from '../data/udm-noun.json';
import udmSecurityResult from '../data/udm-security_result.json';
import udmNetwork from '../data/udm-network.json';
import udmLocation from '../data/udm-location.json';
import udmLatLng from '../data/udm-latlng.json';
import udmProcess from '../data/udm-process.json';
import udmAsset from '../data/udm-asset.json';
import udmAttackDetails from '../data/udm-attackdetails.json';
import udmTactic from '../data/udm-tactic.json';
import udmTechnique from '../data/udm-technique.json';
import udmLabel from '../data/udm-label.json';
import udmFile from '../data/udm-file.json';
import udmEntityRisk from '../data/udm-entityrisk.json';
import udmRiskDelta from '../data/udm-riskdelta.json';
import udmResource from '../data/udm-resource.json';
import udmAttribute from '../data/udm-attribute.json';
import udmVerdictInfo from '../data/udm-verdictinfo.json';
import udmVerdictType from '../data/udm-verdicttype.json';
import udmThreatVerdict from '../data/udm-threatverdict.json';
import udmVerdictResponse from '../data/udm-verdictresponse.json';
import udmIoCStatsType from '../data/udm-iocstatstype.json';
import udmProductConfidence from '../data/udm-productconfidence.json';
import udmIoCStats from '../data/udm-iocstats.json';
import udmCloud from '../data/udm-cloud.json';
import udmGroup from '../data/udm-group.json';
import udmPermission from '../data/udm-permission.json';
import udmPdfInfo from '../data/udm-pdfinfo.json';
import udmPeFileMetadata from '../data/udm-pefilemetadata.json';
import udmFileMetadataPE from '../data/udm-filemetadatape.json';
import udmFileMetadataSignatureInfo from '../data/udm-filemetadatasignatureinfo.json';
import udmSignerInfo from '../data/udm-signerinfo.json';
import udmX509 from '../data/udm-x509.json';
import udmSignatureInfo from '../data/udm-signatureinfo.json';
import udmFileMetadataCodesign from '../data/udm-filemetadatacodesign.json';
import udmRole from '../data/udm-role.json';
import udmInvestigation from '../data/udm-investigation.json';
import udmRegistry from '../data/udm-registry.json';
import udmUser from '../data/udm-user.json';
import udmTimeOff from '../data/udm-timeoff.json';
import udmMetric from '../data/udm-metric.json';

// Create a comprehensive type map for looking up nested types
const typeMap = {
  'Metadata': udmMetadata,
  'EntityMetadata': udmEntityMetadata,
  'Noun': udmNoun,
  'SecurityResult': udmSecurityResult,
  'Network': udmNetwork,
  'Location': udmLocation,
  'LatLng': udmLatLng,
  'Process': udmProcess,
  'Asset': udmAsset,
  'AttackDetails': udmAttackDetails,
  'Tactic': udmTactic,
  'Technique': udmTechnique,
  'Label': udmLabel,
  'File': udmFile,
  'EntityRisk': udmEntityRisk,
  'RiskDelta': udmRiskDelta,
  'Resource': udmResource,
  'Attribute': udmAttribute,
  'VerdictInfo': udmVerdictInfo,
  'VerdictType': udmVerdictType,
  'ThreatVerdict': udmThreatVerdict,
  'VerdictResponse': udmVerdictResponse,
  'IoCStatsType': udmIoCStatsType,
  'ProductConfidence': udmProductConfidence,
  'IoCStats': udmIoCStats,
  'Cloud': udmCloud,
  'Group': udmGroup,
  'Permission': udmPermission,
  'PdfInfo': udmPdfInfo,
  'PeFileMetadata': udmPeFileMetadata,
  'FileMetadataPE': udmFileMetadataPE,
  'FileMetadataSignatureInfo': udmFileMetadataSignatureInfo,
  'SignerInfo': udmSignerInfo,
  'X509': udmX509,
  'SignatureInfo': udmSignatureInfo,
  'FileMetadataCodesign': udmFileMetadataCodesign,
  'Role': udmRole,
  'Investigation': udmInvestigation,
  'Registry': udmRegistry,
  'User': udmUser,
  'TimeOff': udmTimeOff,
  'Metric': udmMetric,
};

const ParserGenerator = () => {
  const sampleJson = '{"timestamp": "2024-01-01T12:00:00Z", "src_ip": "192.168.1.1", "event_type": "GENERIC_EVENT", "risk_score" : "100"}';
  const [jsonInput, setJsonInput] = useState(sampleJson);
  const [parsedFields, setParsedFields] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [parseError, setParseError] = useState('');
  const [generatedParser, setGeneratedParser] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Extract all fields from JSON object recursively
  const extractFields = (obj, prefix = '') => {
    const fields = [];

    for (const key in obj) {
      const value = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (value === null) {
        fields.push({ path, type: 'null', value: null });
      } else if (Array.isArray(value)) {
        fields.push({ path, type: 'array', value: value });
        // Also add first element if it's an object
        if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          const nestedFields = extractFields(value[0], `${path}[0]`);
          fields.push(...nestedFields);
        }
      } else if (typeof value === 'object') {
        fields.push({ path, type: 'object', value: value });
        const nestedFields = extractFields(value, path);
        fields.push(...nestedFields);
      } else {
        fields.push({
          path,
          type: typeof value,
          value: value
        });
      }
    }

    return fields;
  };

  // Parse JSON input
  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const fields = extractFields(parsed);
      // Filter to only show leaf fields (actual values, not parent objects)
      const leafFields = fields.filter(f => f.type !== 'object');
      setParsedFields(leafFields);
      setParseError('');
      setMappings([]);
      setGeneratedParser('');
    } catch (error) {
      setParseError(`Invalid JSON: ${error.message}`);
      setParsedFields([]);
      setMappings([]);
    }
  };

  // Add a new mapping
  const handleAddMapping = (sourcePath) => {
    if (!mappings.find(m => m.sourcePath === sourcePath)) {
      setMappings([...mappings, {
        sourcePath,
        udmPath: '',
        sourceType: parsedFields.find(f => f.path === sourcePath)?.type || 'string'
      }]);
    }
  };

  // Remove a mapping
  const handleRemoveMapping = (sourcePath) => {
    setMappings(mappings.filter(m => m.sourcePath !== sourcePath));
  };

  // Update UDM path for a mapping
  const handleUpdateUdmPath = (sourcePath, udmPath) => {
    setMappings(mappings.map(m =>
      m.sourcePath === sourcePath ? { ...m, udmPath } : m
    ));
  };

  // Detect UDM field type from path
  const detectUdmType = (udmPath) => {
    const lowerPath = udmPath.toLowerCase();
    if (lowerPath.includes('timestamp') || lowerPath.includes('time')) return 'timestamp';
    if (lowerPath.includes('score') || lowerPath.includes('confidence')) return 'float';
    if (lowerPath.includes('severity_score') || lowerPath.includes('risk_score')) return 'float';
    if (lowerPath.includes('port')) return 'integer';
    if (lowerPath.includes('bytes') || lowerPath.includes('size')) return 'integer';
    if (lowerPath.includes('ip')) return 'string';
    if (lowerPath.includes('email')) return 'string';
    return 'string';
  };

  // Clean UDM path - remove "event.idm.read_only_udm." prefix if present
  const cleanUdmPath = (udmPath) => {
    if (!udmPath) return '';
    // Remove the prefix if it exists
    return udmPath.replace(/^event\.idm\.read_only_udm\./, '');
  };

  // Check if a UDM field is repeated OR nested inside a repeated field
  const isRepeatedField = (udmPath) => {
    if (!udmPath) return false;

    const cleanPath = cleanUdmPath(udmPath);
    const pathParts = cleanPath.split('.');

    // Determine if this is event or entity path
    // If path doesn't start with "event" or "entity", assume event
    let startIndex = 0;
    let currentNode = udmEvent;

    if (pathParts[0] === 'entity') {
      currentNode = udmEntity;
      startIndex = 1;
    } else if (pathParts[0] === 'event') {
      startIndex = 1;
    }

    // Traverse the path - we only care if the FINAL field is repeated
    // Parent repeated fields create different structures (merge into objects)
    for (let i = startIndex; i < pathParts.length; i++) {
      if (!currentNode || !currentNode.children) return false;

      const fieldName = pathParts[i];
      const nextNode = currentNode.children.find(child =>
        child.name.toLowerCase() === fieldName.toLowerCase()
      );

      if (!nextNode) return false;

      // Only check if the FINAL field in the path is repeated
      if (i === pathParts.length - 1) {
        return nextNode.repeated === true;
      }

      // If this node has a type, look it up in the type map to continue traversal
      if (nextNode.type && typeMap[nextNode.type]) {
        currentNode = typeMap[nextNode.type];
      } else {
        currentNode = nextNode;
      }
    }

    return false;
  };

  // Check if a field has a repeated parent in its path
  const hasRepeatedParent = (udmPath) => {
    if (!udmPath) return null;

    const cleanPath = cleanUdmPath(udmPath);
    const pathParts = cleanPath.split('.');

    // Determine if this is event or entity path
    let startIndex = 0;
    let currentNode = udmEvent;

    if (pathParts[0] === 'entity') {
      currentNode = udmEntity;
      startIndex = 1;
    } else if (pathParts[0] === 'event') {
      startIndex = 1;
    }

    // Traverse the path and check if ANY parent field is repeated
    for (let i = startIndex; i < pathParts.length - 1; i++) { // -1 because we don't check the final field
      if (!currentNode || !currentNode.children) return null;

      const fieldName = pathParts[i];
      const nextNode = currentNode.children.find(child =>
        child.name.toLowerCase() === fieldName.toLowerCase()
      );

      if (!nextNode) return null;

      // If this parent is repeated, return info about it
      if (nextNode.repeated === true) {
        return {
          repeatedParent: pathParts.slice(0, i + 1).join('.'),
          relativePath: pathParts.slice(i + 1).join('.')
        };
      }

      // If this node has a type, look it up in the type map to continue traversal
      if (nextNode.type && typeMap[nextNode.type]) {
        currentNode = typeMap[nextNode.type];
      } else {
        currentNode = nextNode;
      }
    }

    return null;
  };

  // Generate Gostash parser
  const generateParser = () => {
    if (mappings.length === 0) {
      setGeneratedParser('# No mappings defined. Add at least one field mapping.');
      return;
    }

    let parser = `# Gostash Parser Configuration
# Generated on ${new Date().toISOString()}

filter {
  # Parse the incoming JSON message
  json {
    source => "message"
    on_error => "error_json_parse_failed"
  }
`;

    // Group mappings by type for better organization
    const simpleMappings = [];
    const numericMappings = [];
    const timestampMappings = [];
    const arrayMappings = [];
    const repeatedMappings = [];
    const nestedInRepeatedMappings = [];

    mappings.forEach(mapping => {
      if (!mapping.udmPath) return;

      const udmType = detectUdmType(mapping.udmPath);
      const isRepeated = isRepeatedField(mapping.udmPath);
      const repeatedParentInfo = hasRepeatedParent(mapping.udmPath);

      // Check if nested inside a repeated parent (highest precedence)
      if (repeatedParentInfo) {
        nestedInRepeatedMappings.push({...mapping, repeatedParentInfo});
      }
      // Check if the UDM field itself is repeated
      else if (isRepeated) {
        repeatedMappings.push(mapping);
      } else if (mapping.sourceType === 'array') {
        arrayMappings.push(mapping);
      } else if (udmType === 'timestamp') {
        timestampMappings.push(mapping);
      } else if (mapping.sourceType === 'number' || udmType === 'integer' || udmType === 'float') {
        numericMappings.push(mapping);
      } else {
        simpleMappings.push(mapping);
      }
    });

    // Generate timestamp mappings
    if (timestampMappings.length > 0) {
      parser += `\n  # Parse timestamp fields\n`;
      timestampMappings.forEach(m => {
        const cleanPath = cleanUdmPath(m.udmPath);
        parser += `  date {
    match => ["${m.sourcePath}", "ISO8601", "UNIX", "UNIX_MS"]
    target => "event.idm.read_only_udm.${cleanPath}"
    on_error => "error_timestamp_parse_failed"
  }
`;
      });
    }

    // Generate numeric conversions (each in its own mutate block)
    if (numericMappings.length > 0) {
      parser += `\n  # Convert and map numeric fields\n`;
      numericMappings.forEach(m => {
        const cleanPath = cleanUdmPath(m.udmPath);
        const udmType = detectUdmType(m.udmPath);
        const convertType = udmType === 'float' ? 'float' : 'integer';
        parser += `  mutate {\n`;
        parser += `    convert => { "${m.sourcePath}" => "${convertType}" }\n`;
        parser += `  }\n`;
        parser += `  mutate {\n`;
        parser += `    rename => { "${m.sourcePath}" => "event.idm.read_only_udm.${cleanPath}" }\n`;
        parser += `  }\n`;
      });
    }

    // Generate simple string mappings (each in its own mutate block)
    if (simpleMappings.length > 0) {
      parser += `\n  # Map string fields\n`;
      simpleMappings.forEach(m => {
        const cleanPath = cleanUdmPath(m.udmPath);
        parser += `  mutate {\n`;
        parser += `    rename => { "${m.sourcePath}" => "event.idm.read_only_udm.${cleanPath}" }\n`;
        parser += `  }\n`;
      });
    }

    // Generate repeated field mappings (UDM fields marked as repeated)
    if (repeatedMappings.length > 0) {
      parser += `\n  # Map to repeated UDM fields\n`;
      repeatedMappings.forEach(m => {
        const cleanPath = cleanUdmPath(m.udmPath);
        parser += `  # Repeated field: ${m.sourcePath} -> event.idm.read_only_udm.${cleanPath}\n`;

        if (m.sourceType === 'array') {
          // Source is already an array, direct rename
          parser += `  # Source is already an array, direct rename\n`;
          parser += `  mutate {\n`;
          parser += `    rename => { "${m.sourcePath}" => "event.idm.read_only_udm.${cleanPath}" }\n`;
          parser += `  }\n`;
        } else {
          // Source is a single value that needs to go into an array
          // Use merge with field name (not value) to create array automatically
          parser += `  # Source is a single value, merge creates array automatically\n`;
          parser += `  mutate {\n`;
          parser += `    merge => { "event.idm.read_only_udm.${cleanPath}" => "${m.sourcePath}" }\n`;
          parser += `  }\n`;
        }
        parser += `\n`;
      });
    }

    // Generate mappings for fields nested inside repeated parents
    if (nestedInRepeatedMappings.length > 0) {
      parser += `\n  # Map fields nested in repeated parent objects\n`;
      nestedInRepeatedMappings.forEach(m => {
        const cleanPath = cleanUdmPath(m.udmPath);
        const {repeatedParent, relativePath} = m.repeatedParentInfo;
        const udmType = detectUdmType(m.udmPath);
        const tempObjName = `temp_${repeatedParent.replace(/\./g, '_')}_obj`;

        parser += `  # Field nested in repeated parent: ${m.sourcePath} -> event.idm.read_only_udm.${cleanPath}\n`;
        parser += `  # Parent '${repeatedParent}' is repeated, so we build an object and merge it\n`;

        // First, build the temp object with the value
        parser += `  mutate {\n`;
        parser += `    replace => { "${tempObjName}.${relativePath}" => "%{${m.sourcePath}}" }\n`;
        parser += `  }\n`;

        // Then handle type conversion on the temp object field if needed
        if (m.sourceType === 'number' || udmType === 'integer' || udmType === 'float') {
          const convertType = udmType === 'float' ? 'float' : 'integer';
          parser += `  mutate {\n`;
          parser += `    convert => { "${tempObjName}.${relativePath}" => "${convertType}" }\n`;
          parser += `  }\n`;
        }

        parser += `  mutate {\n`;
        parser += `    merge => { "event.idm.read_only_udm.${repeatedParent}" => "${tempObjName}" }\n`;
        parser += `  }\n`;
        parser += `  mutate {\n`;
        parser += `    remove_field => [ "${m.sourcePath}", "${tempObjName}" ]\n`;
        parser += `  }\n`;
        parser += `\n`;
      });
    }

    // Generate array mappings
    if (arrayMappings.length > 0) {
      parser += `\n  # Handle array fields\n`;
      arrayMappings.forEach(m => {
        const cleanPath = cleanUdmPath(m.udmPath);
        parser += `  # Array field: ${m.sourcePath} -> event.idm.read_only_udm.${cleanPath}
  # Note: Review the source array structure and adjust as needed
  if [${m.sourcePath}] {
    mutate {
      rename => { "${m.sourcePath}" => "event.idm.read_only_udm.${cleanPath}" }
    }
  }
`;
      });
    }

    // Add finalization
    parser += `
  # Finalize the event structure
  mutate {
    merge => { "@output" => "event" }
  }

  # Clean up temporary fields
  mutate {
    remove_field => ["message"]
  }
}
`;

    setGeneratedParser(parser);
  };

  const handleCopyParser = () => {
    navigator.clipboard.writeText(generatedParser).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error('Failed to copy parser: ', err));
  };

  const mappingExists = (sourcePath) => {
    return mappings.some(m => m.sourcePath === sourcePath);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="bg-solarized-base02 rounded-xl p-6 shadow-lg">
        <h2 className="text-3xl font-bold text-solarized-cyan mb-2">Gostash Parser Generator (Work in progress)</h2>
        <p className="text-solarized-base0">
          Paste a sample JSON log event, map fields to UDM paths, and generate a complete Gostash parser configuration.
        </p>
      </div>

      {/* JSON Input Section */}
      <div className="bg-solarized-base02 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-solarized-base1 mb-3">Step 1: Paste Sample JSON Event</h3>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{"timestamp": "2024-01-01T12:00:00Z", "src_ip": "192.168.1.1", "event_type": "login"}'
          className="w-full h-48 p-4 bg-solarized-base03 text-solarized-base1 font-mono text-sm rounded-lg border-2 border-transparent focus:outline-none focus:border-solarized-cyan resize-y"
        />

        {parseError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-solarized-red bg-opacity-20 border border-solarized-red rounded-lg text-solarized-red text-sm"
          >
            {parseError}
          </motion.div>
        )}

        <button
          onClick={handleParseJson}
          className="mt-4 px-6 py-2 bg-solarized-cyan text-solarized-base03 font-semibold rounded-full hover:bg-solarized-blue transition-colors"
        >
          Parse JSON
        </button>
      </div>

      {/* Parsed Fields & Mapping Section */}
      <AnimatePresence>
        {parsedFields.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-solarized-base02 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-solarized-base1 mb-3">Step 2: Map Fields to UDM</h3>
            <p className="text-solarized-base00 mb-4 text-sm">
              Click "Add Mapping" to map source fields to UDM paths. Enter the UDM path starting with "udm." (e.g., "udm.principal.ip").
              The generator will automatically place it under "event.idm.read_only_udm.*".
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {parsedFields.map((field, idx) => {
                const isMapped = mappingExists(field.path);

                return (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-solarized-base03 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-mono text-solarized-cyan text-sm break-all">
                          {field.path}
                        </span>
                        <span className="text-xs text-solarized-base00">
                          ({field.type})
                        </span>
                      </div>
                      <div className="text-xs text-solarized-base01 font-mono break-all">
                        Value: {JSON.stringify(field.value)}
                      </div>

                      {isMapped && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={mappings.find(m => m.sourcePath === field.path)?.udmPath || ''}
                            onChange={(e) => handleUpdateUdmPath(field.path, e.target.value)}
                            placeholder="event.idm.read_only_udm.***"
                            className="w-full px-3 py-1.5 bg-solarized-base02 text-solarized-base1 text-sm rounded border-2 border-solarized-base01 focus:outline-none focus:border-solarized-cyan"
                          />
                        </div>
                      )}
                    </div>

                    {!isMapped ? (
                      <button
                        onClick={() => handleAddMapping(field.path)}
                        className="px-3 py-1 bg-solarized-green text-solarized-base03 text-sm font-semibold rounded hover:bg-solarized-cyan transition-colors flex-shrink-0"
                      >
                        Add Mapping
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemoveMapping(field.path)}
                        className="px-3 py-1 bg-solarized-red text-solarized-base03 text-sm font-semibold rounded hover:bg-solarized-orange transition-colors flex-shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {mappings.length > 0 && (
              <button
                onClick={generateParser}
                className="mt-6 px-6 py-2 bg-solarized-blue text-solarized-base03 font-semibold rounded-full hover:bg-solarized-cyan transition-colors"
              >
                Generate Parser ({mappings.length} mapping{mappings.length !== 1 ? 's' : ''})
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Parser Section */}
      <AnimatePresence>
        {generatedParser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-solarized-base02 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-solarized-base1">Step 3: Generated Gostash Parser</h3>
              <button
                onClick={handleCopyParser}
                className="px-4 py-2 bg-solarized-cyan text-solarized-base03 text-sm font-semibold rounded-full hover:bg-solarized-blue transition-colors"
              >
                {isCopied ? 'Copied!' : 'Copy Parser'}
              </button>
            </div>

            <pre className="bg-solarized-base03 text-solarized-blue p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
              <code>{generatedParser}</code>
            </pre>

            <div className="mt-4 p-4 bg-solarized-yellow bg-opacity-10 border border-solarized-yellow rounded-lg">
              <h4 className="text-solarized-yellow font-semibold mb-2">⚠️ Important Notes:</h4>
              <ul className="text-solarized-base0 text-sm space-y-1 list-disc list-inside">
                <li>Review and test the generated parser in a development environment</li>
                <li>Adjust timestamp parsing formats based on your actual log format</li>
                <li>Add additional logic for conditional mappings or transformations</li>
                <li>Configure the output section for your specific destination</li>
                <li>Handle array fields according to your UDM schema requirements</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ParserGenerator;
