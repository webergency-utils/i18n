export type SelectorObject = 
{
    [key: string]: Leaf
};

export type Leaf = string | string[] | SelectorObject;

export type Dictionary = 
{
    [key: string]: any
};

export type SingleLanguageDictionarySpec = 
{
    locale    : string
    dictionary: Dictionary
};

export type DictionaryInput = Dictionary | SingleLanguageDictionarySpec;

export type Converter = ( value: any, args?: string ) => string;

export type KnownLanguageCodes = 
    | 'sk' | 'en' | 'cs' | 'cz' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'pl' | 'hu' | 'uk' | 'ru' | 'ja' | 'zh'
    | 'fil' | 'ceb'
    | 'en-US' | 'en-GB' | 'sk-SK' | 'cs-CZ' | 'de-DE' | 'fr-FR' | 'es-ES' | 'pt-BR' | 'zh-CN'
    | 'zh-Hans' | 'zh-Hant' | 'sr-Latn' | 'sr-Cyrl' | 'zh-Hans-CN';

export type ValidKeys<T> = T extends object
    ? Exclude<keyof T & string, KnownLanguageCodes | `#${string}`>
    : never;

export type IsLeaf<T> = T extends string | number | boolean | Array<any>
    ? true
    : T extends object
    ? [ValidKeys<T>] extends [never]
        ? true
        : false
    : false;

export type IsUnion<T, U = T> = ( T extends any ? ( U extends T ? false : true ) : never ) extends false ? false : true;

export type IsSingleChild<T> = T extends object
    ? IsUnion<ValidKeys<T>> extends true
        ? false
        : true
    : false;

export type DirectChildKeyPath<T> = T extends object
    ? IsLeaf<T> extends true
        ? never
        : {
              [K in ValidKeys<T>]: IsLeaf<T[K]> extends true
                  ? K
                  : IsSingleChild<T[K]> extends true
                  ? `${K}.${DirectChildKeyPath<T[K]>}`
                  : K
          }[ValidKeys<T>]
    : never;

export type KeyPath<T> = T extends object
    ? IsLeaf<T> extends true
        ? never
        : {
              [K in ValidKeys<T>]: IsLeaf<T[K]> extends true
                  ? K
                  : IsSingleChild<T[K]> extends true
                  ? `${K}.${KeyPath<T[K]>}`
                  : K | `${K}.${KeyPath<T[K]>}`
          }[ValidKeys<T>]
    : never;

export type AutoCompleteKey<T> = T extends Record<string, any>
    ? DirectChildKeyPath<T> | KeyPath<T> | ( string & {} )
    : string;

export type I18NOptions<TDictionary extends Record<string, any> = Record<string, any>> = 
{
    dictionaries : TDictionary | DictionaryInput | DictionaryInput[]
    locale?      : string
    fallbacks?   : string[]
    converters?  : Record<string, Converter>
    transform?   : ( value: string ) => string
    random?      : () => number
};
