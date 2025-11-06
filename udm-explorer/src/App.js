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

// --- (templateMap and hydrateUdmTree are unchanged) ---
const templateMap = {
  'Metadata': udmMetadata?.children, 'EntityMetadata': udmEntityMetadata?.children, 'Noun': udmNoun?.children,
  'SecurityResult': udmSecurityResult?.children, 'Network': udmNetwork?.children, 'Location': udmLocation?.children,
  'LatLng': udmLatLng?.children, 'Process': udmProcess?.children, 'Asset': udmAsset?.children, 'AttackDetails': udmAttackDetails?.children,
  'Tactic': udmTactic?.children, 'Technique': udmTechnique?.children, 'Label': udmLabel?.children, 'File': udmFile?.children,
  'EntityRisk': udmEntityRisk?.children, 'RiskDelta': udmRiskDelta?.children, 'Resource': udmResource?.children,
  'Attribute': udmAttribute?.children, 'VerdictInfo': udmVerdictInfo?.children, 'VerdictType': udmVerdictType?.children,
  'ThreatVerdict': udmThreatVerdict?.children, 'VerdictResponse': udmVerdictResponse?.children, 'IoCStatsType': udmIoCStatsType?.children,
  'ProductConfidence': udmProductConfidence?.children, 'IoCStats': udmIoCStats?.children, 'Cloud': udmCloud?.children,
  'Group': udmGroup?.children, 'Permission': udmPermission?.children, 'PDFInfo': udmPdfInfo?.children,
  'PeFileMetadata': udmPeFileMetadata?.children, 'FileMetadataPE': udmFileMetadataPE?.children,
  'FileMetadataSignatureInfo': udmFileMetadataSignatureInfo?.children, 'SignerInfo': udmSignerInfo?.children,
  'X509': udmX509?.children, 'SignatureInfo': udmSignatureInfo?.children, 'FileMetadataCodesign': udmFileMetadataCodesign?.children,
  'Role': udmRole?.children, 'Investigation': udmInvestigation?.children, 'Registry': udmRegistry?.children,
  'User': udmUser?.children, 'TimeOff': udmTimeOff?.children, 'Metric': udmMetric?.children,
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

  const resetView = () => {
    setSelectedFieldInfo({ field: null, pathArray: [] });
    setSearchQuery('');
    setSelectedUseCase('');
  };

  return (
    <div className="bg-solarized-base03 text-solarized-base0 min-h-screen flex">
      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-solarized-base02 border-r border-solarized-base01 flex flex-col">
        <div className="p-6 border-b border-solarized-base01">
          <h1 className="text-2xl font-bold text-solarized-cyan mb-1">UDM Explorer</h1>
          <p className="text-xs text-solarized-base00">Interactive schema viewer</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setView('event'); resetView(); }} 
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-3 ${view === 'event' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base03 hover:bg-solarized-base01 text-solarized-base0'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Event Model
          </button>
          
          <button 
            onClick={() => { setView('entity'); resetView(); }} 
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-3 ${view === 'entity' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base03 hover:bg-solarized-base01 text-solarized-base0'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Entity Model
          </button>
          
          <button 
            onClick={() => { setView('logstash'); resetView(); }} 
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-3 ${view === 'logstash' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base03 hover:bg-solarized-base01 text-solarized-base0'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Gogstash Operations
          </button>
          
          <button 
            onClick={() => { setView('parser'); resetView(); }} 
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-3 ${view === 'parser' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base03 hover:bg-solarized-base01 text-solarized-base0'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Parser Generator
          </button>
        </nav>
        
        <div className="p-4 border-t border-solarized-base01 text-xs text-solarized-base00">
          <p>Google Chronicle UDM</p>
          <p className="text-solarized-base01">Schema Explorer v1.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          {view !== 'logstash' && view !== 'parser' && (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-4 text-solarized-base1">
                  {view === 'event' ? 'Event Model' : 'Entity Model'}
                </h2>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedUseCase(''); }} 
                  placeholder="Search for a UDM field (or 'repeated')..." 
                  className="w-full max-w-2xl px-4 py-2 bg-solarized-base02 text-solarized-base1 rounded-lg border-2 border-transparent focus:outline-none focus:border-solarized-cyan" 
                />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-8">
                <button 
                  onClick={() => setSelectedUseCase('')} 
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${!selectedUseCase ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'}`}
                >
                  All Fields
                </button>
                {allUseCases.map(uc => (
                  <button 
                    key={uc} 
                    onClick={() => { setSelectedUseCase(uc); setSearchQuery(''); }} 
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedUseCase === uc ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'}`}
                  >
                    {uc}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            {view === 'parser' ? (
              <ParserGenerator />
            ) : view !== 'logstash' ? (
              <>
                <main className="bg-solarized-base02 rounded-xl p-4 shadow-lg md:w-1/2 min-w-0">
                  <UdmField
                    key={view + searchQuery + selectedUseCase}
                    field={currentData}
                    path={[{ name: view, repeated: currentData.repeated || false }]}
                    selectedField={selectedFieldInfo.field}
                    searchQuery={searchQuery}
                    selectedUseCase={selectedUseCase}
                    onSelect={handleFieldSelect}
                  />
                </main>
                <aside className="md:w-1/2 min-w-0">
                  <DetailsPanel field={selectedFieldInfo.field} fullPathArray={selectedFieldInfo.pathArray} />
                </aside>
              </>
            ) : (
              <LogstashPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;