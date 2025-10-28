// src/App.js
import React, { useState, useMemo } from 'react';
import UdmField from './components/UdmField';
import DetailsPanel from './components/DetailsPanel';

// --- Data Imports (no changes) ---
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

// --- Type-to-Template Mapping (no changes) ---
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
};

// --- Data Hydration Function (no changes) ---
const hydrateUdmTree = (field, path = [], parentTypes = []) => {
  let hydratedField = JSON.parse(JSON.stringify(field));
  const currentType = hydratedField.type;

  if (currentType && parentTypes.includes(currentType)) {
    console.warn(`Recursion detected: Halting hydration for type '${currentType}' at path: ${path.join(' > ')}`);
    delete hydratedField.children;
    return hydratedField;
  }

  const childTemplate = templateMap[currentType];

  if (childTemplate && !hydratedField.children) {
    hydratedField.children = childTemplate;
  }

  if (hydratedField.logstashMapping) {
    const fullPath = [...path, hydratedField.name].slice(1);
    const udmPathString = `[udm][${fullPath.join('][')}]`;
    hydratedField.logstashMapping = hydratedField.logstashMapping.replace(/%%PATH%%/g, udmPathString);
  }

  if (hydratedField.children) {
    const newPath = [...path, hydratedField.name];
    const newParentTypes = currentType ? [...parentTypes, currentType] : parentTypes;
    hydratedField.children = hydratedField.children.map(child => hydrateUdmTree(child, newPath, newParentTypes));
  }

  return hydratedField;
};

// --- Build Both Data Trees (no changes) ---
let eventData, entityData;
try {
  eventData = hydrateUdmTree(udmEvent, ['Event']);
  entityData = hydrateUdmTree(udmEntity, ['Entity']);
} catch (error) {
  console.error("CRITICAL ERROR: Failed to build UDM data trees.", error);
  eventData = { name: "Error", description: "Could not load Event data." };
  entityData = { name: "Error", description: "Could not load Entity data." };
}

// --- Helper function to collect all unique use cases (no changes) ---
const collectUseCases = (node, useCaseSet) => {
  if (node.keyFieldInfo) {
    node.keyFieldInfo.forEach(uc => useCaseSet.add(uc));
  }
  if (node.children) {
    node.children.forEach(child => collectUseCases(child, useCaseSet));
  }
};

function App() {
  // --- STATE CHANGE IS HERE ---
  // We'll store an object with both the field and its path
  const [selectedFieldInfo, setSelectedFieldInfo] = useState({ field: null, path: '' });
  const [view, setView] = useState('event');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState('');

  // --- HANDLER CHANGE IS HERE ---
  const handleFieldSelect = (field, path) => {
    setSelectedFieldInfo({ field, path });
  };

  const currentData = view === 'event' ? eventData : entityData;

  const allUseCases = useMemo(() => {
    const useCaseSet = new Set();
    if (eventData) collectUseCases(eventData, useCaseSet);
    if (entityData) collectUseCases(entityData, useCaseSet);
    return Array.from(useCaseSet).sort();
  }, []);

  // --- HELPER FUNCTION TO RESET VIEW ---
  const resetView = () => {
    setSelectedFieldInfo({ field: null, path: '' });
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

        {/* --- Model Toggle Buttons --- */}
        <div className="flex justify-center mb-4 gap-4">
          <button
            onClick={() => { setView('event'); resetView(); }}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              view === 'event' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'
            }`}
          >
            Event Model
          </button>
          <button
            onClick={() => { setView('entity'); resetView(); }}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              view === 'entity' ? 'bg-solarized-cyan text-solarized-base03' : 'bg-solarized-base02 hover:bg-solarized-base01'
            }`}
          >
            Entity Model
          </button>
        </div>

        {/* --- Search and Filter UI (no changes) --- */}
        <div className="mb-4 max-w-lg mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedUseCase(''); }}
            placeholder="Search for a UDM field (or 'repeated')..."
            className="w-full px-4 py-2 bg-solarized-base02 text-solarized-base1 rounded-full border-2 border-transparent focus:outline-none focus:border-solarized-cyan"
          />
        </div>
        <div className="flex justify-center flex-wrap gap-2 mb-8 max-w-3xl mx-auto">
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

        <div className="flex flex-col md:flex-row gap-8">
          <main className="bg-solarized-base02 rounded-xl p-4 shadow-lg md:w-1/2 min-w-0">
            {/* --- PROP CHANGES ARE HERE --- */}
            <UdmField
              key={view + searchQuery + selectedUseCase}
              field={currentData}
              path={[view]} // Pass the initial path
              selectedField={selectedFieldInfo.field}
              searchQuery={searchQuery}
              selectedUseCase={selectedUseCase}
              onSelect={handleFieldSelect}
            />
          </main>

          <aside className="md:w-1/2 min-w-0">
             {/* --- PROP CHANGES ARE HERE --- */}
            <DetailsPanel field={selectedFieldInfo.field} fullPath={selectedFieldInfo.path} />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;