import { describe, expect, it } from 'vitest';
import
{
    isLocaleMap,
    isMixedLocaleBranch,
    isPerRootDictionary,
    isTranslationLeaf
} from '../structure.js';

describe( 'dictionary structure classification', () =>
{
    it( 'detects translation leaves', () =>
    {
        expect( isTranslationLeaf( 'Ahoj' )).toBe( true );
        expect( isTranslationLeaf([ 'A', 'B' ])).toBe( true );
        expect( isTranslationLeaf({ '#count': { '*': 'x' } })).toBe( true );
        expect( isTranslationLeaf({ sk: 'Ahoj' })).toBe( false );
    });

    it( 'detects locale maps by value shape + BCP-47 keys', () =>
    {
        expect( isLocaleMap({
            sk: 'Ahoj',
            'zh-Hans': '你好',
            fil: 'Kumusta'
        })).toBe( true );

        expect( isLocaleMap({
            sk: { '#count': { '*': 'x' } },
            en: [ 'a', 'b' ]
        })).toBe( true );

        // Namespace: children are locale maps, not leaves
        expect( isLocaleMap({
            id: { sk: 'Identifikátor', en: 'Identifier' },
            to: { sk: 'Komu', en: 'To' }
        })).toBe( false );
    });

    it( 'detects mixed locale branches', () =>
    {
        expect( isMixedLocaleBranch({
            sk: 'Ahoj',
            invalidNonLocaleKey: 'Value'
        })).toBe( true );

        expect( isMixedLocaleBranch({
            sk: 'Ahoj',
            en: 'Hello'
        })).toBe( false );
    });

    it( 'detects per-root dictionaries', () =>
    {
        expect( isPerRootDictionary({
            sk: { hello: 'Ahoj' },
            'zh-Hans': { hello: '你好' }
        })).toBe( true );

        expect( isPerRootDictionary({
            sk: 'Ahoj',
            en: 'Hello'
        })).toBe( false );
    });
});
