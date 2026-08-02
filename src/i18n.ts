import { AutoCompleteKey, Converter, DictionaryInput, I18NOptions, Leaf } from './types.js';
import { selectCandidate } from './select.js';
import { getPath } from './path.js';
import { findLocaleKey, localesEqual, normalizeLocale } from './locale.js';
import
{
    getLocaleMapValue,
    isLocaleMap,
    isMixedLocaleBranch,
    isPerRootDictionary,
    isSelectorObject,
    isSingleLanguageSpec,
    isTranslationLeaf
} from './structure.js';

export class I18N<TDictionary extends Record<string, any> = Record<string, any>>
{
    #dictionaries : DictionaryInput[]                      = [];
    #cache        : Map<string, Map<string, Leaf | null>>  = new Map();
    #defaultLocale?: string;
    #fallbacks    : string[]                               = [];
    #converters   : Record<string, Converter>              = {};
    #transform?   : ( value: string ) => string;
    #random       : () => number                           = Math.random;

    constructor( options: I18NOptions<TDictionary> )
    {
        this.#defaultLocale = options.locale ? normalizeLocale( options.locale ) : undefined;
        this.#fallbacks = ( options.fallbacks || [] ).map( normalizeLocale );
        this.#converters = options.converters || {};
        this.#transform = options.transform;
        this.#random = options.random || Math.random;

        this.#dictionaries = Array.isArray( options.dictionaries )
            ? options.dictionaries
            : [ options.dictionaries ];
    }

    #validateNode( node: any )
    {
        if( !node || typeof node !== 'object' || Array.isArray( node ) || isSelectorObject( node )){ return }

        if( isMixedLocaleBranch( node ))
        {
            throw new Error( 'Invalid multi-language locale branch: locale branch cannot mix locale keys with non-locale keys' );
        }

        if( isLocaleMap( node )){ return }

        for( const key of Object.keys( node ))
        {
            this.#validateNode( node[key] );
        }
    }

