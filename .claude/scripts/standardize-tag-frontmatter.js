/**
 * Standardize tag frontmatter across all tag definition files
 *
 * Transformation rules:
 * 1. Remove: last_updated, source, permalink
 * 2. Add dual-form aliases: #tag-name (canonical) + #path/to/tag (hierarchical)
 * 3. Replace generic tags (design, admin) with proper hierarchy
 * 4. Clean title (remove "Tag Definition" suffix)
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TAGS_DIR = path.join(__dirname, '..', 'knowledge', 'tags');

// Category-specific tag mappings
const CATEGORY_TAGS = {
  'canvas': ['canvas-section', 'canvas'],
  'canvas/impact': ['canvas-section', 'canvas'],
  'model': ['model'],
  'venture/stage': ['stage', 'venture/stage'],
  'venture/impact-area': ['venture/dimension', 'venture/impact-area'],
  'venture/industry': ['venture/dimension', 'venture/industry'],
  'venture/impact-mechanism': ['venture/dimension', 'venture/impact-mechanism'],
  'venture/legal-structure': ['venture/dimension', 'venture/legal-structure'],
  'venture/revenue-source': ['venture/dimension', 'venture/revenue-source'],
  'venture/funding-source': ['venture/dimension', 'venture/funding-source'],
  'content': ['content'],
};

// Root-level concept files and their appropriate parent tags
const ROOT_CONCEPT_TAGS = {
  'activities': ['impact-model'],
  'issue': ['impact-model'],
  'outputs': ['impact-model'],
  'participants': ['impact-model'],
  'short-term-outcomes': ['impact-model'],
  'medium-term-outcomes': ['impact-model'],
  'long-term-outcomes': ['impact-model'],
  'customer-discovery': ['concept', 'customer-model'],
  'early-adopters': ['concept', 'customer-model'],
  'existing-alternatives': ['concept', 'customer-model'],
  'financial-model': ['concept', 'economic-model'],
  'job-customer-fit': ['concept', 'validation'],
  'job-solution-fit': ['concept', 'validation'],
  'product-market-fit': ['concept', 'validation'],
};

function getTagNameFromFile(filePath, existingData) {
  // Use permalink if available (preserves canonical names like "customer-model" from customer.md)
  if (existingData.permalink) {
    return existingData.permalink;
  }
  const basename = path.basename(filePath, '.md');
  const relativePath = getRelativePath(filePath).replace(/\\/g, '/');

  // Special handling for venture stages - add "-stage" suffix for consistency
  if (relativePath.startsWith('venture/stage/') && basename !== 'stage' && basename !== 'readme') {
    return `${basename}-stage`;
  }

  return basename;
}

function getRelativePath(filePath) {
  return path.relative(TAGS_DIR, filePath).replace(/\\/g, '/');
}

function getCategoryFromPath(relativePath) {
  const dir = path.dirname(relativePath).replace(/\\/g, '/');
  if (dir === '.') return null; // root level
  return dir;
}

function cleanTitle(title) {
  if (!title) return null;
  // Remove common suffixes
  return title
    .replace(/\s+Tag Definition$/i, '')
    .replace(/\s+Tag$/i, '')
    .replace(/\s+Industry$/i, '')
    .replace(/\s+Impact Area$/i, '')
    .trim();
}

function getCanonicalAlias(tagName) {
  return `#${tagName}`;
}

function getHierarchicalAlias(relativePath) {
  // Remove .md extension and convert to alias format
  const pathWithoutExt = relativePath.replace(/\.md$/, '');
  return `#${pathWithoutExt}`;
}

function getTagsForCategory(category, tagName) {
  if (category && CATEGORY_TAGS[category]) {
    return CATEGORY_TAGS[category];
  }

  // Root-level concepts
  if (!category && ROOT_CONCEPT_TAGS[tagName]) {
    return ROOT_CONCEPT_TAGS[tagName];
  }

  // Fallback for unknown categories
  return ['concept'];
}

function transformFrontmatter(filePath, existingData) {
  const relativePath = getRelativePath(filePath);
  const tagName = getTagNameFromFile(filePath, existingData);
  const category = getCategoryFromPath(relativePath);

  // Skip README files
  if (tagName.toLowerCase() === 'readme') {
    return { skip: true, reason: 'README file' };
  }

  const canonicalAlias = getCanonicalAlias(tagName);
  const hierarchicalAlias = category ? getHierarchicalAlias(relativePath) : null;

  // Skip hierarchical alias if it's redundant (e.g., model/model.md -> #model/model)
  // Only skip when file matches parent dir name (category/category.md pattern)
  const basename = path.basename(filePath, '.md');
  const categoryParts = category ? category.split('/') : [];
  const lastCategoryPart = categoryParts[categoryParts.length - 1];
  const skipHierarchical = hierarchicalAlias && basename === lastCategoryPart;

  const newData = {
    title: cleanTitle(existingData.title) || tagName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    aliases: (hierarchicalAlias && !skipHierarchical)
      ? [canonicalAlias, hierarchicalAlias]
      : [canonicalAlias],
    tags: getTagsForCategory(category, tagName),
  };

  return { data: newData, skip: false };
}

async function processFile(filePath, dryRun = false) {
  const relativePath = getRelativePath(filePath);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: existingData, content } = matter(fileContent);

    const result = transformFrontmatter(filePath, existingData);

    if (result.skip) {
      console.log(`SKIP: ${relativePath} (${result.reason})`);
      return { status: 'skipped', path: relativePath };
    }

    // Create new file content
    const newFileContent = matter.stringify(content, result.data);

    if (dryRun) {
      console.log(`\nDRY RUN: ${relativePath}`);
      console.log('--- Before ---');
      console.log(JSON.stringify(existingData, null, 2));
      console.log('--- After ---');
      console.log(JSON.stringify(result.data, null, 2));
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

  console.log(`\nTag Frontmatter Standardization`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Target: ${targetPath}\n`);

  const pattern = path.join(TAGS_DIR, targetPath).replace(/\\/g, '/');
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
