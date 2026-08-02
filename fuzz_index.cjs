const { FuzzedDataProvider } = require('@jazzer.js/core');
const i18nLib = require('./dist/index.cjs');

function createFuzzedInput( provider, depth = 0, maxDepth = 3 )
{
    if( depth >= maxDepth )
    {
        return provider.consumeString( 20 );
    }

    const type = provider.consumeIntegralInRange( 0, 4 );

    switch( type )
    {
        case 0:
            return provider.consumeString( 15 );
        case 1:
            return provider.consumeNumber();
        case 2:
            return provider.consumeBoolean();
        case 3:
        {
            const arr = [];
            const count = provider.consumeIntegralInRange( 1, 3 );
            for( let i = 0; i < count; ++i )
            {
                arr.push( createFuzzedInput( provider, depth + 1, maxDepth ));
            }
            return arr;
        }
        case 4:
        {
            const obj = {};
            const count = provider.consumeIntegralInRange( 1, 3 );
            for( let i = 0; i < count; ++i )
            {
                const key = provider.consumeString( 8 );
                if( key )
                {
                    obj[key] = createFuzzedInput( provider, depth + 1, maxDepth );
                }
            }
            return obj;
        }
        default:
            return provider.consumeString( 10 );
    }
}

module.exports.fuzz = function( data )
{
    try
    {
        const provider = new FuzzedDataProvider( data );

        const key = provider.consumeString( 20 );
        const locale = provider.consumeString( 5 );
        const dictObj = createFuzzedInput( provider );

        if( typeof dictObj === 'object' && dictObj !== null )
        {
            const i18n = new i18nLib.I18N({
                dictionaries: [ dictObj ],
                locale: locale || 'en',
                fallbacks: [ 'en' ]
            });

            i18n.get( locale || 'en', key, { count: provider.consumeIntegralInRange( 0, 10 ) } );
            i18n.dictionary( locale || 'en' );

            i18nLib.validateDictionaries({
                dictionaries: [ dictObj ],
                locales: [ 'en', 'sk' ]
            });
        }
    }
    catch( e )
    {
        if( e instanceof RangeError || e instanceof TypeError )
        {
            return;
        }
        throw e;
    }
};
