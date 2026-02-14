import type { IFilterOperatorHandler } from './filter-operator-handler.interface.js';
import type { TypeOrmConditionFragment } from '../type-orm-filter-fragment-builder.js';
import { FilterOperator, type Filter } from '@nulledexp/translatable-criteria';
import type { TypeOrmParameterManager } from '../type-orm-parameter-manager.js';
import type { ObjectLiteral } from 'typeorm';

/**
 * Handles ARRAY_CONTAINS_ELEMENT and ARRAY_NOT_CONTAINS_ELEMENT operators for JSON arrays.
 */
export class ArrayContainsElementHandler implements IFilterOperatorHandler {
  /**
   * @inheritdoc
   */
  public build(
    fieldName: string,
    filter: Filter<
      string,
      | FilterOperator.ARRAY_CONTAINS_ELEMENT
      | FilterOperator.ARRAY_NOT_CONTAINS_ELEMENT
    >,
    parameterManager: TypeOrmParameterManager,
  ): TypeOrmConditionFragment {
    const value = filter.value;
    let path: string | undefined;
    let elementValue: any;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const key = Object.keys(value)[0]!;
      path = key;
      elementValue = (value as ObjectLiteral)[key];
    } else {
      elementValue = value;
    }

    let jsonStructure: any;

    if (path) {
      // Construct nested object from path
      // path is "a.b" -> parts ["a", "b"]
      const parts = path.split('.');

      // Build object from inside out
      // Start with the array containing the element
      let current: any = [elementValue];

      for (let i = parts.length - 1; i >= 0; i--) {
        const key = parts[i]!;
        current = { [key]: current };
      }
      jsonStructure = current;
    } else {
      jsonStructure = [elementValue];
    }

    const paramName = parameterManager.generateParamName();
    const jsonValue = JSON.stringify(jsonStructure);

    const isNotContains =
      filter.operator === FilterOperator.ARRAY_NOT_CONTAINS_ELEMENT;

    const operator = isNotContains ? 'NOT ' : '';

    return {
      queryFragment: `${operator}${fieldName} @> :${paramName}::jsonb`,
      parameters: { [paramName]: jsonValue },
    };
  }
}
