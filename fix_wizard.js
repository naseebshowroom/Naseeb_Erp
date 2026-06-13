/**
 * fix_wizard.js
 * Run once from the project root:  node fix_wizard.js
 * Removes the orphan inner-step-component block (lines 898-1298)
 * that was left behind during the StepSchedule / StepCustomer refactor.
 */
const fs   = require('fs')
const path = require('path')

const FILE = path.join(
  __dirname,
  'frontend/src/pages/installments/InstallmentWizard.jsx'
)

const lines = fs.readFileSync(FILE, 'utf8').split('\n')

console.log(`Total lines before fix: ${lines.length}`)

// Find the orphan start marker (line that contains "DEAD_CODE_START")
const startIdx = lines.findIndex(l => l.includes('DEAD_CODE_START'))

// Find the orphan end marker (line that contains "DEAD_CODE_END")
const endIdx = lines.findIndex(l => l.includes('DEAD_CODE_END'))

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find DEAD_CODE markers. File may already be clean.')
  process.exit(1)
}

console.log(`Orphan block: lines ${startIdx + 1}–${endIdx + 1} (0-indexed: ${startIdx}–${endIdx})`)

// Keep everything BEFORE the orphan start, and everything AFTER the orphan end
const cleaned = [
  ...lines.slice(0, startIdx),      // good top section (lines 1 to startIdx)
  ...lines.slice(endIdx + 1),       // good bottom section (after the end marker)
]

console.log(`Total lines after fix: ${cleaned.length}`)

fs.writeFileSync(FILE, cleaned.join('\n'), 'utf8')
console.log('Done! InstallmentWizard.jsx has been cleaned.')
