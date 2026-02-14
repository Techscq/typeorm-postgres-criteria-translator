# TypeOrmFilterFragmentBuilder

## 1. Propósito Principal

El `TypeOrmFilterFragmentBuilder` es un ayudante de bajo nivel responsable de una única tarea crítica: traducir un objeto `Filter` individual (ej., `{ field: 'username', operator: FilterOperator.EQUALS, value: 'admin' }`) en su fragmento de condición SQL correspondiente para PostgreSQL.

Actúa como el "especialista en operadores", conociendo la sintaxis exacta para cada operación de filtro soportada.

## 2. Cómo Funciona

Este componente mantiene una colección de manejadores (handlers) especializados, uno para cada `FilterOperator`. Cuando recibe un `Filter`, lo despacha al manejador correcto, que conoce la sintaxis exacta de PostgreSQL para esa operación específica (ej., cómo construir una cláusula `LIKE`, una comprobación `@>` o una condición `BETWEEN`).

Este diseño asegura que la lógica para cada operador esté aislada, haciendo que el sistema sea fácil de mantener y extender.

## 3. Operadores Soportados

Este traductor soporta una amplia gama de operadores para diferentes tipos de datos.

### Comparación Básica

- `EQUALS` (`=`)
- `NOT_EQUALS` (`!=`)
- `GREATER_THAN` (`>`)
- `GREATER_THAN_OR_EQUALS` (`>=`)
- `LESS_THAN` (`<`)
- `LESS_THAN_OR_EQUALS` (`<=`)

### Búsqueda de Texto (LIKE / ILIKE)

- `LIKE`: Comparación `LIKE` sensible a mayúsculas/minúsculas.
- `NOT_LIKE`: Comparación `NOT LIKE` sensible a mayúsculas/minúsculas.
- `CONTAINS`: Búsqueda de una subcadena sin distinguir mayúsculas/minúsculas (`ILIKE '%valor%'`).
- `NOT_CONTAINS`: Búsqueda de una subcadena inexistente sin distinguir mayúsculas/minúsculas (`NOT ILIKE '%valor%'`).
- `STARTS_WITH`: Búsqueda de un prefijo sin distinguir mayúsculas/minúsculas (`ILIKE 'valor%'`).
- `ENDS_WITH`: Búsqueda de un sufijo sin distinguir mayúsculas/minúsculas (`ILIKE '%valor'`).
- `ILIKE` / `NOT_ILIKE`: Comparación insensible a mayúsculas/minúsculas.

### Comprobaciones de Nulos

- `IS_NULL`: Comprueba si un campo es `NULL`.
- `IS_NOT_NULL`: Comprueba si un campo no es `NULL`.

### Conjuntos y Rangos

- `IN`: Comprueba si el valor de un campo está dentro de un array dado.
- `NOT_IN`: Comprueba si el valor de un campo no está dentro de un array dado.
- `BETWEEN`: Comprueba si un valor está dentro de un rango inclusivo.
- `NOT_BETWEEN`: Comprueba si un valor está fuera de un rango inclusivo.

### Expresiones Regulares

- `MATCHES_REGEX`: Comprueba si un campo de texto coincide con una expresión regular dada usando el operador `~` de PostgreSQL (sensible a mayúsculas/minúsculas).

### Arrays Nativos de PostgreSQL (para `array: true` de TypeORM)

- `SET_CONTAINS`: Comprueba si un array nativo contiene un valor específico usando `ANY`.
- `SET_NOT_CONTAINS`: Comprueba si un array nativo no contiene un valor específico.
- `SET_CONTAINS_ANY`: Comprueba si el campo contiene al menos uno de los valores de un array dado.
- `SET_CONTAINS_ALL`: Comprueba si el campo contiene todos los valores de un array dado.

### Tipo `JSONB` de PostgreSQL

- `JSON_CONTAINS`: Comprueba si un objeto JSONB en la base de datos contiene la estructura de un objeto de filtro dado usando `@>`.
- `JSON_PATH_VALUE_EQUALS`: Comprueba si el valor en una ruta específica dentro de un objeto JSON es igual a un valor dado usando `#>>`.
- `ARRAY_CONTAINS_ELEMENT`: Comprueba si un array JSON contiene un elemento específico usando `@>`.
- `ARRAY_CONTAINS_ANY_ELEMENT`: Comprueba si un array JSON contiene al menos uno de los elementos de un array dado.
- `ARRAY_CONTAINS_ALL_ELEMENTS`: Comprueba si un array JSON contiene todos los elementos de un array dado.
- `ARRAY_EQUALS`: Comprueba si un array JSON tiene los mismos elementos que un array dado (usando `@>` y `<@`).
- `ARRAY_EQUALS_STRICT`: Comprueba si un array JSON es una coincidencia exacta con un array dado, incluyendo el orden (usando `=`).

## 4. Notas de Uso

No interactúas con este componente directamente. Es utilizado internamente por el `TypeOrmConditionBuilder` para construir las cláusulas `WHERE` y `ON` de tu consulta.
