import type { IFilterOperatorHandler } from './filter-operator-handler.interface.js';
import type { TypeOrmConditionFragment } from '../type-orm-filter-fragment-builder.js';
import { FilterOperator, type Filter } from '@nulledexp/translatable-criteria';
import type { TypeOrmParameterManager } from '../type-orm-parameter-manager.js';

/**
 * Handles ARRAY_CONTAINS_ANY_ELEMENT, ARRAY_CONTAINS_ALL_ELEMENTS and their NOT counterparts.
 */
export class ArrayContainsAnyAllElementsHandler implements IFilterOperatorHandler {
  /**
   * Constructs a new ArrayContainsAnyAllElementsHandler.
   * @param not True if the operator is a NOT operator, false otherwise.
   */
  constructor(private not: boolean = false) {}

  /**
   * @inheritdoc
   */
  public build(
    fieldName: string,
    filter: Filter<string, any>,
    parameterManager: TypeOrmParameterManager,
  ): TypeOrmConditionFragment {
    const value = filter.value as Record<string, any>;
    const key = Object.keys(value)[0]!;
    const elements = value[key] as any[];
    const path = key;

    if (elements.length === 0) {
      return { queryFragment: '1=1', parameters: {} };
    }

    const isAllOperator =
      filter.operator === FilterOperator.ARRAY_CONTAINS_ALL_ELEMENTS ||
      filter.operator === FilterOperator.ARRAY_NOT_CONTAINS_ALL_ELEMENTS;

    // Helper to build JSON structure for a value at path
    const buildStructure = (val: any) => {
      const parts = path.split('.');
      let current: any = val;

      for (let i = parts.length - 1; i >= 0; i--) {
        const k = parts[i]!;
        current = { [k]: current };
      }
      return current;
    };

    if (isAllOperator) {
      // ALL: Check if contains all elements.
      // col @> {path: [all_elements]}
      const structure = buildStructure(elements);
      const paramName = parameterManager.generateParamName();

      const operator = this.not ? 'NOT ' : '';
      const condition = `${operator}${fieldName} @> :${paramName}::jsonb`;

      return {
        queryFragment: this.not
          ? `(${fieldName} IS NULL OR ${condition})`
          : condition,
        parameters: { [paramName]: JSON.stringify(structure) },
      };
    } else {
      // ANY: Check if contains any element.
      // (col @> {path: [elem1]} OR col @> {path: [elem2]})

      const conditions: string[] = [];
      const parameters: { [key: string]: any } = {};

      elements.forEach((elem) => {
        const structure = buildStructure([elem]);
        const paramName = parameterManager.generateParamName();
        conditions.push(`${fieldName} @> :${paramName}::jsonb`);
        parameters[paramName] = JSON.stringify(structure);
      });

      if (this.not) {
        // NOT ANY: NOT (A OR B) -> (NOT A AND NOT B)
        const notConditions = conditions.map((cond) => `NOT (${cond})`);
        const joined = notConditions.join(' AND ');
        return {
          queryFragment: `(${fieldName} IS NULL OR (${joined}))`,
          parameters,
        };
      } else {
        const joined = conditions.join(' OR ');
        return {
          queryFragment: `(${joined})`,
          parameters,
        };
      }
    }
  }
}
