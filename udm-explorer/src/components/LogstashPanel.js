// src/components/LogstashPanel.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const logstashOperations = [
  {
    name: 'mutate { rename }',
    description: 'Changes the name of a field, preserving its value and data type. The original field is removed. This is the most efficient way to map a source field to a UDM field when no type conversion is needed.',
    example: `
# Renames the 'src_ip' field to 'udm.principal.ip'
mutate {
  rename => { "src_ip" => "udm.principal.ip" }
}`
  },
  {
    name: 'mutate { replace }',
    description: 'Overwrites the value of a field. This can be used for static assignment, dynamically building strings, or initializing fields at the start of a pipeline.',
    example: `
# Statically sets the product name.
mutate {
  replace => { "udm.metadata.product_name" => "ThreatConnect" }
}

# Build a string by joining existing fields.
mutate {
  replace => { "joined_names" => "%{first_name} %{last_name}" }
}`
  },
  {
    name: 'mutate { copy }',
    description: 'Copies the value of a field to a new field, leaving the original field intact. This is useful when you need the same data in two different places.',
    example: `
# Copies the confidence score to another location.
mutate {
  copy => { "confidence" => "udm.security_result.confidence_score" }
}`
  },
  {
    name: 'mutate { convert }',
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
    name: 'mutate { add_field }',
    description: 'Adds a new field with a static or dynamic value. This is perfect for setting UDM enum fields based on some logic, or for creating fields that don\'t exist in the source log.',
    example: `
# Statically sets the 'event_type' to a UDM enum value.
mutate {
  add_field => { "udm.metadata.event_type" => "USER_LOGIN" }
}`
  },
  {
    name: 'Building an Array (`add_field`)',
    description: 'A special behavior of `add_field` is that if you add a value to a field that already exists, it will automatically convert that field into an array containing both the old and new values. This is the primary way to create a repeated UDM field from multiple separate source fields.',
    example: `
# Source has: "primary_cat": "web", "secondary_cat": "proxy"
# Goal is: "udm.network.category_details": ["web", "proxy"]

mutate {
  add_field => { "udm.network.category_details" => "%{primary_cat}" }
  add_field => { "udm.network.category_details" => "%{secondary_cat}" }
}`
  },
  {
    name: 'mutate { merge }',
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
    name: 'mutate { split }',
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
    name: 'mutate { gsub }',
    description: 'Performs a global substitution on a string field using a regular expression. It\'s very useful for cleaning up data by removing unwanted characters or replacing patterns.',
    example: `
# Replaces all newline characters (\\n) in the description with a space.
mutate {
  gsub => ["description", "\\n", " "]
}`
  },
  {
    name: 'mutate { remove_field }',
    description: 'Deletes one or more fields from an event. This is crucial for cleaning up temporary fields used during processing, keeping the final event clean and efficient.',
    example: `
# Removes temporary fields after their values have been merged.
mutate {
  remove_field => ["temp_label", "joined_threat_actors", "ag_check"]
}`
  },
  {
    name: 'Looping over Arrays (`for ... in ...`)',
    description: 'A core Gostash feature for processing arrays. It iterates through each item, allowing you to extract data, perform conversions, and map to repeated UDM fields. This is essential for converting array elements without a ruby filter.',
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
    name: 'Mapping to Nested Repeated Fields',
    description: 'When a UDM field is inside a "repeated" object (e.g., `intermediary.hostname`), you cannot map to it directly. You must first create an object within the array. There are two primary patterns for this.',
    example: `
# METHOD 1: The 'add_field' Shortcut (for one-off mappings)
# Use this when you are NOT in a loop and only need to create a SINGLE object.
# The [0] index creates the array and its first element if they don't exist.
# NOTE: Bracket notation is REQUIRED for this to work.

mutate {
  add_field => { "[udm][intermediary][0][hostname]" => "%{source_proxy_host}" }
  add_field => { "[udm][intermediary][0][ip]" => "%{source_proxy_ip}" }
}

# METHOD 2: The 'merge' Pattern (for loops or cleaner objects)
# Use this when you ARE in a loop or need to add a complete object cleanly.
# It involves creating a temporary object first.

# 1. Build a temporary object.
mutate {
  replace => {
    "temp_technique.id" => "%{record.techniqueId}"
    "temp_technique.name" => "%{record.techniqueName}"
  }
}

# 2. Merge the complete object into the array.
mutate {
  merge => { "udm.security_result.attack_details.techniques" => "temp_technique" }
}

# RECOMMENDATION:
# - Use the 'add_field' shortcut for simple, one-off mappings.
# - ALWAYS use the 'merge' pattern when iterating in a 'for' loop to ensure each item is added as a new, complete object in the array.
`
  },
  {
    name: 'grok Filter',
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
    name: 'date Filter',
    description: 'Parses a timestamp from a string field. The "target" option is used to populate a UDM timestamp field. Without "target", it overwrites the event\'s main @timestamp.',
    example: `
# Parses a timestamp from the 'log_time' field.
date {
  match => ["log_time", "ISO8601"]
  target => "udm.metadata.event_timestamp"
}`
  },
  {
    name: 'Conditional Logic (if/else)',
    description: 'Allows you to apply filters only when certain conditions are met. This includes checking for field existence, comparing values, or matching regular expressions (`=~`).',
    example: `
# Maps event type based on a source event ID.
if [event_id] == 4624 {
  mutate { add_field => { "udm.metadata.event_type" => "USER_LOGIN" } }
}

# Sets a category if the message contains the word "malicious".
if [message] =~ "malicious" {
  mutate { add_field => { "udm.security_result.threat_severity" => "CRITICAL" } }
}`
  },
  {
    name: 'on_error Parameter (Gostash)',
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
    name: 'statedump {} Filter (Gostash)',
    description: 'A powerful debugging filter specific to Google SecOps (Gostash). It prints the entire state of the event (all fields and values) to the ingestion logs at the exact point it is placed in the pipeline. Use it inside conditionals to inspect specific events.',
    example: `
# If a specific error tag is present, dump the event state for debugging.
if "error_json_parse_failed" in [tags] {
  statedump{}
}`
  },
  {
    name: 'Finalization (`@output`) (Gostash)',
    description: 'A Gostash-specific convention for defining the final event to be sent. You build your complete UDM event in a temporary field (e.g., "event"), and then merge it into the special "@output" field at the very end of the pipeline.',
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

const LogstashPanel = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleToggle = (index) => {
    setExpandedIndex(prevIndex => (prevIndex === index ? null : index));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-solarized-base02 rounded-xl p-6 shadow-lg w-full space-y-4"
    >
      {logstashOperations.map((op, index) => (
        <div key={op.name} className="border-b border-solarized-base01 pb-4 last:border-b-0">
          <div
            onClick={() => handleToggle(index)}
            className="flex items-center cursor-pointer py-2"
          >
            <ArrowIcon isExpanded={expandedIndex === index} />
            <h2 className="ml-2 font-mono text-xl text-solarized-cyan">{op.name}</h2>
          </div>

          <AnimatePresence>
            {expandedIndex === index && (
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
      ))}
    </motion.div>
  );
};

export default LogstashPanel;