// src/App.js
import React, { useState, useMemo } from 'react';
import UdmField from './components/UdmField';
import DetailsPanel from './components/DetailsPanel';
import LogstashPanel from './components/LogstashPanel';
import ParserGenerator from './components/ParserGenerator';

// --- (All data imports are unchanged) ---
import udmEvent from './data/udm-event.json';
import udmEntity from './data/udm-entity.json';
import udmMetadata from './data/udm-metadata.json';
import udmEntityMetadata from './data/udm-entity-metadata.json';
import udmNoun from './data/udm-noun.json';
import udmSecurityResult from './data/udm-security_result.json';
import udmNetwork from './data/udm-network.json';
import udmLocation from './data/udm-location.json';
import udmLatLng from './data/udm-latlng.json';
import udmProcess from './data/udm-process.json';
import udmAsset from './data/udm-asset.json';
import udmAttackDetails from './data/udm-attackdetails.json';
import udmTactic from './data/udm-tactic.json';
import udmTechnique from './data/udm-technique.json';
import udmLabel from './data/udm-label.json';
import udmFile from './data/udm-file.json';
import udmEntityRisk from './data/udm-entityrisk.json';
import udmRiskDelta from './data/udm-riskdelta.json';
import udmResource from './data/udm-resource.json';
import udmAttribute from './data/udm-attribute.json';
import udmVerdictInfo from './data/udm-verdictinfo.json';
import udmVerdictType from './data/udm-verdicttype.json';
import udmThreatVerdict from './data/udm-threatverdict.json';
import udmVerdictResponse from './data/udm-verdictresponse.json';
import udmIoCStatsType from './data/udm-iocstatstype.json';
import udmProductConfidence from './data/udm-productconfidence.json';
import udmIoCStats from './data/udm-iocstats.json';
import udmCloud from './data/udm-cloud.json';
import udmGroup from './data/udm-group.json';
import udmPermission from './data/udm-permission.json';
import udmPdfInfo from './data/udm-pdfinfo.json';
import udmPeFileMetadata from './data/udm-pefilemetadata.json';
import udmFileMetadataPE from './data/udm-filemetadatape.json';
import udmFileMetadataSignatureInfo from './data/udm-filemetadatasignatureinfo.json';
import udmSignerInfo from './data/udm-signerinfo.json';
import udmX509 from './data/udm-x509.json';
import udmSignatureInfo from './data/udm-signatureinfo.json';
import udmFileMetadataCodesign from './data/udm-filemetadatacodesign.json';
import udmRole from './data/udm-role.json';
import udmInvestigation from './data/udm-investigation.json';
import udmRegistry from './data/udm-registry.json';
import udmUser from './data/udm-user.json';
import udmTimeOff from './data/udm-timeoff.json';
import udmMetric from './data/udm-metric.json';
import udmArtifact from './data/udm-artifact.json';

// --- (templateMap and hydrateUdmTree are unchanged) ---
const templateMap = {
  'Metadata': udmMetadata?.children,
  'EntityMetadata': udmEntityMetadata?.children,
  'Noun': udmNoun?.children,
  'SecurityResult': udmSecurityResult?.children,
  'Network': udmNetwork?.children,
  'Location': udmLocation?.children,
  'LatLng': udmLatLng?.children,
  'Process': udmProcess?.children,
  'Asset': udmAsset?.children,
  'AttackDetails': udmAttackDetails?.children,
  'Tactic': udmTactic?.children,
  'Technique': udmTechnique?.children,
  'Label': udmLabel?.children,
  'File': udmFile?.children,
  'EntityRisk': udmEntityRisk?.children,
  'RiskDelta': udmRiskDelta?.children,
  'Resource': udmResource?.children,
  'Attribute': udmAttribute?.children,
  'VerdictInfo': udmVerdictInfo?.children,
  'VerdictType': udmVerdictType?.children,
  'ThreatVerdict': udmThreatVerdict?.children,
  'VerdictResponse': udmVerdictResponse?.children,
  'IoCStatsType': udmIoCStatsType?.children,
  'ProductConfidence': udmProductConfidence?.children,
  'IoCStats': udmIoCStats?.children,
  'Cloud': udmCloud?.children,
  'Group': udmGroup?.children,
  'Permission': udmPermission?.children,
  'PDFInfo': udmPdfInfo?.children,
  'PeFileMetadata': udmPeFileMetadata?.children,
  'FileMetadataPE': udmFileMetadataPE?.children,
  'FileMetadataSignatureInfo': udmFileMetadataSignatureInfo?.children,
  'SignerInfo': udmSignerInfo?.children,
  'X509': udmX509?.children,
  'SignatureInfo': udmSignatureInfo?.children,
  'FileMetadataCodesign': udmFileMetadataCodesign?.children,
  'Role': udmRole?.children,
  'Investigation': udmInvestigation?.children,
  'Registry': udmRegistry?.children,
  'Metric': udmMetric?.children,
  'User': udmUser?.children,
  'TimeOff': udmTimeOff?.children,
  'Artifact': udmArtifact?.children,
};

const hydrateUdmTree = (field, path = [], parentTypes = []) => {
  let hydratedField = JSON.parse(JSON.stringify(field));
  const currentType = hydratedField.type;
  if (currentType && parentTypes.includes(currentType)) { return hydratedField; }
  const childTemplate = templateMap[currentType];
  if (childTemplate && !hydratedField.children) { hydratedField.children = childTemplate; }
  if (hydratedField.children) {
    const newPath = [...path, hydratedField.name];
    const newParentTypes = currentType ? [...parentTypes, currentType] : parentTypes;
    hydratedField.children = hydratedField.children.map(child => hydrateUdmTree(child, newPath, newParentTypes));
  }
  return hydratedField;
};

