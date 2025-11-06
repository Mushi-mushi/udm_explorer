// src/App.js
import React, { useState, useMemo } from 'react';
import UdmField from './components/UdmField';
import DetailsPanel from './components/DetailsPanel';

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
    <div className="bg-solarized-base03 text-solarized-base0 min-h-screen p-4 sm:p-8 font-[sans-serif]">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-solarized-base1">Unified Data Model Explorer</h1>
          <p className="text-solarized-base00">An interactive viewer for the UDM schema.</p>
        </header>

        <div className="flex justify-center mb-4 gap-4">
          <button onClick={() => { setView('event'); resetView(); }} className={`px-6 py-2 rounded-full font-semibold transition-colors ${view === 'event' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'}`}>
            Event Model
          </button>
          <button onClick={() => { setView('entity'); resetView(); }} className={`px-6 py-2 rounded-full font-semibold transition-colors ${view === 'entity' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'}`}>
            Entity Model
          </button>
        </div>

        <div className="mb-4 max-w-lg mx-auto">
          <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedUseCase(''); }} placeholder="Search for a UDM field (or 'repeated')..." className="w-full px-4 py-2 bg-solarized-base02 text-solarized-base1 rounded-full border-2 border-transparent focus:outline-none focus:border-solarized-cyan" />
        </div>
        <div className="flex justify-center flex-wrap gap-2 mb-8 max-w-3xl mx-auto">
          <button onClick={() => setSelectedUseCase('')} className={`px-3 py-1 text-sm rounded-full transition-colors ${!selectedUseCase ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'}`}>
            All Fields
          </button>
          {allUseCases.map(uc => (
            <button key={uc} onClick={() => { setSelectedUseCase(uc); setSearchQuery(''); }} className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedUseCase === uc ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'}`}>
              {uc}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
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
        </div>
      </div>
    </div>
  );
}

export default App;