/**
 * BCP-47 language-tag subset: language (2–3) + optional script (4) + optional region (2 / UN M.49).
 * Accepts: sk, fil, en-US, zh-Hans, sr-Latn, zh-Hans-CN
 * Rejects: hello, messages, en_US, zh-hans-cn (before normalize)
 */
const BCP47_TAG = /^([a-z]{2,3})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?$/i;

export const isBcp47Locale = ( tag: string ): boolean =>
{
    if( !tag || typeof tag !== 'string' ){ return false }

    return BCP47_TAG.test( tag.trim() );
};

export const normalizeLocale = ( tag: string ): string =>
{
    const match = tag.trim().match( BCP47_TAG );

    if( !match ){ return tag }

    const language = match[1].toLowerCase();
    const script = match[2]
        ? match[2].charAt( 0 ).toUpperCase() + match[2].slice( 1 ).toLowerCase()
        : undefined;
    const region = match[3] ? match[3].toUpperCase() : undefined;

    let normalized = language;

    if( script ){ normalized += `-${script}` }

    if( region ){ normalized += `-${region}` }

    return normalized;
};

export const localesEqual = ( a: string, b: string ): boolean =>
{
    return normalizeLocale( a ) === normalizeLocale( b );
};

/**
 * Find the own-key in `obj` that matches `locale` after BCP-47 normalization.
 */
export const findLocaleKey = ( obj: Record<string, any>, locale: string ): string | undefined =>
{
    const target = normalizeLocale( locale );

    for( const key of Object.keys( obj ))
    {
        if( isBcp47Locale( key ) && normalizeLocale( key ) === target )
        {
            return key;
        }
    }

    return undefined;
};
