/**
 * Model Managers
 *
 * Export all Model Manager interfaces and implementations.
 */

// Interface and types
export type {
  IModelManager,
  ModelData,
  UpdateResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ModelCompletion,
  SectionRule,
  CustomerSectionId,
  EconomicSectionId,
  CustomerModelData,
  EconomicModelData,
  ImpactModelData,
} from './IModelManager';

// Implementations
export { CustomerModelManager } from './CustomerModelManager';
export { EconomicModelManager } from './EconomicModelManager';
export { ImpactModelManager } from './ImpactModelManager';
