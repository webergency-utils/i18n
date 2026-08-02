export const appDictionary = {
    auth: {
        login: {
            title: { sk: 'Prihlásenie', en: 'Log In' },
            button: { sk: 'Prihlásiť sa', en: 'Sign In' },
            forgotPassword: { sk: 'Zabudnuté heslo?', en: 'Forgot Password?' }
        },
        register: {
            title: { sk: 'Registrácia', en: 'Register' },
            submit: { sk: 'Vytvoriť účet', en: 'Create Account' }
        },
        session: {
            expired: { sk: 'Relácia vypršala', en: 'Session expired' }
        }
    },
    user: {
        profile: {
            title: { sk: 'Profil používateľa', en: 'User Profile' },
            avatar: { sk: 'Profilový obrázok', en: 'Avatar' }
        },
        settings: {
            theme: { sk: 'Téma', en: 'Theme' },
            language: { sk: 'Jazyk', en: 'Language' }
        },
        status: {
            active: { sk: 'Aktívny', en: 'Active' },
            suspended: { sk: 'Pozastavený', en: 'Suspended' }
        }
    },
    checkout: {
        cart: {
            empty: { sk: 'Košík je prázdny', en: 'Cart is empty' },
            total: { sk: 'Spolu: {amount%currency}', en: 'Total: {amount%currency}' }
        },
        shipping: {
            method: { sk: 'Spôsob doručenia', en: 'Shipping Method' },
            address: { sk: 'Doručovacia adresa', en: 'Shipping Address' }
        },
        payment: {
            card: { sk: 'Platba kartou', en: 'Card Payment' },
            success: { sk: 'Platba bola úspešná', en: 'Payment successful' }
        }
    },
    billing: {
        invoices: {
            title: { sk: 'Faktúry', en: 'Invoices' },
            download: { sk: 'Stiahnuť PDF', en: 'Download PDF' }
        },
        subscription: {
            plan: { sk: 'Balík: {name}', en: 'Plan: {name}' },
            renewDate: { sk: 'Obnovenie: {date}', en: 'Renews: {date}' }
        }
    },
    dashboard: {
        stats: {
            visitors: { sk: 'Návštevníci: {count}', en: 'Visitors: {count}' },
            sales: { sk: 'Predaje: {count}', en: 'Sales: {count}' }
        },
        charts: {
            weekly: { sk: 'Týždenný prehľad', en: 'Weekly Overview' },
            monthly: { sk: 'Mesačný prehľad', en: 'Monthly Overview' }
        }
    },
    notifications: {
        unread: {
            '#count': {
                '0': { sk: 'Žiadne nové správy', en: 'No new notifications' },
                '1': { sk: '1 nová správa', en: '1 new notification' },
                '*': { sk: '{count} nových správ', en: '{count} new notifications' }
            }
        },
        email: {
            sent: { sk: 'Email bol odoslaný', en: 'Email sent' }
        }
    },
    settings: {
        general: {
            siteName: { sk: 'Názov stránky', en: 'Site Name' }
        },
        security: {
            twoFactor: { sk: 'Dvojfaktorové overenie', en: 'Two-Factor Authentication' }
        }
    },
    errors: {
        notFound: { sk: 'Stránka nenájdená', en: 'Page not found' },
        unauthorized: { sk: 'Neoprávnený prístup', en: 'Unauthorized access' },
        server: { sk: 'Chyba servera ({code})', en: 'Server error ({code})' }
    },
    common: {
        buttons: {
            save: { sk: 'Uložiť', en: 'Save' },
            cancel: { sk: 'Zrušiť', en: 'Cancel' },
            delete: { sk: 'Vymazať', en: 'Delete' }
        },
        labels: {
            search: { sk: 'Hľadať...', en: 'Search...' },
            loading: { sk: 'Načítavam...', en: 'Loading...' }
        }
    }
};

export type AppDictionary = typeof appDictionary;
