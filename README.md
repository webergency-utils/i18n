# @webergency-utils/i18n

A zero-dependency, isomorphic TypeScript i18n library featuring fast $O(1)$ Map index lookups, intuitive math rule selectors, dynamic template specificity scoring, and full Slavic/CLDR plural declension.

[![npm version](https://img.shields.io/npm/v/@webergency-utils/i18n.svg)](https://www.npmjs.com/package/@webergency-utils/i18n)
[![license](https://img.shields.io/npm/l/@webergency-utils/i18n.svg)](LICENSE)
[![Maintenance](https://img.shields.io/badge/maintenance-active-brightgreen.svg)](#maintenance)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@webergency-utils/i18n?activeTab=dependencies)
[![monthly downloads](https://img.shields.io/npm/dm/@webergency-utils/i18n.svg)](https://www.npmjs.com/package/@webergency-utils/i18n)<br>
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/webergency-utils/i18n/badge)](https://securityscorecards.dev/viewer/?uri=github.com/webergency-utils/i18n)
[![code coverage](https://img.shields.io/badge/coverage-88%25-brightgreen.svg)](#)
[![tests](https://github.com/webergency-utils/i18n/actions/workflows/ci.yml/badge.svg)](https://github.com/webergency-utils/i18n/actions/workflows/ci.yml)
[![CodeQL](https://github.com/webergency-utils/i18n/actions/workflows/codeql.yml/badge.svg)](https://github.com/webergency-utils/i18n/actions/workflows/codeql.yml)

## TL;DR

```typescript
import { I18N } from '@webergency-utils/i18n';

const dict = {
    greetings: {
        hello: {
            sk: [ 'Ahoj {name}', 'Čau {name}' ],
            en: 'Hello {name}'
        }
    },
    to_men: {
        sk: {
            '#count': {
                '1': 'mužovi',
                '2n+1': 'mužíkom',
                '2-Infinity': 'mužom',
                '*': 'mužom'
            }
        },
        en: {
            '#count': {
                'one': '{count} man',
                'other': '{count} men'
            }
        }
    }
};

const i18n = new I18N({
    dictionaries: [ dict ],
    locale: 'en',
    fallbacks: [ 'sk', 'en' ]
});

// Basic lookup with template parameters
console.log( i18n.get( 'sk', 'greetings.hello', { name: 'Peter' })); // "Ahoj Peter" (or "Čau Peter")

// Slovak rule matching (count = 3 -> odd -> '2n+1' -> 'mužíkom')
console.log( i18n.get( 'sk', 'to_men', { count: 3 })); // "mužíkom"

// English CLDR plural matching (count = 5 -> 'other' -> '5 men')
console.log( i18n.get( 'en', 'to_men', { count: 5 })); // "5 men"
```

## Installation & Setup

Install using your preferred package manager:

```bash
npm install @webergency-utils/i18n
```

### Module Formats & Environments

The library ships dual CJS and ESM builds with complete TypeScript declaration maps `.d.ts`. It has zero external dependencies and runs natively across Node.js, React Native, Web Browsers, Cloudflare Workers, and Edge runtime environments.

## Architecture & Internals

### 1. Lazy On-Demand Caching (0ms Load Overhead)
Initialization (`new I18N(...)`) simply stores raw dictionary references with **0ms instant startup overhead**. No upfront object traversal occurs. When a translation key is queried for the first time via `.get(locale, key)`, the resolved translation leaf is cached in `#cache: Map<locale, Map<key, Leaf>>` so all subsequent lookups execute in $O(1)$ constant time.

### 2. Dict Precedence (Last-Wins)
When multiple dictionaries are supplied in `dictionaries: [ baseDict, overrideDict ]`, later dictionaries in the array override earlier ones (`Object.assign` / `{ ...base, ...overrides }` spread behavior).

### 3. Rule Selector Precedence (`#var`)
For keys starting with `#` (e.g. `#count`), the engine matches against the scope variable value using the following precedence hierarchy:
1. **Exact:** `"1"`, `"0"`, `"male"` (rank 5)
2. **Affine / Modulo Math:** `"2n+1"`, `"10n+5"` for integer $k \ge 0$ (rank 4)
3. **Range:** `"2-Infinity"`, `"2-4"` where narrower span wins (rank 3)
4. **CLDR Plural Categories:** `"zero"`, `"one"`, `"two"`, `"few"`, `"many"` via native `Intl.PluralRules` (rank 2)
5. **Catch-all:** `"*"` or `"other"` (rank 1)

### 4. Template Candidate Scoring & Random Selection
Candidate templates are filtered to discard any with missing scope variables, scored by the count of successfully resolved variables (max-score specificity), and randomly selected from the highest-scoring candidate pool.

### 5. TypeScript Key Autocomplete & Type Safety

Pass your dictionary interface or object type to `I18N<TDictionary>` for IDE key path suggestions:

```typescript
const appDict = {
    greetings: {
        hello: { sk: 'Ahoj', en: 'Hello' }
    },
    to_men: {
        sk: { '#count': { '1': 'mužovi' } }
    }
};

type AppDict = typeof appDict;

const i18n = new I18N<AppDict>({ dictionaries: [ appDict ] });

// IDE suggests 'greetings.hello' | 'to_men' automatically!
i18n.get( 'sk', 'greetings.hello' );
```

### 6. Dictionary Validation Utility (`validateDictionaries`)

Use `validateDictionaries` to lint translation bundles before shipping:

```typescript
import { validateDictionaries } from '@webergency-utils/i18n';

const report = validateDictionaries({
    dictionaries: [ dict ],
    locales: [ 'sk', 'en' ]
});

if( !report.valid )
{
    console.error( 'Translation validation errors:', report.errors );
}
```

## Glossary

- **`I18N`:** Main class managing dictionary indexing, key resolution, locale fallback chains, and exports.
- **`AutoCompleteKey<T>`:** TypeScript utility type generating autocomplete union paths (`KeyPath<T> | (string & {})`).
- **`validateDictionaries`:** Utility function linting dictionary completeness, placeholder syntax, and branch structures.
- **`Leaf`:** A leaf translation node represented as a `string`, `string[]` (variant pool), or `#var` `SelectorObject`.
- **`SelectorObject`:** An object mapping rule keys (`1`, `2n+1`, `2-4`, `few`, `*`) under a `#varName` selector key.
- **`DictionaryInput`:** Either a multi-language dictionary object or a single-language specification `{ locale: 'sk', dictionary: dict }`.
- **`Converter`:** Custom variable transformation function `{path%converterName:arg}`.

## API Reference

### Class: `I18N`

#### Constructor

```typescript
new I18N( options: I18NOptions )
```

##### Parameters

- `options` (`I18NOptions`):
  - `dictionaries` (`DictionaryInput | DictionaryInput[]`, **required**): One or more dictionary objects or single-language specs.
  - `locale` (`string`, optional): Default / last-resort fallback locale.
  - `fallbacks` (`string[]`, optional): Ordered list of fallback locales.
  - `converters` (`Record<string, Converter>`, optional): Custom variable converters.
  - `transform` (`( value: string ) => string`, optional): Post-processor for all returned strings.
  - `random` (`() => number`, optional): Custom pseudo-random function (defaults to `Math.random`).

---

#### Method: `get`

```typescript
get( locale: string, ...args: Array<string | object> ): string
```

Resolves the translation key for the specified locale. Accepts multiple string key fallbacks and scope objects.

##### Parameters

| Parameter | Type | Description |
|---|---|---|
| `locale` | `string` | Requested language code (e.g. `'sk'`, `'en'`). |
| `...args` | `Array<string \| object>` | Translation keys in fallback order followed by scope variable objects. |

##### Returns

`string` — The resolved, interpolated translation string, or the first key string if missing.

##### Example

```typescript
const text = i18n.get( 'sk', 'primary.key', 'fallback.key', { name: 'Peter', count: 3 });
```

---

#### Method: `dictionary`

```typescript
dictionary( locale: string, path?: string ): Record<string, any>
```

Exports a complete, single-language object tree for `locale`. Fills missing leaves from the fallback locale chain while preserving array variants and `#var` selector objects.

##### Parameters

| Parameter | Type | Description |
|---|---|---|
| `locale` | `string` | Target language code to export. |
| `path` | `string` (optional) | Subpath prefix to export (defaults to root `""`). |

##### Returns

`Record<string, any>` — The exported single-language dictionary object tree.

## Maintenance

This package is actively maintained.

Bug reports and pull requests are welcome. Security issues and critical regressions are prioritized. New features are considered when they align with the package's existing scope.
