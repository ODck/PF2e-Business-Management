import { formatGold } from "./utils.js";
import { TreasuryManager } from "./treasury-manager.js";
import { BusinessUpdater } from "./business-updater.js";
import { WorkersManager } from "./worker-manager.js";

export const SuccessDegreeEnum = {
    CRITICAL_SUCCESS: 'Critical Success',
    SUCCESS: 'Success',
    FAILURE: 'Failure',
    CRITICAL_FAILURE: 'Critical Failure'
};

export class BusinessRoll {
    static async rollForBusiness(businessID) {
        const b = game.actors.get(businessID);
        const proficiencyMod = Handlebars.helpers.proficiencyBonus(b.flags.business.workers);
        const situationMod = b.flags.business.businessMods.mod1;
        const reputationMod = Handlebars.helpers.getOwnerLevel(b.flags.business.ownerID);
        const targetDC = Handlebars.helpers.getTargetDC(b.level);
        const defaultFormula = `1d20 + ${proficiencyMod} + ${reputationMod} + ${situationMod}`;

        return this._createRollDialog(defaultFormula, b, targetDC);
    }

    static _determineSuccess(rollResult, targetDC) {
        if (rollResult >= targetDC + 10) return SuccessDegreeEnum.CRITICAL_SUCCESS;
        if (rollResult >= targetDC) return SuccessDegreeEnum.SUCCESS;
        if (rollResult + 10 <= targetDC) return SuccessDegreeEnum.CRITICAL_FAILURE;
        return SuccessDegreeEnum.FAILURE;
    }

    static _getSuccessText(successDegree) {
        const colors = {
            [SuccessDegreeEnum.CRITICAL_SUCCESS]: '#008000',
            [SuccessDegreeEnum.SUCCESS]: '#0000ff',
            [SuccessDegreeEnum.FAILURE]: '#ff4500',
            [SuccessDegreeEnum.CRITICAL_FAILURE]: '#ff0000'
        };
        return `<span style="color: ${colors[successDegree]};">${successDegree}`;
    }

    static async _createRollDialog(defaultFormula, business, targetDC) {
        return new Dialog({
            title: 'Roll Business',
            content: `
                <form>
                    <div class="form-group">
                        <label>Formula:</label>
                        <input id="formula" name="formula" type="text" value="${defaultFormula}">
                    </div>
                </form>
            `,
            buttons: {
                roll: {
                    label: 'Roll',
                    callback: html => this._handleRoll(html, business, targetDC)
                }
            },
            default: 'roll'
        }).render(true);
    }

    static async _handleRoll(html, business, targetDC) {
        const formula = html.find('#formula')[0].value;
        const roll = new Roll(formula);
        await roll.roll();
        
        const successDegree = this._determineSuccess(roll.total, targetDC);
        const { newLevel, earnIncome } = this._calculateResults(business, successDegree);
        
        await this._createChatMessage(business, roll, successDegree, newLevel, earnIncome, targetDC);
    }

    static _calculateResults(business, successDegree) {
        let newLevel = business.level;
        if ([SuccessDegreeEnum.CRITICAL_SUCCESS, SuccessDegreeEnum.SUCCESS].includes(successDegree)) {
            newLevel++;
        } else if (successDegree === SuccessDegreeEnum.CRITICAL_FAILURE) {
            newLevel--;
        }
        newLevel = Math.min(Math.max(parseInt(newLevel, 10), 0), 20);

        let earnIncome = Handlebars.helpers.getExpectedSalary(newLevel);
        if (successDegree === SuccessDegreeEnum.CRITICAL_SUCCESS) {
            earnIncome = Math.floor(earnIncome * 1.2);
        }

        return { newLevel, earnIncome };
    }

