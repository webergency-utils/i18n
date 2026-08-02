import { describe, expect, it } from 'vitest';
import { validateDictionaries } from '../validate.js';

describe( 'validateDictionaries utility', () =>
{
    it( 'detects missing keys across requested locales', () =>
    {
        const dict = {
            greetings: {
                hello: { sk: 'Ahoj', en: 'Hello' },
                welcome: { sk: 'Vítajte' } // Missing en
            }
        };

        const report = validateDictionaries({
            dictionaries: [ dict ],
            locales: [ 'sk', 'en' ]
        });

        expect( report.valid ).toBe( false );
        expect( report.errors.some( e => e.type === 'missing_key' && e.locale === 'en' && e.path === 'greetings.welcome' )).toBe( true );
    });

    it( 'detects unclosed placeholder braces', () =>
    {
        const dict = {
            hello: {
                sk: 'Ahoj {name'
            }
        };

        const report = validateDictionaries({ dictionaries: [ dict ] });

        expect( report.valid ).toBe( false );
        expect( report.errors.some( e => e.type === 'invalid_placeholder' )).toBe( true );
    });

    it( 'detects unknown converters', () =>
    {
        const dict = {
            price: {
                en: 'Total: {val%customCurrency}'
            }
        };

        const report = validateDictionaries({
            dictionaries: [ dict ],
            converters: {} // customCurrency not registered
        });

        expect( report.valid ).toBe( false );
        expect( report.errors.some( e => e.type === 'unknown_converter' )).toBe( true );
    });

    it( 'returns valid = true for complete and valid dictionaries', () =>
    {
        const dict = {
            greetings: {
                hello: { sk: 'Ahoj {name}', en: 'Hello {name}' }
            }
        };

        const report = validateDictionaries({
            dictionaries: [ dict ],
            locales: [ 'sk', 'en' ]
        });

        expect( report.valid ).toBe( true );
        expect( report.errors.length ).toBe( 0 );
    });

    it( 'detects nested braces and unmatched closing braces', () =>
    {
        const dict1 = { hello: { sk: 'Ahoj {{name}' } };
        const dict2 = { hello: { sk: 'Ahoj name}' } };

        const r1 = validateDictionaries({ dictionaries: [ dict1 ] });
        const r2 = validateDictionaries({ dictionaries: [ dict2 ] });

        expect( r1.valid ).toBe( false );
        expect( r2.valid ).toBe( false );
    });

    it( 'detects mixed locale branches', () =>
    {
        const invalidDict = {
            branch: {
                sk: 'Ahoj',
                invalidKey: 'Val'
            }
        };

        const report = validateDictionaries({ dictionaries: [ invalidDict ] });

        expect( report.valid ).toBe( false );
        expect( report.errors.some( e => e.type === 'mixed_branch' )).toBe( true );
    });
});
