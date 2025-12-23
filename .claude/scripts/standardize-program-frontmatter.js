/**
 * Standardize program frontmatter across all program files
 *
 * Transformation rules:
 * 1. Remove: last_updated, source (when null/empty)
 * 2. Fix: title typos (remove "title:" prefix)
 * 3. Flatten: nested tag objects to flat arrays
 * 4. Strip: path prefixes from dimension values
 * 5. Add: frontmatter to content files missing it
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRAMS_DIR = path.join(__dirname, '..', '..', 'knowledge', 'programs');

// Canvas section mappings from path keywords
const CANVAS_SECTION_KEYWORDS = {
  'purpose': 'purpose',
  'customer-model': 'customer-model',
  'customers': 'customers',
  'early-adopters': 'early-adopters',
  'jobs-to-be-done': 'jobs-to-be-done',
  'existing-alternatives': 'existing-alternatives',
  'unique-value-proposition': 'unique-value-proposition',
  'solution': 'solution',
  'impact-model': 'impact-model',
  'impact': 'impact',
  'economic-model': 'economic-model',
  'channels': 'channels',
  'revenue': 'revenue',
  'costs': 'costs',
  'advantage': 'advantage',
  'key-metrics': 'key-metrics',
  'strategy': 'strategy',
  'validation': 'validation',
};

// Model mappings
const MODEL_KEYWORDS = {
  'customer-model': 'customer-model',
  'customers': 'customer-model',
  'jobs': 'customer-model',
  'solution': 'customer-model',
  'value-proposition': 'customer-model',
  'impact-model': 'impact-model',
  'impact': 'impact-model',
  'economic-model': 'economic-model',
  'channels': 'economic-model',
  'revenue': 'economic-model',
  'costs': 'economic-model',
  'advantage': 'economic-model',
};

// Content type patterns
const CONTENT_PATTERNS = {
  'business-model-design': /3\.\d/,
  'improving': /4\.\d/,
  'strategy': /5\.\d/,
  'validation-and-iteration': /5\.[3-6]/,
};

function getRelativePath(filePath) {
  return path.relative(PROGRAMS_DIR, filePath).replace(/\\/g, '/');
}

function cleanTitle(title) {
  if (!title) return null;
  // Remove "title:" prefix if present (typo fix)
  let cleaned = title.replace(/^title:\s*/i, '');
  // Remove quotes
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  return cleaned.trim();
}

function deriveTitleFromPath(filePath) {
  const basename = path.basename(filePath, '.md');
  // Remove leading numbers like "3.2.1 "
  const withoutNumbers = basename.replace(/^\d+\.?\d*\.?\d*\s*/, '');
  // Convert to title case
  return withoutNumbers
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim() || basename;
}

function deriveCanvasSectionFromPath(filePath) {
  const relativePath = getRelativePath(filePath).toLowerCase();
  const basename = path.basename(filePath, '.md').toLowerCase();

  // Check filename first
  for (const [keyword, section] of Object.entries(CANVAS_SECTION_KEYWORDS)) {
    if (basename.includes(keyword)) {
      return section;
    }
  }

  // Check path
  for (const [keyword, section] of Object.entries(CANVAS_SECTION_KEYWORDS)) {
    if (relativePath.includes(keyword)) {
      return section;
    }
  }

  return null;
}

function deriveModelFromPath(filePath) {
  const relativePath = getRelativePath(filePath).toLowerCase();
  const basename = path.basename(filePath, '.md').toLowerCase();

  // Check for model references
  for (const [keyword, model] of Object.entries(MODEL_KEYWORDS)) {
    if (basename.includes(keyword) || relativePath.includes(keyword)) {
      return model;
    }
  }

  return null;
}

function deriveContentTypes(filePath) {
  const relativePath = getRelativePath(filePath);
  const types = ['video-content'];

  for (const [type, pattern] of Object.entries(CONTENT_PATTERNS)) {
    if (pattern.test(relativePath)) {
      types.push(type);
      break;
    }
  }

  return types;
}

function flattenNestedTags(tags) {
  if (!tags || typeof tags !== 'object') return [];

  // If it's already an array, return as-is
  if (Array.isArray(tags)) return tags;

  const flatTags = [];

  // Process each nested category
  if (tags['canvas-sections']) {
    flatTags.push(...(Array.isArray(tags['canvas-sections']) ? tags['canvas-sections'] : []));
  }

  if (tags.content) {
    flatTags.push(...(Array.isArray(tags.content) ? tags.content : []));
  }

  if (tags['venture-stage']) {
    flatTags.push(...(Array.isArray(tags['venture-stage']) ? tags['venture-stage'] : []));
  }

  if (tags['venture-type']) {
    for (const vt of (Array.isArray(tags['venture-type']) ? tags['venture-type'] : [])) {
      // Strip path prefix: "impact-area/climate" → "climate"
      const value = vt.includes('/') ? vt.split('/').pop() : vt;
      flatTags.push(value);
    }
  }

  // Deduplicate
  return [...new Set(flatTags)];
}

