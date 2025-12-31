/**
 * Index Knowledge Base to Vectorize
 *
 * Parses markdown files from knowledge/programs/, extracts metadata from
 * frontmatter, generates embeddings via Workers AI, and uploads to Vectorize.
 *
 * Usage:
 *   node index-knowledge-base.js [--dry-run] [--verbose] [path-pattern]
 *
 * Environment:
 *   CF_ACCOUNT_ID - Cloudflare account ID
 *   CF_API_TOKEN  - Cloudflare API token
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRAMS_DIR = path.join(__dirname, '..', '..', 'knowledge', 'programs');
const VECTORIZE_INDEX = 'slc-knowledge-base';

// Valid venture stages
const VENTURE_STAGES = ['idea-stage', 'early-stage', 'growth-stage', 'scale-stage'];

// Canvas sections (hyphenated form used in tags)
const CANVAS_SECTIONS = [
  'purpose', 'customers', 'jobs-to-be-done', 'unique-value-proposition',
  'solution', 'channels', 'revenue', 'costs', 'key-metrics', 'advantage', 'impact'
];

// Section to model mapping
const SECTION_TO_MODEL = {
  'customers': 'customer',
  'jobs-to-be-done': 'customer',
  'unique-value-proposition': 'customer',
  'solution': 'customer',
  'channels': 'economic',
  'revenue': 'economic',
  'costs': 'economic',
  'advantage': 'economic',
  'impact': 'impact',
};

// Content type markers (presence means it's an example)
const EXAMPLE_TAGS = ['canvas-example', 'case-study', 'report'];

// Impact areas (SDGs + thematic)
const IMPACT_AREAS = [
  // SDGs
  'sdg-01-no-poverty', 'sdg-02-zero-hunger', 'sdg-03-good-health-and-well-being',
  'sdg-04-quality-education', 'sdg-05-gender-equality', 'sdg-06-clean-water-and-sanitation',
  'sdg-07-affordable-and-clean-energy', 'sdg-08-decent-work-and-economic-growth',
  'sdg-09-industry-innovation-and-infrastructure', 'sdg-10-reduced-inequalities',
  'sdg-11-sustainable-cities-and-communities', 'sdg-12-responsible-consumption-and-production',
  'sdg-13-climate-action', 'sdg-14-life-below-water', 'sdg-15-life-on-land',
  'sdg-16-peace-justice-and-strong-institutions', 'sdg-17-partnerships-for-the-goals',
  // Thematic
  'agriculture', 'air', 'biodiversity-and-ecosystems', 'climate', 'diversity-and-inclusion',
  'education', 'employment', 'energy', 'financial-services', 'health', 'infrastructure',
  'land', 'oceans-and-coastal-zones', 'pollution', 'real-estate', 'waste', 'water'
];

// Industries
const INDUSTRIES = [
  'agriculture', 'apparel', 'circular-economy', 'clean-energy', 'creative-industries',
  'education', 'financial-services', 'food-beverage', 'healthcare', 'housing',
  'ict', 'logistics', 'manufacturing', 'oceans', 'tourism-hospitality', 'water-sanitation',
  'consulting'
];

// Helpers
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRelativePath(filePath) {
  return path.relative(PROGRAMS_DIR, filePath).replace(/\\/g, '/');
}

function shouldSkip(filePath) {
  const basename = path.basename(filePath, '.md').toLowerCase();
  const relativePath = getRelativePath(filePath).toLowerCase();

  if (basename === 'readme') return { skip: true, reason: 'README file' };
  if (basename.includes('library')) return { skip: true, reason: 'Library file' };
  if (relativePath.includes('attachments')) return { skip: true, reason: 'Attachment' };

  return { skip: false };
}

function generateDocumentId(filePath) {
  const relativePath = getRelativePath(filePath);
  // Create a short hash-based ID (max 64 bytes for Vectorize)
  // Format: {program}:{hash} e.g., "generic:a1b2c3d4"
  const pathParts = relativePath.split('/');
  const program = pathParts[0] || 'default';
  const hash = crypto.createHash('sha256').update(relativePath).digest('hex').substring(0, 16);
  return `${program}:${hash}`;
}

/**
 * Map frontmatter to Vectorize metadata
 *
 * Schema (4 indexed fields):
 * - content_type: 'example' | 'methodology'
 * - canvas_section: section identifier
 * - venture_stage: the only dimension (exact match)
 * - tags: sorted, space-separated venture properties
 *
 * Program filtering uses Vectorize namespace, not metadata field.
 *
 * Content is stored truncated (max 8KB) to stay under Vectorize 10KB limit.
 */
