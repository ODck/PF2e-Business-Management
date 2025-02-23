import { refreshBonusHTML } from './utils.js';
import { BusinessSettings } from './business-settings.js';

export class WorkersManager {
    static async addWorker(businessID) {
        const b = game.actors.get(businessID);
        if (!b) return;

        const newWorker = {
            name: 'New Worker',
            proficiency: 0,
            isLeader: false
        };

        const workersList = foundry.utils.duplicate(b.flags.business.workers);
        workersList.push(newWorker);

        await b.update({ 'flags.business.workers': workersList })
            .catch(() => refreshBonusHTML(businessID));
    }

    static async removeWorker(businessID, index) {
        const b = game.actors.get(businessID);
        const workers = foundry.utils.duplicate(b.flags.business.workers);

        if (index >= 0 && index < workers.length) {
            workers.splice(index, 1);
            await b.update({ 'flags.business.workers': workers })
                .catch(() => refreshBonusHTML(businessID));
        }
    }

    static updateWorkerName(newName, businessID, index) {
        const b = game.actors.get(businessID);
        const workers = foundry.utils.duplicate(b.flags.business.workers);
        if (newName !== workers[index].name) {
            workers[index].name = newName;
            b.update({ 'flags.business.workers': workers })
                .catch(() => refreshBonusHTML(businessID));
        }
    }

    static updateWorkerProficiency(newProficiency, businessID, index) {
        const b = game.actors.get(businessID);
        const workers = foundry.utils.duplicate(b.flags.business.workers);
        if (newProficiency !== workers[index].proficiency) {
            const prof = parseInt(newProficiency);
            workers[index].proficiency = prof;
            b.update({ 'flags.business.workers': workers })
                .catch(() => refreshBonusHTML(businessID));
        }
    }

    static updateLeader(businessID, index) {
        const b = game.actors.get(businessID);
        const workersList = foundry.utils.duplicate(b.flags.business.workers);
        workersList.forEach((worker, i) => {
            worker.isLeader = (i === parseInt(index));
        });
        b.update({ 'flags.business.workers': workersList })
            .catch(() => refreshBonusHTML(businessID));
    }

    static getWorkersCostRaw(businessID) {
        const workersCost = game.settings.get(BusinessSettings.MODULE_ID, 'workerCost');
        const b = game.actors.get(businessID);
        if (!b || !b.flags.business.workers) return 0;
        
        return b.flags.business.workers.reduce((total, worker) => {
            return total + (workersCost[worker.proficiency] || 0);
        }, 0);
    }
}