function isExampleFile(filePath) {
  return getRelativePath(filePath).includes('/examples/');
}

function isContentFile(filePath) {
  return getRelativePath(filePath).includes('/content/');
}

function transformExampleFile(filePath, existingData) {
  const flatTags = flattenNestedTags(existingData.tags);

  const newData = {
    title: cleanTitle(existingData.title) || deriveTitleFromPath(filePath),
  };

  // Keep description if present
  if (existingData.description) {
    newData.description = existingData.description;
  }

  // Only add tags if we have any
  if (flatTags.length > 0) {
    newData.tags = flatTags;
  }

  return newData;
}

function transformContentFile(filePath, existingData) {
  const tags = [];

  // Derive canvas section from path
  const canvasSection = deriveCanvasSectionFromPath(filePath);
  if (canvasSection) tags.push(canvasSection);

  // Add parent model
  const model = deriveModelFromPath(filePath);
  if (model && model !== canvasSection) tags.push(model);

  // Add content types
  const contentTypes = deriveContentTypes(filePath);
  tags.push(...contentTypes);

  // Deduplicate
  const uniqueTags = [...new Set(tags)];

  return {
    title: cleanTitle(existingData?.title) || deriveTitleFromPath(filePath),
    tags: uniqueTags.length > 0 ? uniqueTags : ['video-content'],
  };
}

function shouldSkip(filePath, existingData) {
  const basename = path.basename(filePath, '.md').toLowerCase();

  // Skip README files
  if (basename === 'readme') {
    return { skip: true, reason: 'README file' };
  }

  // Skip library/index files
  if (basename.includes('library') || basename.includes('index')) {
    return { skip: true, reason: 'Library/index file' };
  }

  return { skip: false };
}

async function processFile(filePath, dryRun = false) {
  const relativePath = getRelativePath(filePath);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: existingData, content } = matter(fileContent);

    const skipCheck = shouldSkip(filePath, existingData);
    if (skipCheck.skip) {
      console.log(`SKIP: ${relativePath} (${skipCheck.reason})`);
      return { status: 'skipped', path: relativePath };
    }

    let newData;
    if (isExampleFile(filePath)) {
      newData = transformExampleFile(filePath, existingData);
    } else if (isContentFile(filePath)) {
      newData = transformContentFile(filePath, existingData);
    } else {
      console.log(`SKIP: ${relativePath} (unknown file type)`);
      return { status: 'skipped', path: relativePath };
    }

    // Create new file content
    const newFileContent = matter.stringify(content, newData);

    if (dryRun) {
      console.log(`\nDRY RUN: ${relativePath}`);
      console.log('--- Before ---');
      console.log(JSON.stringify(existingData, null, 2));
      console.log('--- After ---');
      console.log(JSON.stringify(newData, null, 2));
      return { status: 'dry-run', path: relativePath };
    }

    fs.writeFileSync(filePath, newFileContent, 'utf8');
    console.log(`Updated: ${relativePath}`);
    return { status: 'updated', path: relativePath };

  } catch (error) {
    console.error(`Error processing ${relativePath}: ${error.message}`);
    return { status: 'error', path: relativePath, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetPath = args.find(a => !a.startsWith('--')) || '**/*.md';

  console.log(`\nProgram Frontmatter Standardization`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Target: ${targetPath}\n`);

  const pattern = path.join(PROGRAMS_DIR, targetPath).replace(/\\/g, '/');
  const files = await glob(pattern);

  console.log(`Found ${files.length} files to process\n`);

  const results = {
    updated: [],
    skipped: [],
    errors: [],
  };

  for (const file of files) {
    const result = await processFile(file, dryRun);
    if (result.status === 'updated' || result.status === 'dry-run') {
      results.updated.push(result.path);
    } else if (result.status === 'skipped') {
      results.skipped.push(result.path);
    } else if (result.status === 'error') {
      results.errors.push(result);
    }
  }

  console.log(`\nSummary:`);
  console.log(`   Updated: ${results.updated.length}`);
  console.log(`   Skipped: ${results.skipped.length}`);
  console.log(`   Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log(`\nErrors:`);
    results.errors.forEach(e => console.log(`   ${e.path}: ${e.error}`));
  }
}

main().catch(console.error);
