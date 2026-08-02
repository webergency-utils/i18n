import { Converter, Leaf } from './types.js';
import { expandSelectors } from './rules.js';
import { ResolutionResult, resolveVariables } from './resolve.js';

export const selectCandidate = ( 
    leaf       : Leaf, 
    scopes     : object[], 
    locale?    : string, 
    converters?: Record<string, Converter>, 
    random     : () => number = Math.random 
): ResolutionResult | null =>
{
    let expanded = expandSelectors( leaf, scopes, locale );

    if( typeof expanded === 'object' && expanded !== null && !Array.isArray( expanded ) && locale && ( expanded as any )[locale] !== undefined )
    {
        expanded = ( expanded as any )[locale];
    }

    let templates: string[];

    if( typeof expanded === 'string' )
    {
        templates = [ expanded ];
    }
    else if( Array.isArray( expanded ))
    {
        templates = expanded;
    }
    else
    {
        return null;
    }

    if( templates.length === 0 ){ return null }

    const results: ResolutionResult[] = templates.map( t => resolveVariables( t, scopes, converters ));

    // Only fully-resolved candidates (missingCount === 0); otherwise unresolved → locale/key fallback
    const validResults = results.filter( r => r.missingCount === 0 );

    if( validResults.length === 0 ){ return null }

    let maxScore = -1;

    for( const r of validResults )
    {
        if( r.resolvedCount > maxScore ){ maxScore = r.resolvedCount }
    }

    const pool = validResults.filter( r => r.resolvedCount === maxScore );
    const idx = Math.floor( random() * pool.length );

    return pool[Math.min( idx, pool.length - 1 )];
};
