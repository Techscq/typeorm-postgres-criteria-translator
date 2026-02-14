import { Filter, FilterOperator } from '@nulledexp/translatable-criteria';
import type { IFilterOperatorHandler } from './filter-operator-handler.interface.js';
import type { TypeOrmConditionFragment } from '../type-orm-filter-fragment-builder.js';
import type { TypeOrmParameterManager } from '../type-orm-parameter-manager.js';

/**
 * Handles JSON_CONTAINS_ANY, JSON_CONTAINS_ALL and their NOT counterparts.
 */
export class JsonContainsAnyAllHandler implements IFilterOperatorHandler {
  /**
   * Constructs a new JsonContainsAnyAllHandler.
   * @param not True if the operator is a NOT operator, false otherwise.
   */
  constructor(private not: boolean = false) {}

  /**
   * @inheritdoc
   */
  public build(
    fieldName: string,
    filter: Filter<
      string,
      | FilterOperator.JSON_CONTAINS_ANY
      | FilterOperator.JSON_CONTAINS_ALL
      | FilterOperator.JSON_NOT_CONTAINS_ANY
      | FilterOperator.JSON_NOT_CONTAINS_ALL
    >,
    parameterManager: TypeOrmParameterManager,
  ): TypeOrmConditionFragment {
    if (typeof filter.value !== 'object' || filter.value === null) {
      return { queryFragment: '1=0', parameters: {} };
    }

    const pathConditions: string[] = [];
    const parameters: Record<string, any> = {};

    const isAllOperator =
      filter.operator === FilterOperator.JSON_CONTAINS_ALL ||
      filter.operator === FilterOperator.JSON_NOT_CONTAINS_ALL;

    const logicalOperatorForValues = isAllOperator
      ? this.not
        ? 'OR'
        : 'AND'
      : this.not
        ? 'AND'
        : 'OR';

    const logicalOperatorForPaths = this.not ? 'OR' : 'AND';

    for (const path in filter.value) {
      const valuesToSearch = (filter.value as Record<string, any>)[path];

      if (!Array.isArray(valuesToSearch) || valuesToSearch.length === 0) {
        continue;
      }

      const buildStructure = (val: any) => {
        const parts = path.split('.');
        let current: any = val;
        for (let i = parts.length - 1; i >= 0; i--) {
          const k = parts[i]!;
          current = { [k]: current };
        }
        return current;
      };

      if (isAllOperator && !this.not) {
        // Optimization for ALL (positive): combine values into one array structure
        const structure = buildStructure(valuesToSearch);
        const paramName = parameterManager.generateParamName();
        parameters[paramName] = JSON.stringify(structure);
        pathConditions.push(`${fieldName} @> :${paramName}::jsonb`);
      } else if (isAllOperator && this.not) {
        // Optimization for NOT ALL: NOT (field @> values)
        // This means "it does not contain ALL of them" (it might contain some, but not all)
        const structure = buildStructure(valuesToSearch);
        const paramName = parameterManager.generateParamName();
        parameters[paramName] = JSON.stringify(structure);
        pathConditions.push(`NOT (${fieldName} @> :${paramName}::jsonb)`);
      } else {
        const singlePathValueConditions = valuesToSearch.map((value) => {
          const paramName = parameterManager.generateParamName();
          // Wrap value in array to check containment in array
          const structure = buildStructure([value]);
          parameters[paramName] = JSON.stringify(structure);

          const condition = `${fieldName} @> :${paramName}::jsonb`;
          return this.not ? `NOT (${condition})` : condition;
        });

        if (singlePathValueConditions.length > 1) {
          pathConditions.push(
            `(${singlePathValueConditions.join(` ${logicalOperatorForValues} `)})`,
          );
        } else {
          pathConditions.push(singlePathValueConditions[0]!);
        }
      }
    }

    if (pathConditions.length === 0) {
      return { queryFragment: '1=1', parameters: {} };
    }

    const combinedConditions = pathConditions.join(
      ` ${logicalOperatorForPaths} `,
    );

    const queryFragment = this.not
      ? `(${fieldName} IS NULL OR ${combinedConditions})`
      : `(${fieldName} IS NOT NULL AND ${combinedConditions})`;

    return {
      queryFragment,
      parameters,
    };
  }
}
