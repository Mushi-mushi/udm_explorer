// src/components/LogstashPanel.js
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const logstashOperations = [
  // === Data Transformation (mutate plugin) ===
  {
    category: 'Transformation',
    name: 'mutate { rename }',
    tags: ['mutate', 'transformation', 'mapping'],
    description: 'Changes the name of a field, preserving its value and data type. The original field is removed. This is the most efficient way to map a source field to a UDM field when no type conversion is needed.',
    example: `# Renames the 'src_ip' field to 'udm.principal.ip'
mutate {
  rename => { "src_ip" => "udm.principal.ip" }
}

# Multiple renames in one block
mutate {
  rename => {
    "proto" => "event.idm.read_only_udm.network.ip_protocol"
    "srcport" => "event.idm.read_only_udm.network.target.port"
  }
}`
  },
  {
    category: 'Transformation',
    name: 'mutate { copy }',
    tags: ['mutate', 'transformation', 'copy'],
    description: 'Copies the value of a field to a new field, leaving the original field intact. This is useful when you need the same data in two different places.',
    example: `
# Copies the confidence score to another location.
mutate {
  copy => { "confidence" => "udm.security_result.confidence_score" }
}`
  },
  {
    category: 'Transformation',
    name: 'mutate { convert }',
    tags: ['mutate', 'transformation', 'type-conversion'],
    description: 'Changes the data type of a field. This is essential for ensuring that numbers are stored as integers or floats, and that booleans are stored correctly.',
    example: `
# Converts the source field to an integer *before* renaming it.
mutate {
  convert => { "source_bytes_field" => "integer" }
}
mutate {
  rename => { "source_bytes_field" => "udm.network.sent_bytes" }
}`
  },
  {
    category: 'Transformation',
    name: 'mutate { replace }',
    tags: ['mutate', 'transformation', 'assignment'],
    description: 'Overwrites the value of a field or creates a new field. Use this for static assignments, building strings dynamically, or initializing fields. In Logstash (SecOps), this replaces the standard Logstash `add_field` operation.',
    example: `
# Statically sets the 'event_type' to a UDM enum value.
mutate {
  replace => { "udm.metadata.event_type" => "USER_LOGIN" }
}

# Build a string by joining existing fields.
mutate {
  replace => { "joined_names" => "%{first_name} %{last_name}" }
}`
  },
  {
    category: 'Transformation',
    name: 'Building an Array (using merge)',
    tags: ['mutate', 'transformation', 'arrays', 'merge'],
    description: 'To create a repeated UDM field from a single value in Logstash, use merge with the FIELD NAME (not value). When you merge a field name into a non-existent destination, Logstash automatically creates an array with that field\'s value.',
    example: `
# SCENARIO 1: Single value → Array with one element
# Source: "src_ip": "192.168.1.1"
# Goal: "udm.principal.ip": ["192.168.1.1"]

# IMPORTANT: Merge the field NAME (as string), not the value!
mutate {
  merge => { "udm.principal.ip" => "src_ip" }
}

# The above creates: "udm.principal.ip": ["192.168.1.1"]
# This is the proven pattern from working Chronicle parsers.

# SCENARIO 2: Multiple separate fields → Array with multiple elements
# Source: "email1": "user@example.com", "email2": "admin@example.com"
# Goal: "udm.target.user.email_addresses": ["user@example.com", "admin@example.com"]

mutate {
  merge => { "udm.target.user.email_addresses" => "email1" }
}
mutate {
  merge => { "udm.target.user.email_addresses" => "email2" }
}

# Each merge appends the value to the array.

# NOTE: The key insight is that merge expects a FIELD NAME,
# not a field value with %{} syntax. Logstash handles array creation.`
  },
  {
    category: 'Transformation',
    name: 'mutate { merge }',
    tags: ['mutate', 'transformation', 'arrays', 'merge', 'objects'],
    description: 'Combines two fields. If both are arrays, it appends the second to the first. If both are objects (hashes), it merges the keys. This is commonly used to add a structured object to a "repeated" UDM field.',
    example: `
# 1. Create a temporary object for a label.
mutate {
  replace => {
    "temp_label.key" => "threat_actors"
    "temp_label.value" => "%{joined_threat_actors}"
  }
}

# 2. Merge the temporary object into the 'labels' array.
mutate {
  merge => { "udm.principal.labels" => "temp_label" }
}`
  },
  {
    category: 'Transformation',
    name: 'mutate { split }',
    tags: ['mutate', 'transformation', 'arrays', 'strings'],
    description: 'Splits a single string field into an array, based on a separator. This is the primary method for mapping a source field (e.g., a comma-separated list) to a "repeated" string field in UDM.',
    example: `
# Splits a string of email addresses into a proper array.
mutate {
  split => { "source_email_list" => "," }
}
mutate {
  rename => { "source_email_list" => "udm.target.email_addresses" }
}`
  },
  {
    category: 'Transformation',
    name: 'mutate { gsub }',
    tags: ['mutate', 'transformation', 'strings', 'regex'],
    description: 'Performs a global substitution on a string field using a regular expression. It\'s very useful for cleaning up data by removing unwanted characters or replacing patterns.',
    example: `
# Replaces all newline characters (\\n) in the description with a space.
mutate {
  gsub => ["description", "\\n", " "]
}`
  },
  {
    category: 'Transformation',
    name: 'mutate { remove_field }',
    tags: ['mutate', 'transformation', 'cleanup'],
    description: 'Deletes one or more fields from an event. This is crucial for cleaning up temporary fields used during processing, keeping the final event clean and efficient.',
    example: `
# Removes temporary fields after their values have been merged.
mutate {
  remove_field => ["temp_label", "joined_threat_actors", "ag_check"]
}`
  },

  // === Data Extraction Methods ===
  {
    category: 'Data Extraction',
    name: 'grok - Pattern Matching',
    tags: ['extraction', 'parsing', 'unstructured', 'regex', 'pattern'],
    description: 'Use predefined patterns and regular expressions to match log messages and extract values. Grok is ideal for unstructured text logs.',
    example: `# Predefined pattern syntax
%{PATTERN:token}
%{IP:hostip}
%{NUMBER:event_id}

# Regular expression syntax (note: use double backslashes)
(?P<token>regex_pattern)
(?P<eventId>\\\\S+)

# Example: Parse syslog message
grok {
  match => {
    "message" => "%{SYSLOGTIMESTAMP:when} %{DATA:deviceName}: FW-%{INT:messageid}: (?P<action>Accepted|Denied) connection %{WORD:protocol} %{IP:srcAddr}/%{INT:srcPort} to %{IP:dstAddr}/%{INT:dstPort}"
  }
  on_error => "grok_failure"
}

# Grok overwrite option - replace existing field
grok {
  match => { "message" => ["(?P<fieldName>.*)"] }
  overwrite => ["fieldName"]
  on_error => "grok_failure"
}

# Predefined patterns: https://github.com/elastic/logstash/blob/v1.4.2/patterns/grok-patterns`
  },
  {
    category: 'Data Extraction',
    name: 'json - Parse JSON Logs',
    tags: ['extraction', 'json', 'structured', 'array'],
    description: 'Parse JSON formatted logs. Use array_function to handle JSON arrays and access nested elements.',
    example: `# Basic JSON extraction
json {
  source => "message"
  on_error => "json_failure"
}

# Handle JSON arrays with split_columns
json {
  source => "message"
  on_error => "json_failure"
  array_function => "split_columns"
}

# Access array elements: ips.0, ips.1
# Access nested arrays: devices.0.ips.0

# Note: Non-existent elements can be accessed safely:
# - Cannot use in 'if' unless initialized to ""
# - Cannot use in mutate replace (causes error)
# - Can use in mutate rename (ignored if missing)
# - Can use in mutate merge (ignored if missing)`
  },
  {
    category: 'Data Extraction',
    name: 'xml - Parse XML with XPath',
    tags: ['extraction', 'xml', 'xpath', 'structured'],
    description: 'Parse XML formatted logs using XPath expressions. Supports iteration over XML arrays.',
    example: `# Basic XML extraction
xml {
  source => "message"
  xpath => {
    "/Event/System/EventID" => "eventId"
    "/Event/System/Computer" => "hostname"
  }
}

# Iterate over XML arrays (index starts at 1)
for index, _ in xml(message, /Event/HOST_LIST/HOST) {
  xml {
    source => "message"
    xpath => {
      "/Event/HOST_LIST/HOST[%{index}]/ID" => "IDs"
      "/Event/HOST_LIST/HOST[%{index}]/IP" => "IPs"
    }
  }
}

# Nested for loops supported
for index, _ in xml(message, /Event/HOST_LIST/HOST) {
  xml {
    source => "message"
    xpath => {
      "/Event/HOST_LIST/HOST[%{index}]/ID" => "IDs"
    }
  }
  for i, _ in xml(message, /Event/HOST_LIST/HOST[%{index}]/Hashes/Hash) {
    xml {
      source => "message"
      xpath => {
        "/Event/HOST_LIST/HOST[%{index}]/Hashes/Hash[%{i}]" => "data"
      }
    }
  }
}`
  },
  {
    category: 'Data Extraction',
    name: 'kv - Key-Value Parsing',
    tags: ['extraction', 'key-value', 'parsing'],
    description: 'Extract key-value pairs from logs with customizable delimiters and whitespace handling.',
    example: `# Initialize token first
mutate {
  replace => { "destination" => "" }
}

# Parse key-value pairs
kv {
  source => "message"
  field_split => " "          # Delimiter between pairs
  value_split => "="          # Delimiter between key and value
  whitespace => "strict"      # "strict" or "lenient" (default)
  trim_value => "\\""         # Remove quotes from values
  on_error => "kv_failure"
}

# Use extracted fields
mutate {
  replace => {
    "event.idm.read_only_udm.target.hostname" => "%{destination}"
  }
}`
  },
  {
    category: 'Data Extraction',
    name: 'csv - Parse CSV Files',
    tags: ['extraction', 'csv', 'tabular'],
    description: 'Parse CSV formatted logs into individual columns (column1, column2, etc.).',
    example: `# Parse CSV into columns
csv {
  source => "message"
  separator => ","
  on_error => "csv_failed"
}

# Map columns to UDM fields
mutate {
  replace => {
    "resource_id" => "%{column1}"
    "principal_company_name" => "%{column3}"
    "location" => "%{column4}"
    "transaction_amount" => "%{column6}"
    "status" => "%{column9}"
    "target_userid" => "%{column24}"
  }
}`
  },

  // === Control Flow and Advanced Patterns ===
  {
    category: 'Control Flow',
    name: 'Looping over Arrays (`for ... in ...`)',
    tags: ['loops', 'arrays', 'iteration', 'control-flow'],
    description: 'A core Logstash feature for processing arrays. It iterates through each item, allowing you to extract data, perform conversions, and map to repeated UDM fields. This is essential for converting array elements without a ruby filter.',
    example: `
# GOAL: Convert an array of port strings ["80", "443"] to integers [80, 443].
# 'convert' cannot do this directly, so we must loop.

for index, value in source_ports_array {
  mutate {
    # a. Create a temporary field for the current string value ("80").
    replace => { "temp_port" => "%{value}" }

    # b. Convert the temporary field to an integer.
    convert => { "temp_port" => "integer" }

    # c. Merge the converted integer into a new array.
    merge => { "converted_ports_array" => "temp_port" }
  }
}

# 'converted_ports_array' now holds [80, 443].
# Clean up the temporary field used in the loop.
mutate {
  remove_field => ["temp_port"]
}`
  },
  {
    category: 'Advanced Patterns',
    name: 'Mapping to Nested Repeated Fields',
    tags: ['advanced', 'arrays', 'nested', 'objects'],
    description: 'When a UDM field is inside a "repeated" object (e.g., `intermediary.nat_port` where `intermediary` is repeated), you cannot map to it directly. You must first create a temporary object with the nested field, then merge that object into the repeated parent array.',
    example: `
# SCENARIO: Map a source field to a nested field inside a repeated parent
# Example: risk_score → udm.intermediary.nat_port
# Where 'intermediary' is marked as repeated in the UDM schema

# IMPORTANT: The order is critical for this to work correctly!

# STEP 1: Build the temporary object with the field value
mutate {
  replace => { "temp_intermediary_obj.nat_port" => "%{risk_score}" }
}

# STEP 2: Convert the type on the TEMP OBJECT field (not the source!)
# This must happen AFTER building the object, BEFORE merging
mutate {
  convert => { "temp_intermediary_obj.nat_port" => "integer" }
}

# STEP 3: Merge the complete object into the repeated parent array
mutate {
  merge => { "udm.intermediary" => "temp_intermediary_obj" }
}

# STEP 4: Clean up temporary fields
mutate {
  remove_field => ["risk_score", "temp_intermediary_obj"]
}

# RESULT: Creates udm.intermediary as an array with one object:
# "intermediary": [{"nat_port": 100}]

# COMMON PATTERN in loops:
# When processing multiple items, use this pattern inside a 'for' loop.
# Each iteration creates a new temp object and merges it, building the array.

for index, record in source_array {
  mutate {
    replace => {
      "temp_obj.field1" => "%{record.value1}"
      "temp_obj.field2" => "%{record.value2}"
    }
  }
  mutate {
    convert => { "temp_obj.field1" => "integer" }
  }
  mutate {
    merge => { "udm.repeated_parent" => "temp_obj" }
  }
}

mutate {
  remove_field => ["temp_obj"]
}

# KEY POINTS:
# 1. Always build temp object with 'replace' first
# 2. Convert types on temp object fields (not source fields)
# 3. Merge temp object into repeated parent
# 4. Clean up temp objects after use
`
  },
  {
    category: 'Data Extraction',
    name: 'grok Filter',
    tags: ['extraction', 'parsing', 'unstructured', 'regex'],
    description: 'Parses unstructured text data into structured fields using predefined or custom patterns. It\'s the most powerful tool for logs that are not in a format like JSON or CSV.',
    example: `
# Tries to match the 'description' field against several patterns.
grok {
  match => {
    "description" => [
      "Rule: %{GREEDYDATA:rule_type}#%{GREEDYDATA:threat_summary}",
      "Connection from %{IP:source_ip} to %{IP:dest_ip}"
    ]
  }
  on_error => "error_grok_parse_failed"
}

# Check if grok succeeded before using the new fields.
if ![match_error] {
  mutate {
    rename => { "source_ip" => "udm.principal.ip" }
  }
}`
  },
  {
    category: 'Filters',
    name: 'date Filter',
    tags: ['timestamp', 'parsing', 'date', 'time'],
    description: 'Parses a timestamp from a string field. The "target" option is used to populate a UDM timestamp field. Without "target", it overwrites the event\'s main @timestamp.',
    example: `
# Parses a timestamp from the 'log_time' field.
date {
  match => ["log_time", "ISO8601"]
  target => "udm.metadata.event_timestamp"
}`
  },
  {
    category: 'Control Flow',
    name: 'Conditional Logic (if/else)',
    tags: ['conditionals', 'logic', 'control-flow'],
    description: 'Allows you to apply filters only when certain conditions are met. This includes checking for field existence, comparing values, or matching regular expressions (`=~`).',
    example: `
# Maps event type based on a source event ID.
if [event_id] == 4624 {
  mutate { replace => { "udm.metadata.event_type" => "USER_LOGIN" } }
}

# Sets a category if the message contains the word "malicious".
if [message] =~ "malicious" {
  mutate { replace => { "udm.security_result.threat_severity" => "CRITICAL" } }
}`
  },
  {
    category: 'Error Handling',
    name: 'on_error Parameter (Logstash)',
    tags: ['error-handling', 'debugging', 'Logstash'],
    description: 'A parameter available on most filters (like `json`, `date`, `grok`) that provides error handling. Instead of dropping an event on failure, it adds a tag or field, which is invaluable for debugging parsing issues.',
    example: `
# If the 'message' field is not valid JSON,
# add a specific tag instead of failing the event.
json {
  source => "message"
  on_error => "error_json_parse_failed"
}`
  },
  {
    category: 'Debugging',
    name: 'statedump {} Filter (Logstash)',
    tags: ['debugging', 'Logstash', 'troubleshooting'],
    description: 'A powerful debugging filter specific to Google SecOps (Logstash). It prints the entire state of the event (all fields and values) to the ingestion logs at the exact point it is placed in the pipeline. Use it inside conditionals to inspect specific events.',
    example: `
# If a specific error tag is present, dump the event state for debugging.
if "error_json_parse_failed" in [tags] {
  statedump{}
}`
  },
  {
    category: 'Output',
    name: 'Finalization (`@output`) (Logstash)',
    tags: ['output', 'Logstash', 'finalization'],
    description: 'A Logstash-specific convention for defining the final event to be sent. You build your complete UDM event in a temporary field (e.g., "event"), and then merge it into the special "@output" field at the very end of the pipeline.',
    example: `
# ... all parsing logic populates the 'event' field ...

# At the end of the filter block:
mutate {
  merge => {
    "@output" => "event"
  }
}`
  }
];

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

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-solarized-base00" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const LogstashPanel = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOperations = useMemo(() => {
    if (!searchQuery.trim()) return logstashOperations;

    const query = searchQuery.toLowerCase();
    return logstashOperations.filter(op =>
      op.name.toLowerCase().includes(query) ||
      op.description.toLowerCase().includes(query) ||
      (op.tags && op.tags.some(tag => tag.toLowerCase().includes(query))) ||
      op.category.toLowerCase().includes(query) ||
      op.example.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const groupedOperations = useMemo(() => {
    const groups = {};
    filteredOperations.forEach(op => {
      if (!groups[op.category]) {
        groups[op.category] = [];
      }
      groups[op.category].push(op);
    });
    return groups;
  }, [filteredOperations]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-4"
    >
      {/* Header with search bar */}
      <div className="bg-solarized-base02 rounded-xl p-6 shadow-lg">
        <h2 className="text-3xl font-bold text-solarized-cyan mb-2">Parser Syntax Reference</h2>
        <p className="text-solarized-base0 mb-4">
          Complete guide to Google Chronicle parser syntax (Logstash). Search and expand sections below for examples and usage patterns.
        </p>

        <div className="p-3 bg-solarized-blue bg-opacity-10 border border-solarized-blue rounded-lg">
          <p className="text-solarized-base1 text-sm">
            📖 <strong>Reference:</strong>{' '}
            <a
              href="https://docs.cloud.google.com/chronicle/docs/reference/parser-syntax"
              target="_blank"
              rel="noopener noreferrer"
              className="text-solarized-cyan hover:text-solarized-blue underline"
            >
              Google Chronicle Parser Syntax Documentation
            </a>
          </p>
        </div>
      </div>

      {/* Grouped Operations */}
      {Object.entries(groupedOperations).map(([category, operations]) => (
        <div key={category} className="bg-solarized-base02 rounded-xl p-6 shadow-lg w-full space-y-4">
          <h3 className="text-2xl font-bold text-solarized-cyan mb-4">{category}</h3>

          {operations.map((op) => {
            const globalIndex = logstashOperations.indexOf(op);
            return (
              <div key={op.name} className="border-b border-solarized-base01 pb-4 last:border-b-0">
                <div
                  onClick={() => handleToggle(globalIndex)}
                  className="flex items-center cursor-pointer py-2 hover:bg-solarized-base03 rounded px-2 -ml-2"
                >
                  <ArrowIcon isExpanded={expandedIndex === globalIndex} />
                  <h4 className="ml-2 font-mono text-lg text-solarized-cyan">{op.name}</h4>
                </div>                <AnimatePresence>
                  {expandedIndex === globalIndex && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pl-7 pr-2 space-y-4">
                        <p className="text-solarized-base0 mt-2">{op.description}</p>
                        <div>
                          <h4 className="text-solarized-base1 font-semibold mb-2">Example:</h4>
                          <pre className="bg-solarized-base03 text-solarized-blue p-4 rounded-md text-sm overflow-x-auto">
                            <code>{op.example.trim()}</code>
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
};

export default LogstashPanel;
