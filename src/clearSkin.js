const fs = require('fs');
const path = require('path');

// Path to your original skin.json
const inputPath = path.join(__dirname, 'Jsons', 'skin.json');
// Path for the cleaned output
const outputPath = path.join(__dirname, 'Jsons', 'skin_clean.json');

// Load the original JSON
let rawData;
try {
  rawData = fs.readFileSync(inputPath, 'utf-8');
} catch (err) {
  console.error('Failed to read skin.json:', err.message);
  process.exit(1);
}

let skinData;
try {
  skinData = JSON.parse(rawData);
} catch (err) {
  console.error('Invalid JSON format:', err.message);
  process.exit(1);
}

// Ensure skinData.data exists and is an array
const allItems = Array.isArray(skinData.data) ? skinData.data : [];

// Filter items: keep only valid entries
const cleanedItems = allItems.filter((item) => {
  const validId = typeof item.id === 'number';
  const validTypeId = typeof item.typeId === 'number';
  const validStatus = item.status === 0 || item.status === 1;
  return validId && validTypeId && validStatus;
});

// Optional: normalize missing fields
const normalizedItems = cleanedItems.map((item) => ({
  id: item.id,
  typeId: item.typeId,
  status: item.status,
  name: item.name || '',
  iconUrl: item.iconUrl || '',
  resourceId: item.resourceId || '',
  details: item.details || '',
  // keep other fields if needed
  ...item,
}));

// Output cleaned JSON
const outputData = {
  ...skinData,
  data: normalizedItems,
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`Cleaned skin.json saved as ${outputPath}`);
  console.log(`Original items: ${allItems.length}, cleaned items: ${normalizedItems.length}`);
} catch (err) {
  console.error('Failed to write cleaned JSON:', err.message);
  process.exit(1);
}