    static async _createChatMessage(business, roll, successDegree, newLevel, earnIncome, targetDC) {
        const rollHTML = await roll.render();
        const proficiencyMod = Handlebars.helpers.proficiencyBonus(business.flags.business.workers);
        const reputationMod = Handlebars.helpers.getOwnerLevel(business.flags.business.ownerID);
        const situationMod = business.flags.business.businessMods.mod1;

        const goldElementID = `addGoldButton${Date.now()}`;
        const payWorkersID = `payWorkersButton${Date.now()}`;
        const updateLevelID = `updateLevelButton${Date.now()}`;

        let updateLevelButton = '';
        if (successDegree !== SuccessDegreeEnum.FAILURE) {
            updateLevelButton = `<button type="button" id="${updateLevelID}">Update Level (Mod: ${newLevel - business.level})</button>`;
        }

        const rollMessage = await roll.toMessage({
            speaker: {
                scene: null,
                actor: null,
                token: null,
                alias: business.name
            },
            flavor: `Rolling ${roll.formula}...`,
            content: `
                <strong>Investment:</strong> ${Handlebars.helpers.investmentLabel(business.flags.business.investmentLevel)}<br>
                <strong>Workers Proficiency:</strong> ${proficiencyMod}<br>
                <strong>Owner Reputation:</strong> ${reputationMod}<br>
                <strong>Situational Bonus:</strong> ${situationMod}<br>
                <br>
                <strong>Result</strong> ${this._getSuccessText(successDegree)} (DC: ${targetDC}, Roll: ${roll.total}) </span><br>
                <strong>New Business Level:</strong> ${newLevel}<br>
                <strong>Income this week:</strong> ${formatGold(earnIncome)}<br>
                <br>
                ${rollHTML}

                <button type="button" id="${goldElementID}">Add Gold</button>
                <button type="button" id="${payWorkersID}">Pay Workers</button>
                ${updateLevelButton}
            `
        });

        this._attachMessageListeners(rollMessage, business, earnIncome, newLevel, goldElementID, payWorkersID, updateLevelID);
    }

    static _attachMessageListeners(message, business, earnIncome, newLevel, goldElementID, payWorkersID, updateLevelID) {
        Hooks.on('renderChatMessage', (app, html, messageData) => {
            if (messageData.message._id !== message._id) return;

            html.find(`#${goldElementID}`).click(async () => {
                const oldTreasury = parseInt(business.flags.business.goldInvested);
                const treasury = oldTreasury + earnIncome;
                TreasuryManager.updateGoldInvested(treasury, business.id);
                await this._updateButtonState(message, goldElementID, 'Added Gold');
                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: business }),
                    content: `<strong>${business.name}:</strong> Added ${formatGold(earnIncome)} gold to the treasury.`
                });
            });

            html.find(`#${payWorkersID}`).click(async () => {
                const oldTreasury = parseInt(business.flags.business.goldInvested);
                const workersCost = WorkersManager.getWorkersCostRaw(business.id);
                const paymentOK = workersCost <= oldTreasury;
            
                if (!paymentOK) {
                    // Don't update treasury if can't pay full amount
                    await this._updateButtonState(message, payWorkersID, 'Cannot Pay');
                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: business }),
                        content: `<strong>${business.name}:</strong><br>
                                 <strong style="color: #ff4500;">Not enough gold to pay workers!</strong><br>
                                 Required: ${formatGold(workersCost)}<br>
                                 Available: ${formatGold(oldTreasury)}<br>
                                 Missing: ${formatGold(workersCost - oldTreasury)}`
                    });
                    return;
                }
            
                const treasury = oldTreasury - workersCost;
                TreasuryManager.updateGoldInvested(treasury, business.id);
                await this._updateButtonState(message, payWorkersID, 'Workers Paid');
                
                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: business }),
                    content: `<strong>${business.name}:</strong> Paid ${formatGold(workersCost)} to the workers.`
                });
            });

            if (updateLevelID) {
                html.find(`#${updateLevelID}`).click(async () => {
                    BusinessUpdater.updateLevel(newLevel, business.id);
                    await this._updateButtonState(message, updateLevelID, `Update Level (Mod: ${newLevel - business.level})`);
                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker({ actor: business }),
                        content: `<strong>${business.name}:</strong> Business level updated to ${newLevel}.`
                    });
                });
            }
        });
    }

    static async _updateButtonState(message, buttonId, buttonText) {
        // Find the button in the content regardless of its current text
        const buttonPattern = new RegExp(`<button[^>]*id="${buttonId}"[^>]*>.*?</button>`);
        const updatedContent = message.content.replace(
            buttonPattern,
            `<button type="button" id="${buttonId}" class="b-disabled-button" disabled>${buttonText}</button>`
        );
        
        // Force a content update
        await message.update({
            content: updatedContent,
            flags: {
                buttonVisible: false,
                type: 0
            }
        }, { diff: false });
    }
}


