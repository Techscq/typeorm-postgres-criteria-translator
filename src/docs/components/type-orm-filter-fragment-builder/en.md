# TypeOrmFilterFragmentBuilder

## 1. Main Purpose

The `TypeOrmFilterFragmentBuilder` is a low-level helper responsible for a single, critical task: translating an individual `Filter` object (e.g., `{ field: 'username', operator: FilterOperator.EQUALS, value: 'admin' }`) into its corresponding SQL condition fragment for PostgreSQL.

It acts as the "operator specialist," knowing the exact syntax for every supported filter operation.

## 2. How It Works

This component maintains a collection of specialized handlers, one for each `FilterOperator`. When it receives a `Filter`, it dispatches it to the correct handler, which knows the exact PostgreSQL syntax for that specific operation (e.g., how to build a `LIKE` clause, a `@>` check, or a `BETWEEN` condition).

This design ensures that the logic for each operator is isolated, making the system easy to maintain and extend.

## 3. Supported Operators

This translator supports a wide range of operators for different data types.

### Basic Comparison

- `EQUALS` (`=`)
- `NOT_EQUALS` (`!=`)
- `GREATER_THAN` (`>`)
- `GREATER_THAN_OR_EQUALS` (`>=`)
- `LESS_THAN` (`<`)
- `LESS_THAN_OR_EQUALS` (`<=`)

### Text Search (LIKE / ILIKE)

- `LIKE`: Case-sensitive `LIKE` comparison.
- `NOT_LIKE`: Case-sensitive `NOT LIKE` comparison.
- `CONTAINS`: Case-insensitive search for a substring (`ILIKE '%value%'`).
- `NOT_CONTAINS`: Case-insensitive search for a non-existent substring (`NOT ILIKE '%value%'`).
- `STARTS_WITH`: Case-insensitive search for a prefix (`ILIKE 'value%'`).
- `ENDS_WITH`: Case-insensitive search for a suffix (`ILIKE '%value'`).
- `ILIKE` / `NOT_ILIKE`: Case-insensitive comparison.

### Null Checks

- `IS_NULL`: Checks if a field is `NULL`.
- `IS_NOT_NULL`: Checks if a field is not `NULL`.

### Set and Range

- `IN`: Checks if a field's value is within a given array.
- `NOT_IN`: Checks if a field's value is not within a given array.
- `BETWEEN`: Checks if a value is within an inclusive range.
- `NOT_BETWEEN`: Checks if a value is outside an inclusive range.

### Regular Expressions

- `MATCHES_REGEX`: Checks if a string field matches a given regular expression using PostgreSQL's `~` operator (case-sensitive).

### PostgreSQL Native Arrays (for TypeORM `array: true`)

- `SET_CONTAINS`: Checks if a native array field contains a specific value using `ANY`.
- `SET_NOT_CONTAINS`: Checks if a native array field does not contain a specific value.
- `SET_CONTAINS_ANY`: Checks if the field contains at least one of the values from a given array.
- `SET_CONTAINS_ALL`: Checks if the field contains all of the values from a given array.

### PostgreSQL `JSONB` Type

- `JSON_CONTAINS`: Checks if a JSONB object in the database contains the structure from a given filter object using `@>`.
- `JSON_PATH_VALUE_EQUALS`: Checks if the value at a specific path within a JSON object equals a given value using `#>>`.
- `ARRAY_CONTAINS_ELEMENT`: Checks if a JSON array contains a specific element using `@>`.
- `ARRAY_CONTAINS_ANY_ELEMENT`: Checks if a JSON array contains at least one of the elements from a given array.
- `ARRAY_CONTAINS_ALL_ELEMENTS`: Checks if a JSON array contains all of the elements from a given array.
- `ARRAY_EQUALS`: Checks if a JSON array has the same elements as a given array (using `@>` and `<@`).
- `ARRAY_EQUALS_STRICT`: Checks if a JSON array is an exact match to a given array, including order (using `=`).

## 4. Usage Notes

You do not interact with this component directly. It is used internally by the `TypeOrmConditionBuilder` to construct the `WHERE` and `ON` clauses of your query.
