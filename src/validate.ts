import { Converter, DictionaryInput, Leaf } from './types.js';
import { isBcp47Locale, normalizeLocale } from './locale.js';
import
{
    isLocaleMap,
    isMixedLocaleBranch,
    isPerRootDictionary,
    isSelectorObject,
    isSingleLanguageSpec,
    isTranslationLeaf
} from './structure.js';

export type ValidationErrorType = 'missing_key' | 'invalid_placeholder' | 'mixed_branch' | 'unknown_converter';

export type ValidationError = 
{
    type   : ValidationErrorType
    locale?: string
    path   : string
    message: string
};

export type ValidationReport = 
{
    valid : boolean
    errors: ValidationError[]
};

export type ValidateDictionariesOptions = 
{
    dictionaries: DictionaryInput | DictionaryInput[]
    locales?    : string[]
    converters? : Record<string, Converter>
};

const checkPlaceholdersInString = ( 
    str       : string, 
    path      : string, 
    locale    : string | undefined, 
    errors    : ValidationError[], 
    converters?: Record<string, Converter> 
) =>
{
    let openCount = 0;

    for( let i = 0; i < str.length; ++i )
    {
        if( str[i] === '{' )
        {
            openCount++;

            if( openCount > 1 )
            {
                errors.push({
                    type   : 'invalid_placeholder',
                    locale,
                    path,
                    message: `Nested or unclosed opening brace '{' in string: "${str}"`
                });
                break;
            }
        }
        else if( str[i] === '}' )
        {
            if( openCount === 0 )
            {
                errors.push({
                    type   : 'invalid_placeholder',
                    locale,
                    path,
                    message: `Unmatched closing brace '}' in string: "${str}"`
                });
                break;
            }

            openCount--;
        }
    }

    if( openCount > 0 )
    {
        errors.push({
            type   : 'invalid_placeholder',
            locale,
            path,
            message: `Unclosed brace '{' in string: "${str}"`
        });
    }

    const placeholderRegex = /\{([^%{}]+)(?:%([^:}]+)(?::([^}]+))?)?\}/g;
    let match: RegExpExecArray | null;

    while(( match = placeholderRegex.exec( str )) !== null )
    {
        const converterName = match[2];

        if( converterName && converters && !converters[converterName] )
        {
            errors.push({
                type   : 'unknown_converter',
                locale,
                path,
                message: `Unknown converter "%${converterName}" used in string: "${str}"`
            });
        }
    }
};

const checkLeafTemplates = ( 
    leaf      : Leaf, 
    path      : string, 
    locale    : string | undefined, 
    errors    : ValidationError[], 
    converters?: Record<string, Converter> 
) =>
{
    if( typeof leaf === 'string' )
    {
        checkPlaceholdersInString( leaf, path, locale, errors, converters );
    }
    else if( Array.isArray( leaf ))
    {
        for( const item of leaf )
        {
            checkLeafTemplates( item, path, locale, errors, converters );
        }
    }
    else if( isSelectorObject( leaf ))
    {
        const selObj = leaf as Record<string, Leaf>;
        const selectorKey = Object.keys( selObj ).find( k => k.startsWith( '#' ));

        if( selectorKey )
        {
            const rulesObj = selObj[selectorKey] as Record<string, Leaf>;

            if( rulesObj && typeof rulesObj === 'object' )
            {
                for( const ruleKey of Object.keys( rulesObj ))
                {
                    checkLeafTemplates( rulesObj[ruleKey], path, locale, errors, converters );
                }
            }
        }
    }
};

export const validateDictionaries = ( options: ValidateDictionariesOptions ): ValidationReport =>
{
    const errors: ValidationError[] = [];
    const dictInputs = Array.isArray( options.dictionaries )
        ? options.dictionaries
        : [ options.dictionaries ];

    const keyLocaleMap = new Map<string, Set<string>>();

    const registerKeyLocale = ( path: string, locale: string ) =>
    {
        let set = keyLocaleMap.get( path );

        if( !set )
        {
            set = new Set<string>();
            keyLocaleMap.set( path, set );
        }

        set.add( normalizeLocale( locale ));
    };

    const traverse = ( node: any, curPath: string, boundLocale?: string ) =>
    {
        if( node == null ){ return }

        if( isTranslationLeaf( node ))
        {
            if( boundLocale && curPath )
            {
                registerKeyLocale( curPath, boundLocale );
                checkLeafTemplates( node, curPath, boundLocale, errors, options.converters );
            }

            return;
        }

        if( typeof node !== 'object' ){ return }

        if( isMixedLocaleBranch( node ))
        {
            errors.push({
                type   : 'mixed_branch',
                locale : boundLocale,
                path   : curPath,
                message: `Locale branch at "${curPath || 'root'}" mixes locale keys with non-locale keys`
            });

            return;
        }

        if( isLocaleMap( node ))
        {
            for( const locKey of Object.keys( node ))
            {
                const val = node[locKey];

                registerKeyLocale( curPath, locKey );
                checkLeafTemplates( val, curPath, locKey, errors, options.converters );
            }

            return;
        }

        for( const k of Object.keys( node ))
        {
            const nxtPath = curPath ? `${curPath}.${k}` : k;

            traverse( node[k], nxtPath, boundLocale );
        }
    };

    for( const input of dictInputs )
    {
        if( !input || typeof input !== 'object' ){ continue }

        if( isSingleLanguageSpec( input ))
        {
            traverse( input.dictionary, '', input.locale );
        }
        else
        {
            const dict = input as Record<string, any>;

            if( isPerRootDictionary( dict ))
            {
                for( const locKey of Object.keys( dict ))
                {
                    traverse( dict[locKey], '', locKey );
                }
            }
            else
            {
                const keys = Object.keys( dict );

                if( keys.length > 0 && keys.every( k => isBcp47Locale( k )) && !isLocaleMap( dict ))
                {
                    for( const locKey of keys )
                    {
                        traverse( dict[locKey], '', locKey );
                    }
                }
                else
                {
                    traverse( dict, '' );
                }
            }
        }
    }

    if( options.locales && options.locales.length > 0 )
    {
        for( const [ path, definedLocales ] of keyLocaleMap.entries())
        {
            for( const reqLocale of options.locales )
            {
                const normalized = normalizeLocale( reqLocale );

                if( !definedLocales.has( normalized ))
                {
                    errors.push({
                        type   : 'missing_key',
                        locale : normalized,
                        path,
                        message: `Key "${path}" is missing translation for locale "${normalized}"`
                    });
                }
            }
        }
    }

    return {
        valid : errors.length === 0,
        errors
    };
};
