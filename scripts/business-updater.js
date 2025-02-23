import { refreshBonusHTML } from './utils.js';

export class BusinessUpdater {
    static updateName(newName, businessID) {
        const b = game.actors.get(businessID);
        if (newName !== b.name) {
            b.update({ name: newName })
                .catch(() => refreshBonusHTML(businessID));
        }
    }

    static async updateLevel(newLevel, businessID) {
        const b = game.actors.get(businessID);
        if (newLevel !== b.level) {
            const lvl = Math.min(Math.max(parseInt(newLevel, 10), 0), 20);
            await b.update({ 'system.details.level.value': lvl })
                .catch(() => refreshBonusHTML(businessID));
        }
    }

    static updateGMNotes(event, businessID) {
        const newValue = event.target.value;
        const b = game.actors.get(businessID);
        b.update({ 'flags.business.gmNotes': newValue })
            .catch(() => refreshBonusHTML(businessID));
    }

    static updateOwnerId(businessID, ownerID) {
        const b = game.actors.get(businessID);
        b.update({ 'flags.business.ownerID': ownerID || null })
            .then(() => refreshBonusHTML(businessID));
    }

    static async updateImage(businessID) {
        const fp = new FilePicker({
            type: "image",
            callback: async (path) => {
                const b = game.actors.get(businessID);
                await b.update({ img: path })
                    .then(() => refreshBonusHTML(businessID));
            }
        });
        return fp.browse();
    }
}