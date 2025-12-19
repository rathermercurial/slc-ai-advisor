<%*
/**
 * SLC Knowledge Base Metadata Template - PRODUCTION VERSION
 * 
 * Features:
 * - Multi-select capability for all categories
 * - Complete tag taxonomy coverage
 * - Robust error handling
 * - Hierarchical auto-completion
 * - Venture-type categorization with / separators
 * - Consistent user experience
 * - "None" options for all top-level categories
 * - Description field for content summaries
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Adds parent tags automatically for hierarchical canvas-sections
 * Ensures proper tag inheritance according to SLC structure
 */
function addCanvasParentTags(selectedTag) {
    const hierarchies = {
        // Customer Model hierarchy
        'early-adopters': ['customer-model', 'customers', 'early-adopters'],
        'customers': ['customer-model', 'customers'],
        'existing-alternatives': ['customer-model', 'jobs-to-be-done', 'existing-alternatives'],
        'jobs-to-be-done': ['customer-model', 'jobs-to-be-done'],
        'unique-value-proposition': ['customer-model', 'unique-value-proposition'],
        'solution': ['customer-model', 'solution'],
        'customer-model': ['customer-model'],
        
        // Impact Model hierarchy
        'issue': ['impact-model', 'issue'],
        'participants': ['impact-model', 'participants'],
        'activities': ['impact-model', 'activities'],
        'outputs': ['impact-model', 'outputs'],
        'short-term-outcomes': ['impact-model', 'short-term-outcomes'],
        'medium-term-outcomes': ['impact-model', 'medium-term-outcomes'],
        'long-term-outcomes': ['impact-model', 'long-term-outcomes'],
        'impact': ['impact-model', 'impact'],
        'impact-model': ['impact-model'],
        
        // Economic Model hierarchy
        'channels': ['economic-model', 'channels'],
        'revenue': ['economic-model', 'revenue'],
        'costs': ['economic-model', 'costs'],
        'advantage': ['economic-model', 'advantage'],
        'financial-model': ['economic-model', 'financial-model'],
        'economic-model': ['economic-model'],
        
        // Standalone tags
        'purpose': ['purpose'],
        'key-metrics': ['key-metrics']
    };
    
    return hierarchies[selectedTag] || [selectedTag];
}

/**
 * Ensures a value is always returned as an array
 * Handles both single selections and multi-selections consistently
 */
function ensureArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

/**
 * Removes duplicates from array and sorts alphabetically
 */
function cleanAndSort(array) {
    return [...new Set(array)].sort();
}

// ============================================================================
// DESCRIPTION INPUT
// ============================================================================

const description = await tp.system.prompt("Description (brief summary of purpose and contents):") || "";

// ============================================================================
// CANVAS SECTIONS - Hierarchical Multi-Select WITH NONE OPTION
// ============================================================================

let canvasSections = [];

// First check if user wants to add canvas sections at all
const addCanvasSections = await tp.system.suggester(
    ["Yes - Add canvas sections", "No - Skip canvas sections (none)"], 
    [true, false], 
    false, 
    "Add canvas section tags?"
);

