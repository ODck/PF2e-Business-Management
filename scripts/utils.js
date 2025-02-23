// Export utility functions
import { DragDropManager } from './drag-drop-manager.js';

export function formatGold(amount) {
    const gp = Math.floor(amount / 10);
    const sp = amount % 10;
    let formattedGold = '';
    if (gp > 0) {
        formattedGold += `${gp} gp`;
    }
    if (sp > 0) {
        if (formattedGold !== '') {
            formattedGold += ' ';
        }
        formattedGold += `${sp} sp`;
    }

    return formattedGold;
};

export function refreshBonusHTML(businessID) {
    const b = game.actors.get(businessID);
    document.getElementById('businessSize').innerHTML = Handlebars.helpers.investmentLabel(b.flags.business.investmentLevel);
    document.getElementById('mod-workers').value = Handlebars.helpers.proficiencyBonus(b.flags.business.workers);
    document.getElementById('mod-reputation').value = Handlebars.helpers.getOwnerLevel(b.flags.business.ownerID);
    document.getElementById('mod-situation').value = b.flags.business.businessMods.mod1;
    document.getElementById('target-dc').value = Handlebars.helpers.getTargetDC(b.level);
    document.getElementById('expected-salary').value = Handlebars.helpers.getExpectedSalaryFormatted(b.level);
    document.getElementById('max-workers').value = Handlebars.helpers.getMaxWorkers(b.flags.business.investmentLevel);
    document.getElementById('workers-cost').value = Handlebars.helpers.getWorkersCost(businessID);
    document.getElementById('goldInvestment').value = Handlebars.helpers.formatGold(b.flags.business.goldInvested);
    document.getElementById('businessLevel').value = b.level;

    document.getElementById('workerList').innerHTML = Handlebars.compile('{{> workersTemplate}}')({ business: b }, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });
    document.getElementById('drag-actor').innerHTML = Handlebars.compile('{{> dragActor}}')({ business: b }, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });

    document.getElementById('businessName').value = `${b.name}`;
    document.getElementById('businessImg').src = `${b.img}`

    DragDropManager.addListenerToDragActor(b)

    const element = document.getElementById('gmNotes');
    if (element)
        element.innerHTML = b.flags.business.gmNotes;
}