import { describe, expect, it } from 'vitest';
import { selectCandidate } from '../select.js';

describe( 'select candidate template', () =>
{
    it( 'selects template and discards candidate with missing variables', () =>
    {
        const candidates = [
            'Ahoj {name}',
            'Čau {name}',
            'Nazdar {name} {title}'
        ];

        // Scopes only has name, not title
        const res = selectCandidate( candidates, [{ name: 'Tom' }], 'sk', {}, () => 0 );

        expect( res ).not.toBeNull();
        expect( res?.missingCount ).toBe( 0 );
        expect( res?.resolvedCount ).toBe( 1 );
        expect( res?.value ).toBe( 'Ahoj Tom' );
    });

    it( 'uses injected random function to select from max-score pool', () =>
    {
        const candidates = [
            'Ahoj {name}',
            'Čau {name}'
        ];

        // Random returns 0.999 (index 1)
        const res = selectCandidate( candidates, [{ name: 'Tom' }], 'sk', {}, () => 0.999 );

        expect( res?.value ).toBe( 'Čau Tom' );
    });

    it( 'applies variable converters', () =>
    {
        const converters = {
            upper: ( v: any ) => String( v ).toUpperCase()
        };

        const res = selectCandidate( 'Hello {name%upper}', [{ name: 'Tom' }], 'en', converters );

        expect( res?.value ).toBe( 'Hello TOM' );
    });

    it( 'handles empty candidates or invalid leaf objects', () =>
    {
        expect( selectCandidate( [], [] )).toBeNull();
        expect( selectCandidate( {} as any, [] )).toBeNull();
    });

    it( 'returns null when all candidates have missing variables', () =>
    {
        const candidates = [
            'Hello {name} {missing1} {missing2}',
            'Hello {name} {missing1}'
        ];

        const res = selectCandidate( candidates, [{ name: 'Tom' }] );

        expect( res ).toBeNull();
    });
});