if (addCanvasSections) {
    let continueCanvas = true;

    while (continueCanvas) {
        // Primary category selection
        const categories = await tp.system.suggester([
            "purpose",
            "customer-model", 
            "impact-model",
            "economic-model",
            "key-metrics"
        ], [
            "purpose",
            "customer-model",
            "impact-model", 
            "economic-model",
            "key-metrics"
        ], true, "Select canvas section category/categories:");
        
        if (!categories || categories.length === 0) break;
        
        const categoryList = ensureArray(categories);
        
        // Process each selected category
        for (const category of categoryList) {
            if (category === "customer-model") {
                const subOptions = await tp.system.suggester([
                    "customer-model (general)",
                    "customers",
                    "early-adopters",
                    "jobs-to-be-done", 
                    "existing-alternatives",
                    "unique-value-proposition",
                    "solution"
                ], [
                    "customer-model",
                    "customers",
                    "early-adopters",
                    "jobs-to-be-done",
                    "existing-alternatives",
                    "unique-value-proposition", 
                    "solution"
                ], true, "Select customer model component(s):");
                
                const subList = ensureArray(subOptions);
                for (const sub of subList) {
                    const tagsToAdd = addCanvasParentTags(sub);
                    canvasSections = canvasSections.concat(tagsToAdd);
                }
                
            } else if (category === "impact-model") {
                const subOptions = await tp.system.suggester([
                    "impact-model (general)",
                    "issue",
                    "participants",
                    "activities", 
                    "outputs",
                    "short-term-outcomes",
                    "medium-term-outcomes",
                    "long-term-outcomes",
                    "impact"
                ], [
                    "impact-model",
                    "issue",
                    "participants", 
                    "activities",
                    "outputs",
                    "short-term-outcomes",
                    "medium-term-outcomes", 
                    "long-term-outcomes",
                    "impact"
                ], true, "Select impact model component(s):");
                
                const subList = ensureArray(subOptions);
                for (const sub of subList) {
                    const tagsToAdd = addCanvasParentTags(sub);
                    canvasSections = canvasSections.concat(tagsToAdd);
                }
                
            } else if (category === "economic-model") {
                const subOptions = await tp.system.suggester([
                    "economic-model (general)",
                    "channels",
                    "revenue",
                    "costs",
                    "advantage", 
                    "financial-model"
                ], [
                    "economic-model",
                    "channels",
                    "revenue",
                    "costs",
                    "advantage",
                    "financial-model"
                ], true, "Select economic model component(s):");
                
                const subList = ensureArray(subOptions);
                for (const sub of subList) {
                    const tagsToAdd = addCanvasParentTags(sub);
                    canvasSections = canvasSections.concat(tagsToAdd);
                }
            } else {
                // Handle purpose and key-metrics
                const tagsToAdd = addCanvasParentTags(category);
                canvasSections = canvasSections.concat(tagsToAdd);
            }
        }
        
        continueCanvas = await tp.system.suggester(
            ["Yes", "No"], 
            [true, false], 
            false, 
            "Add more canvas sections?"
        );
    }

    canvasSections = cleanAndSort(canvasSections);
}

// ============================================================================
// CONTENT TAGS - Multi-Select WITH NONE OPTION
// ============================================================================

let contentTags = [];

// Check if user wants to add content tags
const addContentTags = await tp.system.suggester(
    ["Yes - Add content types", "No - Skip content types (none)"], 
    [true, false], 
    false, 
    "Add content type tags?"
);

if (addContentTags) {
    let continueContent = true;

    while (continueContent) {
        const contentOptions = [
            "canvas-example", "case-study", "template", "concept", "lexicon-entry",
            "strategy-model", "experiment-test", "resource", "link", "design", 
            "design-note", "prompt", "admin", "video-content"
        ];
        
        const selectedContent = await tp.system.suggester(
            contentOptions, 
            contentOptions, 
            true, 
            "Select content type(s):"
        );
        
        if (!selectedContent || selectedContent.length === 0) break;
        
        const contentList = ensureArray(selectedContent);
        contentTags = contentTags.concat(contentList);
        
        continueContent = await tp.system.suggester(
            ["Yes", "No"], 
            [true, false], 
            false, 
            "Add more content types?"
        );
    }

    contentTags = cleanAndSort(contentTags);
}

// ============================================================================
// VENTURE STAGE TAGS - Multi-Select WITH NONE OPTION
// ============================================================================

let ventureStageTags = [];

// Check if user wants to add venture stage tags
const addVentureStages = await tp.system.suggester(
    ["Yes - Add venture stages", "No - Skip venture stages (none)"], 
    [true, false], 
    false, 
    "Add venture stage tags?"
);

if (addVentureStages) {
    let continueStage = true;

    while (continueStage) {
        const stageOptions = ["idea-stage", "early-stage", "growth-stage", "scale-stage"];
        
        const selectedStages = await tp.system.suggester(
            stageOptions, 
            stageOptions, 
            true, 
            "Select venture stage(s):"
        );
        
        if (!selectedStages || selectedStages.length === 0) break;
        
        const stageList = ensureArray(selectedStages);
        ventureStageTags = ventureStageTags.concat(stageList);
        
        continueStage = await tp.system.suggester(
            ["Yes", "No"], 
            [true, false], 
            false, 
            "Add more venture stages?"
        );
    }

    ventureStageTags = cleanAndSort(ventureStageTags);
}

// ============================================================================
// VENTURE TYPE TAGS - Categorized Multi-Select WITH NONE OPTION
// ============================================================================

let ventureTypes = [];

// Check if user wants to add venture type tags
const addVentureTypes = await tp.system.suggester(
    ["Yes - Add venture types", "No - Skip venture types (none)"], 
    [true, false], 
    false, 
    "Add venture type tags?"
);

