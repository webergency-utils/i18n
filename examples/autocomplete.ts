import { I18N } from '../src/index.js';
import { appDictionary, AppDictionary } from './dictionary.js';

// Instantiate typed I18N instance
const i18n = new I18N<AppDictionary>({
    dictionaries: [ appDictionary ],
    locale: 'sk',
    fallbacks: [ 'sk', 'en' ]
});

// Autocomplete Key Demonstration:
// 1. Language codes (.sk, .en) are NEVER suggested at the end of translation keys!
console.log( i18n.get( 'sk', 'auth.login.button' ));
console.log( i18n.get( 'sk', 'auth.login.title' ));
console.log( i18n.get( 'en', 'auth.login.button' ));

// 2. Multi-branch navigation at same level:
console.log( i18n.get( 'sk', 'auth.register.submit' ));
console.log( i18n.get( 'sk', 'user.profile.title' ));
console.log( i18n.get( 'en', 'user.settings.theme' ));

// 3. Single-child branch deep navigation (automatically compresses down to full leaf path):
console.log( i18n.get( 'sk', 'settings.general.siteName' ));
console.log( i18n.get( 'sk', 'settings.security.twoFactor' ));

// 4. Plural / Selector keys (#count rules omitted from key paths, stopping cleanly at leaf):
console.log( i18n.get( 'sk', 'notifications.unread', { count: 0 }));
console.log( i18n.get( 'sk', 'notifications.unread', { count: 5 }));

// 5. Parameterized string lookups:
console.log( i18n.get( 'sk', 'checkout.cart.total', { amount: 49.99 }));
console.log( i18n.get( 'en', 'dashboard.stats.visitors', { count: 1250 }));
console.log( i18n.get( 'en', 'errors.server', { code: 500 }));