let eventData, entityData;
try {
  eventData = hydrateUdmTree(udmEvent, ['Event']);
  entityData = hydrateUdmTree(udmEntity, ['Entity']);
} catch (error) {
  console.error("CRITICAL ERROR: Failed to build UDM data trees.", error);
  eventData = { name: "Error", description: "Could not load Event data." };
  entityData = { name: "Error", description: "Could not load Entity data." };
}

const collectUseCases = (node, useCaseSet) => {
  if (node.keyFieldInfo) { node.keyFieldInfo.forEach(uc => useCaseSet.add(uc)); }
  if (node.children) { node.children.forEach(child => collectUseCases(child, useCaseSet)); }
};

function App() {
  const [selectedFieldInfo, setSelectedFieldInfo] = useState({ field: null, pathArray: [] });
  const [view, setView] = useState('event');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState('');

  // Parser Generator state - lifted to App level to persist across view changes
  const sampleJson = '{"timestamp": "2024-01-01T12:00:00Z", "src_ip": "192.168.1.1", "event_type": "GENERIC_EVENT", "risk_score" : "100"}';
  const [parserState, setParserState] = useState({
    jsonInput: sampleJson,
    parsedFields: [],
    mappings: [],
    parseError: '',
    generatedParser: '',
    testOutput: null,
    showTestOutput: false
  });

  const handleFieldSelect = (field, pathArray) => {
    setSelectedFieldInfo({ field, pathArray });
  };

  const currentData = view === 'event' ? eventData : entityData;

  const allUseCases = useMemo(() => {
    const useCaseSet = new Set();
    if (eventData) collectUseCases(eventData, useCaseSet);
    if (entityData) collectUseCases(entityData, useCaseSet);
    return Array.from(useCaseSet).sort();
  }, []);

  return (
    <div className="bg-solarized-base03 text-solarized-base0 min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-solarized-base02 border-b border-solarized-base01 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-solarized-cyan">UDM Explorer</h1>
              <p className="text-xs text-solarized-base00">Google Chronicle Unified Data Model</p>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex gap-1 bg-solarized-base03 p-1 rounded-lg">
              <button
                onClick={() => setView('event')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${view === 'event' ? 'bg-solarized-cyan text-solarized-base03 shadow-md' : 'text-solarized-base0 hover:text-solarized-cyan'}`}
              >
                Event
              </button>
              <button
                onClick={() => setView('entity')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${view === 'entity' ? 'bg-solarized-cyan text-solarized-base03 shadow-md' : 'text-solarized-base0 hover:text-solarized-cyan'}`}
              >
                Entity
              </button>
              <button
                onClick={() => setView('logstash')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${view === 'logstash' ? 'bg-solarized-cyan text-solarized-base03 shadow-md' : 'text-solarized-base0 hover:text-solarized-cyan'}`}
              >
                Gogstash
              </button>
              <button
                onClick={() => setView('parser')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${view === 'parser' ? 'bg-solarized-cyan text-solarized-base03 shadow-md' : 'text-solarized-base0 hover:text-solarized-cyan'}`}
              >
                Generator
              </button>
            </nav>
          </div>

          {/* Search and Filters - Only show for Event/Entity views */}
          {view !== 'logstash' && view !== 'parser' && (
            <div className="space-y-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-solarized-base00" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedUseCase(''); }}
                  placeholder="Search UDM fields..."
                  className="w-full pl-10 pr-4 py-2 bg-solarized-base03 text-solarized-base1 rounded-lg border border-solarized-base01 focus:outline-none focus:border-solarized-cyan"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedUseCase('')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${!selectedUseCase ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base03 text-solarized-base0 hover:bg-solarized-base01'}`}
                >
                  All Fields
                </button>
                {allUseCases.map(uc => (
                  <button
                    key={uc}
                    onClick={() => { setSelectedUseCase(uc); setSearchQuery(''); }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedUseCase === uc ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base03 text-solarized-base0 hover:bg-solarized-base01'}`}
                  >
                    {uc}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {view === 'parser' ? (
              <ParserGenerator
                parserState={parserState}
                setParserState={setParserState}
              />
            ) : view !== 'logstash' ? (
              <>
                <div className="bg-solarized-base02 rounded-xl p-6 shadow-lg md:w-1/2 min-w-0">
                  <h2 className="text-xl font-bold text-solarized-cyan mb-4 border-b border-solarized-base01 pb-2">
                    {view === 'event' ? 'Event Model' : 'Entity Model'} Structure
                  </h2>
                  <UdmField
                    key={view + searchQuery + selectedUseCase}
                    field={currentData}
                    path={[{ name: view, repeated: currentData.repeated || false }]}
                    selectedField={selectedFieldInfo.field}
                    searchQuery={searchQuery}
                    selectedUseCase={selectedUseCase}
                    onSelect={handleFieldSelect}
                  />
                </div>
                <div className="md:w-1/2 min-w-0">
                  <DetailsPanel field={selectedFieldInfo.field} fullPathArray={selectedFieldInfo.pathArray} />
                </div>
              </>
            ) : (
              <div className="w-full">
                <LogstashPanel />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;