    #localesToTry( locale: string ): string[]
    {
        const localesToTry: string[] = [];

        if( locale )
        {
            localesToTry.push( normalizeLocale( locale ));
        }

        for( const fb of this.#fallbacks )
        {
            if( !localesToTry.includes( fb )){ localesToTry.push( fb ) }
        }

        if( this.#defaultLocale && !localesToTry.includes( this.#defaultLocale ))
        {
            localesToTry.push( this.#defaultLocale );
        }

        return localesToTry;
    }

    #resolveLeaf( locale: string, key: string ): Leaf | null
    {
        const normalizedLocale = normalizeLocale( locale );
        let locCache = this.#cache.get( normalizedLocale );

        if( !locCache )
        {
            locCache = new Map<string, Leaf | null>();
            this.#cache.set( normalizedLocale, locCache );
        }

        if( locCache.has( key ))
        {
            return locCache.get( key )!;
        }

        let foundLeaf: Leaf | null = null;

        for( let i = this.#dictionaries.length - 1; i >= 0; --i )
        {
            const input = this.#dictionaries[i];

            if( !input || typeof input !== 'object' ){ continue }

            // Case A: Single-language spec { locale, dictionary }
            if( isSingleLanguageSpec( input ))
            {
                if( localesEqual( input.locale, normalizedLocale ))
                {
                    const val = getPath( input.dictionary, key );

                    if( val !== undefined && isTranslationLeaf( val ))
                    {
                        foundLeaf = val;
                        break;
                    }
                }

                continue;
            }

            const dict = input as Record<string, any>;

            // Case B: Per-leaf locale map at key path
            const node = getPath( dict, key );

            if( node !== undefined )
            {
                if( isLocaleMap( node ))
                {
                    this.#validateNode( node );

                    const leaf = getLocaleMapValue( node, normalizedLocale );

                    if( leaf !== undefined )
                    {
                        foundLeaf = leaf;
                        break;
                    }
                }
                else if( isMixedLocaleBranch( node ))
                {
                    this.#validateNode( node );
                }
                else if( isTranslationLeaf( node ) && this.#defaultLocale && localesEqual( this.#defaultLocale, normalizedLocale ))
                {
                    foundLeaf = node;
                    break;
                }
            }

            // Case C: Per-root multi-language { sk: { … }, 'zh-Hans': { … } }
            if( isPerRootDictionary( dict ))
            {
                const rootKey = findLocaleKey( dict, normalizedLocale );

                if( rootKey !== undefined && typeof dict[rootKey] === 'object' && dict[rootKey] !== null )
                {
                    const val = getPath( dict[rootKey], key );

                    if( val !== undefined && isTranslationLeaf( val ))
                    {
                        foundLeaf = val;
                        break;
                    }
                }
            }
            else
            {
                const rootKey = findLocaleKey( dict, normalizedLocale );

                if( rootKey !== undefined && typeof dict[rootKey] === 'object' && dict[rootKey] !== null && !isTranslationLeaf( dict[rootKey] ))
                {
                    const val = getPath( dict[rootKey], key );

                    if( val !== undefined && isTranslationLeaf( val ))
                    {
                        foundLeaf = val;
                        break;
                    }
                }
            }
        }

        locCache.set( key, foundLeaf );

        return foundLeaf;
    }

    get<K extends string = AutoCompleteKey<TDictionary>>(
        locale: string,
        ...args: Array<K | object>
    ): string
    {
        const keys: string[] = [];
        const scopes: object[] = [];

        for( const arg of args )
        {
            if( typeof arg === 'string' )
            {
                keys.push( arg );
            }
            else if( typeof arg === 'object' && arg !== null )
            {
                scopes.push( arg );
            }
        }

        if( keys.length === 0 ){ return '' }

        const localesToTry = this.#localesToTry( locale );

        for( const key of keys )
        {
            for( const loc of localesToTry )
            {
                const leaf = this.#resolveLeaf( loc, key );

                if( leaf !== null )
                {
                    const res = selectCandidate( leaf, scopes, loc, this.#converters, this.#random );

                    if( res )
                    {
                        return this.#transform ? this.#transform( res.value ) : res.value;
                    }
                }
            }
        }

        return keys[0];
    }

    dictionary( locale: string, path: string = '' ): Record<string, any>
    {
        const localesToTry = this.#localesToTry( locale );
        const prefix = path ? `${path}.` : '';
        const keyPaths = new Set<string>();

        const registerPath = ( curPath: string ) =>
        {
            if( !curPath ){ return }

            if( !path || curPath === path || curPath.startsWith( prefix ))
            {
                keyPaths.add( path ? curPath.slice( prefix.length ) : curPath );
            }
        };

        const collectPaths = ( node: any, curPath: string, boundLocale?: string ) =>
        {
            if( node == null ){ return }

            if( isTranslationLeaf( node ))
            {
                if( boundLocale )
                {
                    registerPath( curPath );
                }

                return;
            }

            if( typeof node !== 'object' ){ return }

            if( isMixedLocaleBranch( node ))
            {
                throw new Error( 'Invalid multi-language locale branch: locale branch cannot mix locale keys with non-locale keys' );
            }

            if( isLocaleMap( node ))
            {
                for( const tryLocale of localesToTry )
                {
                    if( getLocaleMapValue( node, tryLocale ) !== undefined )
                    {
                        registerPath( curPath );
                        break;
                    }
                }

                return;
            }

            for( const k of Object.keys( node ))
            {
                const nxtPath = curPath ? `${curPath}.${k}` : k;

                collectPaths( node[k], nxtPath, boundLocale );
            }
        };

        for( const loc of localesToTry )
        {
            for( const input of this.#dictionaries )
            {
                if( isSingleLanguageSpec( input ))
                {
                    if( localesEqual( input.locale, loc ))
                    {
                        collectPaths( input.dictionary, '', loc );
                    }
                }
                else
                {
                    const dict = input as Record<string, any>;

                    if( isPerRootDictionary( dict ))
                    {
                        const rootKey = findLocaleKey( dict, loc );

                        if( rootKey !== undefined )
                        {
                            collectPaths( dict[rootKey], '', loc );
                        }
                    }
                    else
                    {
                        const rootKey = findLocaleKey( dict, loc );

                        if( rootKey !== undefined && typeof dict[rootKey] === 'object' && !isTranslationLeaf( dict[rootKey] ))
                        {
                            collectPaths( dict[rootKey], '', loc );
                        }
                        else
                        {
                            collectPaths( dict, '' );
                        }
                    }
                }
            }
        }

        const result: Record<string, any> = {};

        for( const relPath of keyPaths )
        {
            const fullPath = prefix + relPath;
            let resolvedLeaf: Leaf | null = null;

            for( const loc of localesToTry )
            {
                resolvedLeaf = this.#resolveLeaf( loc, fullPath );

                if( resolvedLeaf !== null ){ break }
            }

            if( resolvedLeaf !== null )
            {
                const parts = relPath.split( '.' );
                let current = result;

                for( let i = 0; i < parts.length - 1; ++i )
                {
                    const part = parts[i];

                    if( !current[part] || typeof current[part] !== 'object' )
                    {
                        current[part] = {};
                    }

                    current = current[part];
                }

                current[parts[parts.length - 1]] = resolvedLeaf;
            }
        }

        return result;
    }
}
