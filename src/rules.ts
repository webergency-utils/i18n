import { Leaf, SelectorObject } from './types.js';
import { getPath } from './path.js';
import { isSelectorObject } from './structure.js';

export { isSelectorObject } from './structure.js';

export type MatchResult = 
{
    matched: boolean
    rank   : number
    span   : number
};

export const parseAffine = ( key: string ): { a: number, b: number } | null =>
{
    const match = key.match( /^([+-]?\d*)n([+-]\d+)?$/i );

    if( !match ){ return null }

    let aStr = match[1];
    let bStr = match[2];

    let a = 1;

    if( aStr === '-' ){ a = -1 }
    else if( aStr && aStr !== '+' ){ a = parseInt( aStr, 10 ) }

    let b = bStr ? parseInt( bStr, 10 ) : 0;

    return { a, b };
};

export const parseRange = ( key: string ): { low: number, high: number } | null =>
{
    const match = key.match( /^(-?\d+(?:\.\d+)?|-[Ii]nfinity)-(-?\d+(?:\.\d+)?|[Ii]nfinity)$/ );

    if( !match ){ return null }

    let low = match[1].toLowerCase() === '-infinity' ? -Infinity : parseFloat( match[1] );
    let high = match[2].toLowerCase() === 'infinity' ? Infinity : parseFloat( match[2] );

    return { low, high };
};

const pluralRulesCache = new Map<string, Intl.PluralRules>();

const getPluralRules = ( locale: string ): Intl.PluralRules =>
{
    let rules = pluralRulesCache.get( locale );

    if( !rules )
    {
        rules = new Intl.PluralRules( locale );
        pluralRulesCache.set( locale, rules );
    }

    return rules;
};

export const evaluateRuleKey = ( key: string, val: any, locale?: string ): MatchResult =>
{
    // Catch-all
    if( key === '*' || key === 'other' )
    {
        return { matched: true, rank: 1, span: Infinity };
    }

    // Exact string / value match
    if( String( val ) === key || val === Number( key ))
    {
        return { matched: true, rank: 5, span: 0 };
    }

    const num = Number( val );

    if( !isNaN( num ))
    {
        // Affine (e.g. 2n+1, 2N, -2n+10): value = a*k + b for integer k >= 0
        const affine = parseAffine( key );

        if( affine )
        {
            const { a, b } = affine;

            if( a !== 0 )
            {
                const k = ( num - b ) / a;

                if( Number.isInteger( k ) && k >= 0 )
                {
                    return { matched: true, rank: 4, span: Math.abs( a ) };
                }
            }
        }

        // Range (e.g. 2-Infinity, 2-4)
        const range = parseRange( key );

        if( range )
        {
            const { low, high } = range;

            if( num >= low && num <= high )
            {
                return { matched: true, rank: 3, span: high - low };
            }
        }

        // CLDR Plural Categories
        const cldrCategories = [ 'zero', 'one', 'two', 'few', 'many' ];

        if( cldrCategories.includes( key ) && locale )
        {
            try
            {
                const category = getPluralRules( locale ).select( num );

                if( category === key )
                {
                    return { matched: true, rank: 2, span: Infinity };
                }
            }
            catch( _e )
            {
                // Fallthrough if invalid locale
            }
        }
    }

    return { matched: false, rank: 0, span: Infinity };
};

export const expandSelectors = ( leaf: Leaf, scopes: object[], locale?: string ): Leaf =>
{
    while( isSelectorObject( leaf ))
    {
        const selObj = leaf as SelectorObject;
        const selectorKey = Object.keys( selObj ).find( k => k.startsWith( '#' ));

        if( !selectorKey ){ break }

        const varName = selectorKey.slice( 1 );
        let val: any = undefined;

        for( const scope of scopes )
        {
            val = getPath( scope, varName );
            if( val !== undefined ){ break }
        }

        const rulesObj = selObj[selectorKey] as Record<string, Leaf>;

        if( !rulesObj || typeof rulesObj !== 'object' ){ break }

        let bestKey: string | null = null;
        let bestResult: MatchResult = { matched: false, rank: 0, span: Infinity };

        for( const ruleKey of Object.keys( rulesObj ))
        {
            const res = evaluateRuleKey( ruleKey, val, locale );

            if( res.matched )
            {
                if( res.rank > bestResult.rank )
                {
                    bestResult = res;
                    bestKey = ruleKey;
                }
                else if( res.rank === bestResult.rank && res.span < bestResult.span )
                {
                    bestResult = res;
                    bestKey = ruleKey;
                }
            }
        }

        if( bestKey !== null )
        {
            leaf = rulesObj[bestKey];
        }
        else
        {
            // Fallback if no rule matched
            break;
        }
    }

    return leaf;
};
