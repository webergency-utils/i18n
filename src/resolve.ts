import { Converter } from './types.js';
import { getPath } from './path.js';

export type ResolutionResult = 
{
    value        : string
    resolvedCount: number
    missingCount : number
};

export const resolveVariables = ( 
    str        : string, 
    scopes     : object[], 
    converters?: Record<string, Converter> 
): ResolutionResult =>
{
    const missing = new Set<string>();
    const resolved = new Set<string>();

    const placeholderRegex = /\{([^%{}]+)(?:%([^:}]+)(?::([^}]+))?)?\}/g;

    const value = str.replace( placeholderRegex, ( _match, path, converterName, converterArg ) =>
    {
        let val: any = undefined;

        for( const scope of scopes )
        {
            val = getPath( scope, path );
            if( val !== undefined ){ break }
        }

        if( val !== undefined )
        {
            resolved.add( path );

            if( converterName && converters && converters[converterName] )
            {
                return converters[converterName]( val, converterArg );
            }

            return String( val );
        }

        missing.add( path );

        return path;
    });

    return {
        value,
        resolvedCount: resolved.size,
        missingCount : missing.size
    };
};
