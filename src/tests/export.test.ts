import { describe, expect, it } from 'vitest';
import { I18N } from '../i18n.js';

describe( 'dictionary export', () =>
{
    it( 'exports single-language dictionary tree filling missing keys from fallbacks', () =>
    {
        const dict = {
            greetings: {
                hello: {
                    sk: 'Ahoj',
                    en: 'Hello'
                },
                welcome: {
                    en: 'Welcome'
                }
            }
        };

        const i18n = new I18N({
            dictionaries: [ dict ],
            locale: 'en',
            fallbacks: [ 'en' ]
        });

        const skExport = i18n.dictionary( 'sk' );

        expect( skExport ).toEqual({
            greetings: {
                hello: 'Ahoj',
                welcome: 'Welcome'
            }
        });
    });

    it( 'preserves array variants and selector objects in exported dictionary', () =>
    {
        const dict = {
            greetings: {
                hello: {
                    sk: [ 'Ahoj {name}', 'Čau {name}' ]
                }
            },
            to_men: {
                sk: {
                    '#count': {
                        '1': 'mužovi',
                        '*': 'mužom'
                    }
                }
            }
        };

        const i18n = new I18N({ dictionaries: [ dict ] });

        const skExport = i18n.dictionary( 'sk' );

        expect( skExport.greetings.hello ).toEqual([ 'Ahoj {name}', 'Čau {name}' ]);
        expect( skExport.to_men[ '#count' ]).toEqual({
            '1': 'mužovi',
            '*': 'mužom'
        });
    });

    it( 'exports string leaves from single-language specs', () =>
    {
        const i18n = new I18N({
            dictionaries: [
                { locale: 'sk', dictionary: { hello: 'Ahoj', nested: { x: 'X' } } },
                { locale: 'en', dictionary: { hello: 'Hello', onlyEn: 'E' } }
            ],
            fallbacks: [ 'en' ]
        });

        expect( i18n.dictionary( 'sk' )).toEqual({
            hello: 'Ahoj',
            nested: { x: 'X' },
            onlyEn: 'E'
        });
    });

    it( 'exports string leaves from per-root dictionaries', () =>
    {
        const i18n = new I18N({
            dictionaries: [
                {
                    sk: { hello: 'Ahoj', nest: { y: 'Y' } },
                    en: { hello: 'Hello', onlyEn: 'E' }
                }
            ],
            fallbacks: [ 'en' ]
        });

        expect( i18n.dictionary( 'sk' )).toEqual({
            hello: 'Ahoj',
            nest: { y: 'Y' },
            onlyEn: 'E'
        });
    });

    it( 'exports two-letter message keys that are namespaces over locale maps', () =>
    {
        const i18n = new I18N({
            dictionaries: [
                {
                    messages: {
                        id: { sk: 'Identifikátor', en: 'Identifier' },
                        to: { sk: 'Komu', en: 'To' }
                    }
                }
            ]
        });

        expect( i18n.dictionary( 'sk' )).toEqual({
            messages: {
                id: 'Identifikátor',
                to: 'Komu'
            }
        });
    });
});
