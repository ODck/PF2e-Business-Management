import { refreshBonusHTML } from './utils.js';

export class InvestmentManager {
    static decreaseInvestment(businessID) {
        const b = game.actors.get(businessID);
        const newInvestmentLevel = Math.max(0, b.flags.business.investmentLevel - 1);
        b.update({ 'flags.business.investmentLevel': newInvestmentLevel })
            .catch(() => refreshBonusHTML(businessID));
    }

    static increaseInvestment(businessID) {
        const b = game.actors.get(businessID);
        const newInvestmentLevel = Math.min(4, b.flags.business.investmentLevel + 1);
        b.update({ 'flags.business.investmentLevel': newInvestmentLevel })
            .catch(() => refreshBonusHTML(businessID));
    }

    static updateCircumstanceBonus(businessID, event) {
        const newValue = event.target.value;
        const b = game.actors.get(businessID);
        b.update({ 'flags.business.businessMods.mod1': newValue })
            .catch(() => refreshBonusHTML(businessID));
    }
}