function mapFrontmatterToMetadata(filePath, frontmatter, content) {
  const tags = frontmatter.tags || [];
  const relativePath = getRelativePath(filePath);

  // Vectorize metadata limit is 10KB. Reserve ~2KB for other fields.
  const MAX_CONTENT_LENGTH = 8000;

  const metadata = {
    title: frontmatter.title || path.basename(filePath, '.md'),
    file_path: relativePath,  // Store original path for reference
    // Store truncated content for RAG retrieval
    content: content.length > MAX_CONTENT_LENGTH
      ? content.substring(0, MAX_CONTENT_LENGTH) + '\n...[truncated]'
      : content,
  };

  // 1. content_type: Check for example markers
  const isExample = tags.some(t => EXAMPLE_TAGS.includes(t));
  metadata.content_type = isExample ? 'example' : 'methodology';

  // 2. venture_stage: First match from stage tags (the only dimension)
  const stage = tags.find(t => VENTURE_STAGES.includes(t));
  if (stage) metadata.venture_stage = stage;

  // 3. canvas_section: First match from section tags
  const section = tags.find(t => CANVAS_SECTIONS.includes(t));
  if (section) metadata.canvas_section = section;

  // 4. tags: Aggregate all other venture properties into sorted, space-separated string
  // Exclude stage, section, and example markers (already captured in dedicated fields)
  const venturePropertyTags = tags
    .filter(t => !VENTURE_STAGES.includes(t) && !CANVAS_SECTIONS.includes(t) && !EXAMPLE_TAGS.includes(t))
    .sort();
  if (venturePropertyTags.length > 0) {
    metadata.tags = venturePropertyTags.join(' ');
  }

  return metadata;
}

async function generateEmbedding(text, config) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/@cf/baai/bge-m3`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text] }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  if (!data.success || !data.result?.data?.[0]) {
    throw new Error(`Embedding API returned invalid response: ${JSON.stringify(data)}`);
  }

  return data.result.data[0];
}

async function uploadToVectorize(documents, config, dryRun) {
  if (dryRun) {
    console.log(`\n[DRY RUN] Would upload ${documents.length} documents to Vectorize`);
    return { uploaded: documents.length, errors: 0 };
  }

  const BATCH_SIZE = 100;
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    const ndjson = batch.map(doc => JSON.stringify({
      id: doc.id,
      values: doc.values,
      metadata: doc.metadata,
    })).join('\n');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/vectorize/v2/indexes/${VECTORIZE_INDEX}/upsert`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/x-ndjson',
        },
        body: ndjson,
      }
    );

    if (response.ok) {
      uploaded += batch.length;
      console.log(`   Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} documents`);
    } else {
      const error = await response.text();
      console.error(`   Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error}`);
      errors += batch.length;
    }

    // Rate limit
    await sleep(100);
  }

  return { uploaded, errors };
}

