export class TreasuryManager {
    static async addGold(businessID) {
        const dialogContent = `
        <div style="display: flex; margin: 10px 0;">
            <div style="display: flex;">
                <label for="goldInput" style="margin-right: 10px;">Gold:</label>
                <input type="number" id="goldInput">
            </div>
            <div style="display: flex; margin: 0 10px;">
                <label for="silverInput" style="margin: 0 10px;">Silver:</label>
                <input type="number" id="silverInput">
            </div>
        </div>
        `;

        return Dialog.confirm({
            title: 'Save Earnings In Treasury',
            content: dialogContent,
            yes: () => this._handleAddGold(businessID),
            no: () => false,
            defaultYes: false
        });
    }

    static async clearTreasury(businessID) {
        return Dialog.confirm({
            title: 'Empty Treasury',
            content: 'Are you sure you want to empty your treasury?',
            yes: () => {
                this.updateGoldInvested(0, businessID);
                return true;
            },
            no: () => false,
            defaultYes: false
        });
    }

    static updateGoldInvested(newGoldInvested, businessID) {
        const b = game.actors.get(businessID);
        if (!b || newGoldInvested === b.flags.business.goldInvested) return;

        try {
            const gold = parseInt(newGoldInvested);
            b.update({ 'flags.business.goldInvested': gold });
        } catch (e) {
            console.error('Failed to update gold:', e);
        }
    }

    static _handleAddGold(businessID) {
        const goldInput = parseInt(document.getElementById('goldInput').value || 0);
        const silverInput = parseInt(document.getElementById('silverInput').value || 0);
        const b = game.actors.get(businessID);
        
        const oldTreasury = parseInt(b.flags.business.goldInvested);
        const treasury = oldTreasury + ((goldInput * 10) + silverInput);
        this.updateGoldInvested(treasury, businessID);
    }
}