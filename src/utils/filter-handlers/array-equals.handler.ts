import type { IFilterOperatorHandler } from './filter-operator-handler.interface.js';
import type { TypeOrmConditionFragment } from '../type-orm-filter-fragment-builder.js';
import type { Filter } from '@nulledexp/translatable-criteria';
import type { TypeOrmParameterManager } from '../type-orm-parameter-manager.js';
import type { ObjectLiteral } from 'typeorm';

/**
 * Handles ARRAY_EQUALS and ARRAY_NOT_EQUALS operators for JSON arrays.
 */
export class ArrayEqualsHandler implements IFilterOperatorHandler {
  /**
   * Constructs a new ArrayEqualsHandler.
   * @param not True if the operator is ARRAY_NOT_EQUALS, false otherwise.
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
    const value = filter.value;
    let path: string | undefined;
    let arrayValue: any[];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const key = Object.keys(value)[0]!;
      path = key;
      arrayValue = (value as ObjectLiteral)[key] as any[];
    } else {
      arrayValue = value as any[];
    }

    const paramName = parameterManager.generateParamName();

    let expression: string;
    if (path) {
      const pathParts = path.split('.');
      const pgPath = pathParts.map((p) => `->'${p}'`).join('');
      expression = `${fieldName}${pgPath}`;
    } else {
      expression = fieldName;
    }

    const comparison = `(${expression} @> :${paramName}::jsonb AND ${expression} <@ :${paramName}::jsonb)`;

    const queryFragment = this.not
      ? `(${expression} IS NULL OR NOT ${comparison})`
      : comparison;

    return {
      queryFragment,
      parameters: { [paramName]: JSON.stringify(arrayValue) },
    };
  }
}