async function processFile(filePath, config, verbose) {
  const relativePath = getRelativePath(filePath);

  const skipCheck = shouldSkip(filePath);
  if (skipCheck.skip) {
    if (verbose) console.log(`SKIP: ${relativePath} (${skipCheck.reason})`);
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);

    const documentId = generateDocumentId(filePath);
    // Pass content to store in metadata for RAG retrieval
    const metadata = mapFrontmatterToMetadata(filePath, frontmatter, content);

    // Combine title and content for embedding
    const textToEmbed = `${metadata.title}\n\n${content}`.substring(0, 30000); // Truncate for safety

    if (verbose) {
      console.log(`\nProcessing: ${relativePath}`);
      console.log(`   ID: ${documentId}`);
      console.log(`   Content Type: ${metadata.content_type}`);
      if (metadata.venture_stage) console.log(`   Stage: ${metadata.venture_stage}`);
      if (metadata.canvas_section) console.log(`   Section: ${metadata.canvas_section}`);
      if (metadata.tags) console.log(`   Tags: ${metadata.tags.substring(0, 60)}${metadata.tags.length > 60 ? '...' : ''}`);
    }

    return {
      id: documentId,
      filePath: relativePath,
      content: textToEmbed,
      metadata,
    };

  } catch (error) {
    console.error(`Error processing ${relativePath}: ${error.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  const targetPath = args.find(a => !a.startsWith('--')) || '**/*.md';

  // Validate environment
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;

  if (!accountId || !apiToken) {
    console.error('Error: Missing environment variables');
    console.error('   Required: CF_ACCOUNT_ID, CF_API_TOKEN');
    console.error('\nSet them with:');
    console.error('   export CF_ACCOUNT_ID=<your-account-id>');
    console.error('   export CF_API_TOKEN=<your-api-token>');
    process.exit(1);
  }

  const config = { accountId, apiToken };

  console.log(`\nKnowledge Base Indexing`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Target: ${targetPath}`);
  console.log(`   Account: ${accountId.substring(0, 8)}...`);
  console.log(`   Index: ${VECTORIZE_INDEX}\n`);

  // Discover files
  const pattern = path.join(PROGRAMS_DIR, targetPath).replace(/\\/g, '/');
  const files = await glob(pattern);
  console.log(`Found ${files.length} files to process\n`);

  // Process files
  const documents = [];
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const doc = await processFile(file, config, verbose);
    if (doc) {
      documents.push(doc);
    } else {
      skipped++;
    }
  }

  console.log(`\nParsed ${documents.length} documents (${skipped} skipped)`);

  if (documents.length === 0) {
    console.log('No documents to index.');
    return;
  }

  // Generate embeddings
  console.log(`\nGenerating embeddings via Workers AI...`);
  const EMBEDDING_BATCH_SIZE = 10;
  let embeddingErrors = 0;

  for (let i = 0; i < documents.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = documents.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchNum = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(documents.length / EMBEDDING_BATCH_SIZE);

    if (!dryRun) {
      console.log(`   Embedding batch ${batchNum}/${totalBatches}...`);

      for (const doc of batch) {
        try {
          doc.values = await generateEmbedding(doc.content, config);
          await sleep(50); // Rate limit
        } catch (error) {
          console.error(`   Error embedding ${doc.id}: ${error.message}`);
          doc.values = null;
          embeddingErrors++;
        }
      }
    } else {
      console.log(`   [DRY RUN] Would generate embeddings for batch ${batchNum}/${totalBatches}`);
    }
  }

  // Filter out failed embeddings
  const validDocs = dryRun ? documents : documents.filter(d => d.values !== null);
  console.log(`\nEmbeddings generated: ${validDocs.length} (${embeddingErrors} errors)`);

  // Upload to Vectorize
  console.log(`\nUploading to Vectorize...`);
  const uploadResult = await uploadToVectorize(validDocs, config, dryRun);

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Summary:`);
  console.log(`   Files found: ${files.length}`);
  console.log(`   Documents parsed: ${documents.length}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Embeddings generated: ${validDocs.length}`);
  console.log(`   Embedding errors: ${embeddingErrors}`);
  console.log(`   Uploaded to Vectorize: ${uploadResult.uploaded}`);
  console.log(`   Upload errors: ${uploadResult.errors}`);

  // Stats by program
  const byProgram = {};
  const byContentType = {};
  for (const doc of documents) {
    byProgram[doc.metadata.program] = (byProgram[doc.metadata.program] || 0) + 1;
    byContentType[doc.metadata.content_type] = (byContentType[doc.metadata.content_type] || 0) + 1;
  }

  console.log(`\nBy program:`);
  Object.entries(byProgram).forEach(([p, c]) => console.log(`   ${p}: ${c}`));

  console.log(`\nBy content type:`);
  Object.entries(byContentType).forEach(([t, c]) => console.log(`   ${t}: ${c}`));
}

main().catch(console.error);
