import { formatGold } from "./utils.js";
import { WorkersManager } from './worker-manager.js';
import { InvestmentManager } from './investment-manager.js';
import { TreasuryManager } from './treasury-manager.js';
import { BusinessRoll } from './business-roll.js';
import { BusinessUpdater } from "./business-updater.js";
import { BusinessSettings } from "./business-settings.js";

export const registerHelpers = () => {
    
    Handlebars.registerHelper({

        investmentLabel: (level) => {
            const labels = {
                0: { label: 'Cart', color: '#424242' },
                1: { label: 'Small', color: '#171f69' },
                2: { label: 'Medium', color: '#3c005e' },
                3: { label: 'Large', color: '#664400' },
                4: { label: 'Huge', color: '#5e0000' }
            };

            const label = labels[level] || labels[0];
            return new Handlebars.SafeString(`<span style="color: ${label.color};">${label.label}</span>`);

        },

        investmentBonus: (investmentLevel) => {
            const investmentMod = [-2, 0, 1, 2, 3, 4, 5];
            return investmentMod[investmentLevel];
        },

        proficiencyText: (proficiency) => {
            switch (proficiency) {
                case 0: return 'Untrained';
                case 1: return 'Trained';
                case 2: return 'Expert';
                case 3: return 'Master';
                case 4: return 'Legendary';
                default: return 'Untrained';
            }
        },

        proficiencyColor: (proficiency) => {
            switch (proficiency) {
                case 0: return 'font-weight: 600; color: #424242';
                case 1: return 'font-weight: 600; color: #171f69';
                case 2: return 'font-weight: 600; color: #3c005e';
                case 3: return 'font-weight: 600; color: #664400';
                case 4: return 'font-weight: 600; color: #5e0000';
                default: return 'font-weight: 600; color: #424242';
            }
        },

        selectedProficiency: (option, value) => {
            if (option === value) {
                return ' selected';
            } else {
                return ''
            }
        },

        proficiencyBonus: (workers) => {
            if (!workers || !Array.isArray(workers)) return 0;

            const proficiencyMod = [0, 2, 4, 6, 8];
            return workers.reduce((bonus, worker) => {
                const profValue = Math.min(Math.max(worker.proficiency || 0, 0), 4);
                return bonus + proficiencyMod[profValue];
            }, 0);
        },


        getActorName: (actorId) => {
            const actor = game.actors.get(actorId);
            if (!actor) return '';
            return `${actor.name} - Level ${actor.level}`;
        },

        getOwnerLevel: (actorId) => {
            const actor = game.actors.get(actorId);
            if (!actor) return 0;
            return actor.level;
        },

        getTargetDC: (level) => {
            const targetDC = game.settings.get(BusinessSettings.MODULE_ID, 'targetDC')[level]
            return targetDC;
        },

        formatGold: (amount) => {
            return formatGold(amount);
        },

        getExpectedSalary: (level) => {
            const earnIncome = game.settings.get(BusinessSettings.MODULE_ID, 'earnIncome')[level]
            return earnIncome;
        },

        getExpectedSalaryFormatted: (level) => {
            const earnIncome = game.settings.get(BusinessSettings.MODULE_ID, 'earnIncome')[level]
            return formatGold(earnIncome);
        },

        getMaxWorkers: (investmentLevel) => {
            return investmentLevel;
        },

        getWorkersCost: (businessID) => {
            let totalCost = WorkersManager.getWorkersCostRaw(businessID);
            return formatGold(totalCost);
        },

        checkedStatus: (businessID, index) => {
            const b = game.actors.get(businessID);
            const workersList = b.flags.business.workers;
            const isWorkerLeader = workersList[index].isLeader;
            return isWorkerLeader;
        },

        userIsGM: () => {
            return game.user.isGM;
        },

        isWorkerMisconfigured: (worker, index, workers, investmentLevel) => {
            const issues = [];
            const checks = game.settings.get(BusinessSettings.MODULE_ID, 'workerChecks');
            const maxNonLeaderProficiency = 2;
            
            // Check worker limit
            if (checks.workerLimit && index >= investmentLevel) {
                issues.push("Exceeds maximum workers for current investment level");
            }

            // Check proficiency issues
            if (checks.proficiencyLimit) {
                // Check if non-leader has too high proficiency
                if (!worker.isLeader && worker.proficiency > maxNonLeaderProficiency) {
                    issues.push(`Non-leader worker cannot be above Expert`);
                }
            }

            return issues.length > 0 ? issues.join(", ") : false;
        },
    
        getWorkerRowStyle: (worker, index, workers, investmentLevel) => {
            const isMisconfigured = Handlebars.helpers.isWorkerMisconfigured(worker, index, workers, investmentLevel);
            if (isMisconfigured) {
                return 'background-color: #fff0f0; border-left: 3px solid #ff4444;';
            }
            return '';
        }
    });
};

export const registerGlobals = () => {
    globalThis.WorkersManager = WorkersManager;
    globalThis.InvestmentManager = InvestmentManager;
    globalThis.TreasuryManager = TreasuryManager;
    globalThis.BusinessRoll = BusinessRoll;
    globalThis.BusinessUpdater = BusinessUpdater;
}