import { describe, expect, it } from 'vitest';
import { I18N } from '../i18n.js';

describe( 'I18N core library integration', () =>
{
    it( 'resolves Slovak declension correctly via #count rules', () =>
    {
        const dict = {
            to_men: {
                sk: {
                    '#count': {
                        '1': 'mužovi',
                        '2n+1': 'mužíkom',
                        '2-Infinity': 'mužom',
                        '*': 'mužom'
                    }
                }
            }
        };

        const i18n = new I18N({ dictionaries: [ dict ] });

        expect( i18n.get( 'sk', 'to_men', { count: 1 })).toBe( 'mužovi' );
        expect( i18n.get( 'sk', 'to_men', { count: 3 })).toBe( 'mužíkom' );
        expect( i18n.get( 'sk', 'to_men', { count: 4 })).toBe( 'mužom' );
    });

    it( 'resolves English plurals via CLDR categories', () =>
    {
        const dict = {
            items: {
                en: {
                    '#count': {
                        'one': '{count} item',
                        'other': '{count} items'
                    }
                }
            }
        };

        const i18n = new I18N({ dictionaries: [ dict ] });

        expect( i18n.get( 'en', 'items', { count: 1 })).toBe( '1 item' );
        expect( i18n.get( 'en', 'items', { count: 5 })).toBe( '5 items' );
    });

    it( 'supports single-language dictionary formats', () =>
    {
        const skDict = {
            greetings: {
                hello: 'Ahoj {name}'
            }
        };

        const enDict = {
            greetings: {
                hello: 'Hello {name}'
            }
        };

        const i18n = new I18N({
            dictionaries: [
                { locale: 'sk', dictionary: skDict },
                { en: enDict }
            ]
        });

        expect( i18n.get( 'sk', 'greetings.hello', { name: 'Peter' })).toBe( 'Ahoj Peter' );
        expect( i18n.get( 'en', 'greetings.hello', { name: 'Peter' })).toBe( 'Hello Peter' );
    });

    it( 'enforces last-wins dictionary precedence', () =>
    {
        const baseDict = {
            greetings: {
                hello: { sk: 'Ahoj', en: 'Hello' }
            }
        };

        const overrideDict = {
            greetings: {
                hello: { sk: 'Čau', en: 'Howdy' }
            }
        };

        const i18n = new I18N({
            dictionaries: [ baseDict, overrideDict ]
        });

        expect( i18n.get( 'sk', 'greetings.hello' )).toBe( 'Čau' );
        expect( i18n.get( 'en', 'greetings.hello' )).toBe( 'Howdy' );
    });

    it( 'throws error on invalid mixed locale branch constraint', () =>
    {
        const invalidDict = {
            greetings: {
                sk: 'Ahoj',
                invalidNonLocaleKey: 'Value'
            }
        };

        const i18n = new I18N({ dictionaries: [ invalidDict ] });

        expect( () => i18n.get( 'sk', 'greetings' )).toThrow( /Invalid multi-language locale branch/ );
    });

    it( 'falls back to fallback key when key missing', () =>
    {
        const dict = {
            fallback_key: {
                sk: 'Fallback Text'
            }
        };

        const i18n = new I18N({ dictionaries: [ dict ] });

        expect( i18n.get( 'sk', 'missing_key', 'fallback_key' )).toBe( 'Fallback Text' );
        expect( i18n.get( 'sk', 'missing_key1', 'missing_key2' )).toBe( 'missing_key1' );
    });

    it( 'applies custom converters and whole-string transform', () =>
    {
        const dict = {
            price: {
                en: 'Total: {val%currency:2}'
            }
        };

        const i18n = new I18N({
            dictionaries: [ dict ],
            converters: {
                currency: ( v: any, decimals?: string ) => Number( v ).toFixed( Number( decimals || 2 ))
            },
            transform: ( str: string ) => str.toUpperCase()
        });

        expect( i18n.get( 'en', 'price', { val: 12.3456 })).toBe( 'TOTAL: 12.35' );
    });

    it( 'caches lookups lazily on demand', () =>
    {
        let getterCount = 0;
        const dynamicDict = {
            get greeting()
            {
                getterCount++;
                return { sk: 'Ahoj' };
            }
        };

        const i18n = new I18N({ dictionaries: [ dynamicDict ] });

        // Zero getter calls during constructor
        expect( getterCount ).toBe( 0 );

        // First call triggers resolution and caches
        expect( i18n.get( 'sk', 'greeting' )).toBe( 'Ahoj' );

        const firstCount = getterCount;

        // Second call hits cache (0 additional getter calls)
        expect( i18n.get( 'sk', 'greeting' )).toBe( 'Ahoj' );
        expect( getterCount ).toBe( firstCount );
    });

    it( 'supports BCP-47 locales including script and three-letter codes', () =>
    {
        const dict = {
            hello: {
                sk: 'Ahoj',
                'zh-Hans': '你好 {name}',
                'sr-Latn': 'Zdravo {name}',
                fil: 'Kumusta {name}'
            }
        };

        const i18n = new I18N({ dictionaries: [ dict ] });

        expect( i18n.get( 'zh-hans', 'hello', { name: 'Tom' })).toBe( '你好 Tom' );
        expect( i18n.get( 'sr-Latn', 'hello', { name: 'Tom' })).toBe( 'Zdravo Tom' );
        expect( i18n.get( 'fil', 'hello', { name: 'Tom' })).toBe( 'Kumusta Tom' );
    });

    it( 'keeps two-letter message keys as namespaces over locale maps', () =>
    {
        const dict = {
            messages: {
                id: { sk: 'Identifikátor', en: 'Identifier' },
                to: { sk: 'Komu', en: 'To' }
            }
        };

        const i18n = new I18N({ dictionaries: [ dict ] });

        expect( i18n.get( 'sk', 'messages.id' )).toBe( 'Identifikátor' );
        expect( i18n.get( 'en', 'messages.to' )).toBe( 'To' );
    });

    it( 'falls through locale chain when template vars are unresolved', () =>
    {
        const dict = {
            greet: {
                sk: 'Ahoj {name}',
                en: 'Hello'
            }
        };

        const i18n = new I18N({
            dictionaries: [ dict ],
            fallbacks: [ 'en' ]
        });

        expect( i18n.get( 'sk', 'greet' )).toBe( 'Hello' );
    });

    it( 'supports TypeScript typed autocomplete keys via I18N<TDict>', () =>
    {
        const typedDict = {
            greetings: {
                hello: { sk: 'Ahoj', en: 'Hello' }
            },
            messages: {
                welcome: { sk: 'Vítajte', en: 'Welcome' }
            }
        };

        type AppDict = typeof typedDict;

        const i18n = new I18N<AppDict>({
            dictionaries: [ typedDict ],
            locale: 'sk'
        });

        expect( i18n.get( 'sk', 'greetings.hello' )).toBe( 'Ahoj' );
        expect( i18n.get( 'sk', 'messages.welcome' )).toBe( 'Vítajte' );
    });
});
