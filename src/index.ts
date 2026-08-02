export { I18N } from './i18n.js';
export { validateDictionaries } from './validate.js';
export { isBcp47Locale, normalizeLocale, localesEqual, findLocaleKey } from './locale.js';
export
{
    isSelectorObject,
    isTranslationLeaf,
    isLocaleMap,
    isMixedLocaleBranch,
    isPerRootDictionary,
    getLocaleMapValue,
    isSingleLanguageSpec
} from './structure.js';
export type
{
    Leaf,
    SelectorObject,
    Dictionary,
    SingleLanguageDictionarySpec,
    DictionaryInput,
    Converter,
    KeyPath,
    DirectChildKeyPath,
    AutoCompleteKey,
    I18NOptions
} from './types.js';
export type
{
    ValidationErrorType,
    ValidationError,
    ValidationReport,
    ValidateDictionariesOptions
} from './validate.js';
