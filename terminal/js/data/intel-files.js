/**
 * Hardcoded intel file registry for the terminal desktop.
 * Each entry describes a file visible in the Intel Browser window.
 */
export const INTEL_FILES = [
  {
    name: 'OPERATION_NEXUS.md', type: 'document', classification: 'secret', size: '4.2 KB',
    title: 'Operation Nexus - Mission Brief',
    content: '<p>Priority mission targeting DataVault Corp\'s illegal data harvesting operations.</p><p>Primary objective: Identify and document the scope of unauthorized personal data collection affecting EU citizens.</p><p>Agent <span class="redacted">\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588</span> has confirmed insider access. Extraction window: 72 hours.</p>',
    tags: ['Active', 'Priority-1', 'DataVault'],
  },
  {
    name: 'PERSONNEL_CHEN.md', type: 'personnel', classification: 'confidential', size: '2.8 KB',
    title: 'Personnel File: Dr. Sarah Chen',
    content: '<p>Former DataVault Corp lead architect. Turned whistleblower after discovering Project Panopticon.</p><p>Current status: Under DSU protection program.</p><p>Expertise: Distributed systems, encryption protocols, data anonymization.</p>',
    tags: ['Whistleblower', 'Protected', 'Technical'],
  },
  {
    name: 'INTERCEPT_7734.md', type: 'intercept', classification: 'secret', size: '1.5 KB',
    title: 'Intercepted Communication #7734',
    content: '<p>Source: Internal DataVault Slack channel</p><p>Timestamp: 2025-03-14 02:34 UTC</p><p>"The regulators are getting close. Start the <span class="redacted">\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588</span> protocol immediately."</p>',
    tags: ['Urgent', 'Evidence', 'Destruction'],
  },
  {
    name: 'FACILITY_MAP.md', type: 'document', classification: 'confidential', size: '8.1 KB',
    title: 'DataVault Frankfurt Facility',
    content: '<p>Primary data center location confirmed: Frankfurt Industrial District, Building 7.</p><p>Security: 24/7 guards, biometric access, internal network air-gapped.</p>',
    tags: ['Location', 'Security', 'Frankfurt'],
  },
  {
    name: 'DECRYPTED_LOGS.md', type: 'data', classification: 'unclassified', size: '156 KB',
    title: 'Decrypted Access Logs',
    content: '<p>Successfully decrypted server access logs from February 2025.</p><p>Key findings: 47 million unique EU citizen records accessed.</p>',
    tags: ['Evidence', 'Logs', 'GDPR-Violation'],
  },
  {
    name: 'CONTACT_RAVEN.md', type: 'personnel', classification: 'secret', size: '1.2 KB',
    title: 'Asset: RAVEN',
    content: '<p>Codename: RAVEN</p><p>Position: DataVault Corp - Senior Systems Administrator</p><p>Recruitment date: <span class="redacted">\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588</span></p><p>Motivation: Financial + ideological</p><p>Reliability rating: B+</p><p>Handler: <span class="redacted">\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588</span></p>',
    tags: ['Asset', 'Inside-Source', 'Active'],
  },
];
