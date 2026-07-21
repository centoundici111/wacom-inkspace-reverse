import deTerms from '../l10n/terms/de.html'
import enTerms from '../l10n/terms/en.html'
import esTerms from '../l10n/terms/es.html'
import frTerms from '../l10n/terms/fr.html'
import itTerms from '../l10n/terms/it.html'
import jaTerms from '../l10n/terms/ja.html'
import koTerms from '../l10n/terms/ko.html'
import plTerms from '../l10n/terms/pl.html'
import ptTerms from '../l10n/terms/pt.html'
import ruTerms from '../l10n/terms/ru.html'
import zhCNTerms from '../l10n/terms/zh-CN.html'
import zhTWTerms from '../l10n/terms/zh-TW.html'

import LocalesManager from '../globals/LocalesManager';

let EulaManager = {
    getEulaHtml(language = LocalesManager.lang) {
        switch (language) {
            case 'de':
                return deTerms;
            case 'en':
                return enTerms;
            case 'es':
                return esTerms;
            case 'fr':
                return frTerms;
            case 'it':
                return itTerms;
            case 'ja':
                return jaTerms;
            case 'ko':
                return koTerms;
            case 'pl':
                return plTerms;
            case 'pt':
                return ptTerms;
            case 'ru':
                return ruTerms;
            case 'zh-CN':
                return zhCNTerms;
            case 'zh-TW':
                return zhTWTerms;
            default:
                throw 'EULA language is not found.';
        }
    }
};

export default EulaManager;