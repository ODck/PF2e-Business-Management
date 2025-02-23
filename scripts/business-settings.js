export class BusinessSettings {
    static MODULE_ID = 'pf2e-business';
    static OLD_MODULE_ID = 'business';

    static DEFAULT_TARGET_DC_CONFIG = {
        0: 14, 1: 16, 2: 18, 3: 20, 4: 23, 5: 25, 6: 28, 7: 30, 8: 32, 9: 35,
        10: 37, 11: 39, 12: 42, 13: 44, 14: 46, 15: 49, 16: 21, 17: 53, 18: 56, 19: 58, 20: 60
    };

    static DEFAULT_EARN_INCOME_CONFIG = {
        0: 4, 1: 14, 2: 21, 3: 35, 4: 56, 5: 70, 6: 140, 7: 175, 8: 210, 9: 280,
        10: 420, 11: 560, 12: 700, 13: 1050, 14: 1400, 15: 1960, 16: 2800, 17: 3850, 18: 4900, 19: 9100, 20: 14000
    };

    static DEFAULT_WORKER_COST_CONFIG = {
        0: 7, 1: 14, 2: 35, 3: 105, 4: 350
    };

    static DEFAULT_BUILDING_COST_CONFIG = {
        0: 1000, 1: 3000, 2: 20000, 3: 60000, 4: 150000
    };

    static registerSettings() {
        game.settings.register(this.MODULE_ID, 'targetDC', {
            name: 'Target DC Configuration',
            hint: 'Configuration for target DC',
            scope: 'world',
            config: false,
            default: this.DEFAULT_TARGET_DC_CONFIG
        });

        game.settings.register(this.MODULE_ID, 'earnIncome', {
            name: 'Earn Income Configuration',
            hint: 'Configuration for earning income',
            scope: 'world',
            config: false,
            type: Object,
            default: this.DEFAULT_EARN_INCOME_CONFIG
        });

        game.settings.register(this.MODULE_ID, 'workerCost', {
            name: 'Worker Cost Configuration',
            hint: 'Configuration for worker cost',
            scope: 'world',
            config: false,
            default: this.DEFAULT_WORKER_COST_CONFIG
        });

        game.settings.register(this.MODULE_ID, 'buildingCost', {
            name: 'Building Cost Configuration',
            hint: 'Configuration for building cost',
            scope: 'world',
            config: false,
            default: this.DEFAULT_BUILDING_COST_CONFIG
        });

        game.settings.register(this.MODULE_ID, 'workerChecks', {
            name: 'Worker Configuration Checks',
            hint: 'Enable or disable worker configuration checks',
            scope: 'world',
            config: true,
            type: Object,
            default: {
                workerLimit: true,
                proficiencyLimit: true
            }
        });
    }

    static async migrateSettings() {
        const settingsToMigrate = ['targetDC', 'earnIncome', 'workerCost', 'buildingCost'];

        // Migrate existing settings
        for (const key of settingsToMigrate) {
            try {
                // Only try to get and migrate if the old setting exists
                if (game.settings.settings.get(`${this.OLD_MODULE_ID}.${key}`)) {
                    const oldValue = game.settings.get(this.OLD_MODULE_ID, key);
                    if (oldValue !== undefined) {
                        await game.settings.set(this.MODULE_ID, key, oldValue);
                        console.log(`Migrated ${key} setting to ${this.MODULE_ID}`);
                        
                        // Remove the old setting
                        await game.settings.settings.delete(`${this.OLD_MODULE_ID}.${key}`);
                        console.log(`Removed old setting ${key} from ${this.OLD_MODULE_ID}`);
                    }
                }
            } catch (error) {
                console.warn(`Failed to process setting ${key}:`, error);
            }
        }
    }
}

export class BusinessSettingsMenu extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'business-settings',
            title: 'Business Settings',
            template: 'modules/pf2e-business/templates/settings-window.html',
            width: window.innerWidth >= 1126 ? 1126 : 900,
            height: 'auto',
            closeOnSubmit: true,
            submitOnChange: false,
            submitOnClose: true,
            resizable: true
        });
    }

    getData(options) {
        return {
            targetDC: game.settings.get(BusinessSettings.MODULE_ID, 'targetDC'),
            earnIncome: game.settings.get(BusinessSettings.MODULE_ID, 'earnIncome'),
            workerCost: game.settings.get(BusinessSettings.MODULE_ID, 'workerCost'),
            buildingCost: game.settings.get(BusinessSettings.MODULE_ID, 'buildingCost'),
            workerChecks: game.settings.get(BusinessSettings.MODULE_ID, 'workerChecks')
        };
    }

    async _updateObject(event, formData) {
        const parsedData = {
            targetDC: this._parseForm(formData, 'targetDC-'),
            earnIncome: this._parseForm(formData, 'earnIncome-'),
            workerCost: this._parseForm(formData, 'workerCost-'),
            buildingCost: this._parseForm(formData, 'buildingCost-'),
            workerChecks: {
                workerLimit: formData['workerChecks.workerLimit'] || false,
                proficiencyLimit: formData['workerChecks.proficiencyLimit'] || false
            }
        };

        for (const [key, value] of Object.entries(parsedData)) {
            await game.settings.set(BusinessSettings.MODULE_ID, key, value);
        }

        ui.notifications.info('Settings saved successfully.');
    }

    _parseForm(formData, stringToParse) {
        const result = {};
        for (const key in formData) {
            if (key.startsWith(stringToParse)) {
                const level = key.replace(stringToParse, '');
                result[level] = formData[key];
            }
        }
        return result;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('#reset-defaults').click(() => this._resetToDefaults());
    }

    async _resetToDefaults() {
        const confirmed = await Dialog.confirm({
            title: 'Reset to Defaults',
            content: 'Are you sure you want to reset settings to their default values?',
            yes: () => true,
            no: () => false,
            defaultYes: false
        });

        if (!confirmed) return;

        await Promise.all([
            game.settings.set(BusinessSettings.MODULE_ID, 'targetDC', BusinessSettings.DEFAULT_TARGET_DC_CONFIG),
            game.settings.set(BusinessSettings.MODULE_ID, 'earnIncome', BusinessSettings.DEFAULT_EARN_INCOME_CONFIG),
            game.settings.set(BusinessSettings.MODULE_ID, 'workerCost', BusinessSettings.DEFAULT_WORKER_COST_CONFIG),
            game.settings.set(BusinessSettings.MODULE_ID, 'buildingCost', BusinessSettings.DEFAULT_BUILDING_COST_CONFIG),
            game.settings.set(BusinessSettings.MODULE_ID, 'workerChecks', {
                workerLimit: true,
                proficiencyLimit: true
            })
        ]);

        ui.notifications.info('Settings reset to default values.');
        this.render(true);
    }
}