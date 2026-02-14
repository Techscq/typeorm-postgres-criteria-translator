import type { IFilterOperatorHandler } from './filter-operator-handler.interface.js';
import type { TypeOrmConditionFragment } from '../type-orm-filter-fragment-builder.js';
import type { Filter } from '@nulledexp/translatable-criteria';
import type { TypeOrmParameterManager } from '../type-orm-parameter-manager.js';

/**
 * Handles LIKE based comparison operators and their NOT counterparts.
 */
export class LikeComparisonHandler implements IFilterOperatorHandler {
  constructor(
    private pattern: (value: any) => string,
    private not: boolean = false,
    private useIlike: boolean = false,
  ) {}

  /**
   * @inheritdoc
   */
  public build(
    fieldName: string,
    filter: Filter<string, any>,
    parameterManager: TypeOrmParameterManager,
  ): TypeOrmConditionFragment {
    const paramName = parameterManager.generateParamName();
    const operator = this.useIlike ? 'ILIKE' : 'LIKE';
    return {
      queryFragment: `${fieldName} ${this.not ? 'NOT ' : ''}${operator} :${paramName}`,
      parameters: { [paramName]: this.pattern(filter.value) },
    };
  }
}
