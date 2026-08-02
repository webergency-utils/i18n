import { describe, expect, it } from 'vitest';
import { evaluateRuleKey, expandSelectors, parseAffine, parseRange } from '../rules.js';

describe( 'rules engine', () =>
{
    it( 'parses affine expressions correctly', () =>
    {
        expect( parseAffine( '2n+1' )).toEqual({ a: 2, b: 1 });
        expect( parseAffine( '2N' )).toEqual({ a: 2, b: 0 });
        expect( parseAffine( '10n+5' )).toEqual({ a: 10, b: 5 });
        expect( parseAffine( 'n+3' )).toEqual({ a: 1, b: 3 });
        expect( parseAffine( '-2n+10' )).toEqual({ a: -2, b: 10 });
        expect( parseAffine( 'invalid' )).toBeNull();
    });

    it( 'matches affine with integer k >= 0 including negative a', () =>
    {
        // 2n+1 → 1, 3, 5, …
        expect( evaluateRuleKey( '2n+1', 1 ).matched ).toBe( true );
        expect( evaluateRuleKey( '2n+1', 3 ).matched ).toBe( true );
        expect( evaluateRuleKey( '2n+1', 4 ).matched ).toBe( false );

        // -2n+10 → 10, 8, 6, 4, 2, 0 (k = 0..5)
        expect( evaluateRuleKey( '-2n+10', 10 ).matched ).toBe( true );
        expect( evaluateRuleKey( '-2n+10', 8 ).matched ).toBe( true );
        expect( evaluateRuleKey( '-2n+10', 0 ).matched ).toBe( true );
        expect( evaluateRuleKey( '-2n+10', 12 ).matched ).toBe( false );
        expect( evaluateRuleKey( '-2n+10', 9 ).matched ).toBe( false );
    });

    it( 'parses range expressions correctly', () =>
    {
        expect( parseRange( '2-Infinity' )).toEqual({ low: 2, high: Infinity });
        expect( parseRange( '2-4' )).toEqual({ low: 2, high: 4 });
        expect( parseRange( '-Infinity-0' )).toEqual({ low: -Infinity, high: 0 });
        expect( parseRange( 'invalid' )).toBeNull();
    });

    it( 'evaluates rule keys with proper precedence', () =>
    {
        // Exact (rank 5)
        const exactMatch = evaluateRuleKey( '1', 1 );

        expect( exactMatch.matched ).toBe( true );
        expect( exactMatch.rank ).toBe( 5 );

        // Affine (rank 4)
        const affineMatch = evaluateRuleKey( '2n+1', 3 );

        expect( affineMatch.matched ).toBe( true );
        expect( affineMatch.rank ).toBe( 4 );

        // Range (rank 3)
        const rangeMatch = evaluateRuleKey( '2-Infinity', 5 );

        expect( rangeMatch.matched ).toBe( true );
        expect( rangeMatch.rank ).toBe( 3 );

        // CLDR Plural (rank 2)
        const cldrMatch = evaluateRuleKey( 'few', 2, 'sk' );

        expect( cldrMatch.matched ).toBe( true );
        expect( cldrMatch.rank ).toBe( 2 );

        // Catch-all (rank 1)
        const catchAllMatch = evaluateRuleKey( '*', 100 );

        expect( catchAllMatch.matched ).toBe( true );
        expect( catchAllMatch.rank ).toBe( 1 );
    });

    it( 'expands nested selectors depth-first', () =>
    {
        const selectorObj = {
            '#count': {
                '1': 'one item',
                '2-Infinity': {
                    '#gender': {
                        'male': 'many items for him',
                        '*': 'many items'
                    }
                }
            }
        };

        const resultMale = expandSelectors( selectorObj, [{ count: 5, gender: 'male' }], 'en' );

        expect( resultMale ).toBe( 'many items for him' );

        const resultOther = expandSelectors( selectorObj, [{ count: 5, gender: 'female' }], 'en' );

        expect( resultOther ).toBe( 'many items' );
    });
});
