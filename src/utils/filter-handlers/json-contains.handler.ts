import { Filter, FilterOperator } from '@nulledexp/translatable-criteria';
import type { IFilterOperatorHandler } from './filter-operator-handler.interface.js';
import type { TypeOrmConditionFragment } from '../type-orm-filter-fragment-builder.js';
import type { TypeOrmParameterManager } from '../type-orm-parameter-manager.js';

export class JsonContainsHandler implements IFilterOperatorHandler {
  public build(
    fieldName: string,
    filter: Filter<
      string,
      FilterOperator.JSON_CONTAINS | FilterOperator.JSON_NOT_CONTAINS
    >,
    parameterManager: TypeOrmParameterManager,
  ): TypeOrmConditionFragment {
    if (typeof filter.value !== 'object' || filter.value === null) {
      return {
        queryFragment: '1=0',
        parameters: {},
      };
    }

    const paramName = parameterManager.generateParamName();
    const isNotContains = filter.operator === FilterOperator.JSON_NOT_CONTAINS;
    const operator = isNotContains ? 'NOT ' : '';

    return {
      queryFragment: `${operator}${fieldName} @> :${paramName}::jsonb`,
      parameters: { [paramName]: JSON.stringify(filter.value) },
    };
  }
}
