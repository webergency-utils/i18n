import { Leaf, SingleLanguageDictionarySpec } from './types.js';
import { findLocaleKey, isBcp47Locale } from './locale.js';

export const isSelectorObject = ( obj: any ): boolean =>
{
    if( !obj || typeof obj !== 'object' || Array.isArray( obj )){ return false }

    const keys = Object.keys( obj );

    return keys.length > 0 && keys.some( k => k.startsWith( '#' ));
};

/** Translation leaf: string | string[] | { '#var': … } */
export const isTranslationLeaf = ( val: any ): val is Leaf =>
{
    if( typeof val === 'string' ){ return true }

    if( Array.isArray( val )){ return true }

    if( isSelectorObject( val )){ return true }

    return false;
};

/**
 * Locale map: every child is a translation leaf AND every key is a BCP-47 tag.
 * Example: { sk: 'Ahoj', 'zh-Hans': '你好', fil: 'Kumusta' }
 */
export const isLocaleMap = ( obj: any ): boolean =>
{
    if( !obj || typeof obj !== 'object' || Array.isArray( obj ) || isSelectorObject( obj ))
    {
        return false;
    }

    const keys = Object.keys( obj );

    if( keys.length === 0 ){ return false }

    for( const key of keys )
    {
        if( !isBcp47Locale( key )){ return false }

        if( !isTranslationLeaf( obj[key] )){ return false }
    }

    return true;
};

/**
 * Mixed branch: all values are translation leaves, but only some keys are BCP-47.
 * (Locale keys mixed with message keys at the same level.)
 */
export const isMixedLocaleBranch = ( obj: any ): boolean =>
{
    if( !obj || typeof obj !== 'object' || Array.isArray( obj ) || isSelectorObject( obj ))
    {
        return false;
    }

    const keys = Object.keys( obj );

    if( keys.length === 0 ){ return false }

    if( !keys.every( k => isTranslationLeaf( obj[k] ))){ return false }

    const localeKeys = keys.filter( k => isBcp47Locale( k ));

    return localeKeys.length > 0 && localeKeys.length < keys.length;
};

/**
 * Per-root multi-language dictionary: all root keys are BCP-47 and values are namespaces
 * (not a locale map of translation leaves).
 */
export const isPerRootDictionary = ( obj: any ): boolean =>
{
    if( !obj || typeof obj !== 'object' || Array.isArray( obj ) || isSelectorObject( obj ))
    {
        return false;
    }

    const keys = Object.keys( obj );

    if( keys.length === 0 ){ return false }

    if( !keys.every( k => isBcp47Locale( k ))){ return false }

    return !isLocaleMap( obj );
};

export const getLocaleMapValue = ( map: Record<string, any>, locale: string ): Leaf | undefined =>
{
    const key = findLocaleKey( map, locale );

    if( key === undefined ){ return undefined }

    return map[key] as Leaf;
};

export const isSingleLanguageSpec = ( input: any ): input is SingleLanguageDictionarySpec =>
{
    if( !input || typeof input !== 'object' || Array.isArray( input )){ return false }

    if( typeof input.locale !== 'string' || !isBcp47Locale( input.locale )){ return false }

    if( input.dictionary == null || typeof input.dictionary !== 'object' || Array.isArray( input.dictionary ))
    {
        return false;
    }

    return true;
};