if (addVentureTypes) {
    let continueVentureType = true;
    
    while (continueVentureType) {
        // Select venture type categories
        const categories = await tp.system.suggester([
            "impact-area", "legal-structure", "revenue-source", 
            "funding-source", "impact-mechanism", "industry"
        ], [
            "impact-area", "legal-structure", "revenue-source", 
            "funding-source", "impact-mechanism", "industry"
        ], true, "Select venture type category/categories:");
        
        if (!categories || categories.length === 0) break;
        
        const categoryList = ensureArray(categories);
        
        // Process each selected category
        for (const category of categoryList) {
            let options = [];
            
            // Complete taxonomy options for each category
            switch (category) {
                case "impact-area":
                    options = [
                        // UN SDG Tags (17 total)
                        "sdg-01-no-poverty", "sdg-02-zero-hunger", "sdg-03-good-health-and-well-being",
                        "sdg-04-quality-education", "sdg-05-gender-equality", "sdg-06-clean-water-and-sanitation",
                        "sdg-07-affordable-and-clean-energy", "sdg-08-decent-work-and-economic-growth",
                        "sdg-09-industry-innovation-and-infrastructure", "sdg-10-reduced-inequalities",
                        "sdg-11-sustainable-cities-and-communities", "sdg-12-responsible-consumption-and-production",
                        "sdg-13-climate-action", "sdg-14-life-below-water", "sdg-15-life-on-land",
                        "sdg-16-peace-justice-and-strong-institutions", "sdg-17-partnerships-for-the-goals",
                        // IRIS+ Theme Tags (17 total)
                        "agriculture", "air", "biodiversity-and-ecosystems", "climate", "diversity-and-inclusion",
                        "education", "employment", "energy", "financial-services", "health", "infrastructure",
                        "land", "oceans-and-coastal-zones", "pollution", "real-estate", "waste", "water"
                    ];
                    break;
                    
                case "legal-structure":
                    options = [
                        "charity", "nonprofit-inc", "trust", "foundation", "cooperative", 
                        "benefit-corporation", "cic", "l3c", "standard-limited-company"
                    ];
                    break;
                    
                case "revenue-source":
                    options = [
                        "service-fees", "product-sales", "membership-dues", "subscriptions", "licensing-royalty",
                        "platform-commission", "advertising-sponsorship", "government-contracts", 
                        "outcome-payments", "philanthropy-grants"
                    ];
                    break;
                    
                case "funding-source":
                    options = [
                        "bootstrapped", "grants", "donations", "impact-equity", "concessional-debt", 
                        "crowdfunding", "blended-finance", "traditional-investment"
                    ];
                    break;
                    
                case "impact-mechanism":
                    options = [
                        "product-service-impact", "employment-model", "reinvest-surplus", "cross-subsidy",
                        "direct-service", "policy-advocacy", "systems-change", "marketplace-platform",
                        "research-development", "education-awareness"
                    ];
                    break;
                    
                case "industry":
                    options = [
                        "agriculture", "apparel", "clean-energy", "education", "healthcare", "financial-services",
                        "food-beverage", "ict", "manufacturing", "retail", "transportation", "construction",
                        "media", "tourism", "telecommunications", "consulting", "real-estate"
                    ];
                    break;
            }
            
            // Select specific options within the category
            const selected = await tp.system.suggester(
                options, 
                options, 
                true, 
                `Select ${category} type(s):`
            );
            
            const selectedList = ensureArray(selected);
            
            if (selectedList.length > 0) {
                // Add category prefix with / separator for clear categorization
                const prefixed = selectedList.map(tag => `${category}/${tag}`);
                ventureTypes = ventureTypes.concat(prefixed);
            }
        }
        
        continueVentureType = await tp.system.suggester(
            ["Yes", "No"], 
            [true, false], 
            false, 
            "Add more venture type categories?"
        );
    }

    ventureTypes = cleanAndSort(ventureTypes);
}

// ============================================================================
// SOURCE URL INPUT
// ============================================================================

const source = await tp.system.prompt("Source URL (optional):") || "";

// ============================================================================
// TEMPLATE OUTPUT
// ============================================================================
-%>
---
title: <% tp.file.title %>
description: <% description %>
last_updated: <% tp.date.now("YYYY-MM-DD") %>
source: <% source %>
tags:
  canvas-sections: [<% canvasSections.join(', ') %>]
  content: [<% contentTags.join(', ') %>]
  venture-stage: [<% ventureStageTags.join(', ') %>]
  venture-type: [<% ventureTypes.join(', ') %>]
---

# <% tp.file.title %>

[Content goes here]