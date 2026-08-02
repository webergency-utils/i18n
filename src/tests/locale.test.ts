import { describe, expect, it } from 'vitest';
import { findLocaleKey, isBcp47Locale, normalizeLocale } from '../locale.js';

describe( 'BCP-47 locale helpers', () =>
{
    it( 'accepts language, script, region, and three-letter codes', () =>
    {
        expect( isBcp47Locale( 'sk' )).toBe( true );
        expect( isBcp47Locale( 'fil' )).toBe( true );
        expect( isBcp47Locale( 'en-US' )).toBe( true );
        expect( isBcp47Locale( 'zh-Hans' )).toBe( true );
        expect( isBcp47Locale( 'sr-Latn' )).toBe( true );
        expect( isBcp47Locale( 'zh-Hans-CN' )).toBe( true );
    });

    it( 'rejects non-locale message keys', () =>
    {
        expect( isBcp47Locale( 'hello' )).toBe( false );
        expect( isBcp47Locale( 'messages' )).toBe( false );
        expect( isBcp47Locale( 'api' )).toBe( true ); // 3-letter shape; real ISO codes vary
        expect( isBcp47Locale( 'en_US' )).toBe( false );
    });

    it( 'normalizes case for language, script, and region', () =>
    {
        expect( normalizeLocale( 'zh-hans' )).toBe( 'zh-Hans' );
        expect( normalizeLocale( 'EN-us' )).toBe( 'en-US' );
        expect( normalizeLocale( 'sr-latn' )).toBe( 'sr-Latn' );
        expect( normalizeLocale( 'zh-HANS-cn' )).toBe( 'zh-Hans-CN' );
    });

    it( 'finds locale keys case-insensitively', () =>
    {
        const map = { 'zh-Hans': '你好', sk: 'Ahoj' };

        expect( findLocaleKey( map, 'zh-hans' )).toBe( 'zh-Hans' );
        expect( findLocaleKey( map, 'SK' )).toBe( 'sk' );
        expect( findLocaleKey( map, 'en' )).toBeUndefined();
    });
});
