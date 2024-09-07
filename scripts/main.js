// main.js

const business = new BusinessModule();
const businessManager = new BusinessManager();

// Default configuration object for targetDC
const DEFAULT_TARGET_DC_CONFIG = {
  0: 14, 1: 16, 2: 18, 3: 20, 4: 23, 5: 25, 6: 28, 7: 30, 8: 32, 9: 35,
  10: 37, 11: 39, 12: 42, 13: 44, 14: 46, 15: 49, 16: 21, 17: 53, 18: 56, 19: 58, 20: 60
};

// Default configuration object for earnIncome
const DEFAULT_EARN_INCOME_CONFIG = {
  0: 4, 1: 14, 2: 21, 3: 35, 4: 56, 5: 70, 6: 140, 7: 175, 8: 210, 9: 280,
  10: 420, 11: 560, 12: 700, 13: 1050, 14: 1400, 15: 1960, 16: 2800, 17: 3850, 18: 4900, 19: 9100, 20: 14000
};

// Default configuration object for workerCost
const DEFAULT_WORKER_COST_CONFIG = {
  0: 7, 1: 14, 2: 35, 3: 105, 4: 350
};

// Default configuration object for buildingCost
const DEFAULT_BUILDING_COST_CONFIG = {
  0: 1000, 1: 3000, 2: 20000, 3: 60000, 4: 150000
};


Hooks.once("init", () => {
  console.log("Business Module Initialized");
  const business = new BusinessModule();


  // Retrieve and merge each setting individually
  // let mergedTargetDC = mergeObject(DEFAULT_TARGET_DC_CONFIG, game.settings.get('business', 'targetDC'));
  // let mergedEarnIncome = mergeObject(DEFAULT_EARN_INCOME_CONFIG, game.settings.get('business', 'earnIncome'));
  // let mergedWorkerCost = mergeObject(DEFAULT_WORKER_COST_CONFIG, game.settings.get('business', 'workerCost'));
  // let mergedBuildingCost = mergeObject(DEFAULT_BUILDING_COST_CONFIG, game.settings.get('business', 'buildingCost'));

  // Register module settings for targetDC
  game.settings.register('business', 'targetDC', {
    name: 'Target DC Configuration',
    hint: 'Configuration for target DC',
    scope: 'world', // Adjust as needed
    config: false,
    default: DEFAULT_TARGET_DC_CONFIG
  });

  // Register module settings for earnIncome
  game.settings.register('business', 'earnIncome', {
    name: 'Earn Income Configuration',
    hint: 'Configuration for earning income',
    scope: 'world', // Adjust as needed
    config: false,
    type: Object,
    default: DEFAULT_EARN_INCOME_CONFIG
  });

  // Register module settings for workerCost
  game.settings.register('business', 'workerCost', {
    name: 'Worker Cost Configuration',
    hint: 'Configuration for worker cost',
    scope: 'world', // Adjust as needed
    config: false,
    default: DEFAULT_WORKER_COST_CONFIG
  });

  // Register module settings for buildingCost
  game.settings.register('business', 'buildingCost', {
    name: 'Building Cost Configuration',
    hint: 'Configuration for building cost',
    scope: 'world', // Adjust as needed
    config: false,
    default: DEFAULT_BUILDING_COST_CONFIG
  });

});

Hooks.on("renderActorDirectory", (app, html, data) => {
  const createButton = $(
    `<button class="create-business-button" title="Create Business">Business</button>`
  );

  createButton.click(() => {
    business.show();
  });

  //business.show();
  html.find(".directory-footer").append(createButton);
});


// Register the settings window
Hooks.on('ready', () => {
  game.settings.registerMenu('business', 'BusinessSettingsMenu', {
    name: 'Business Settings',
    label: 'Business Settings',
    icon: 'fas fa-cogs',
    type: BusinessSettings,
    restricted: false
  });
});



class BusinessSettings extends FormApplication {
  static get defaultOptions() {

    const defaultWidth = window.innerWidth >= 1126 ? 1126 : 900;

    return mergeObject(super.defaultOptions, {
      id: 'business-settings',
      title: 'Business Settings',
      template: 'modules/business/settings-window.html', // Adjust the path to your HTML template
      width: defaultWidth,
      height: 'auto',
      closeOnSubmit: true,
      submitOnChange: false,
      submitOnClose: true,
      resizable: true, // Allow window to be resized
    });
  }

  getData(options) {
    // Retrieve the current configuration settings
    let targetDC = game.settings.get('business', 'targetDC');
    let earnIncome = game.settings.get('business', 'earnIncome');
    let workerCost = game.settings.get('business', 'workerCost');
    let buildingCost = game.settings.get('business', 'buildingCost');


    return {
      targetDC,
      earnIncome,
      workerCost,
      buildingCost
    };
  }

  // Parse form data for targetDC settings
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

  async _resetToDefaults() {
    const confirmed = await Dialog.confirm({
      title: 'Reset to Defaults',
      content: 'Are you sure you want to reset settings to their default values?',
      yes: () => true,
      no: () => false,
      defaultYes: false
  });

  if (!confirmed) return;


    // Save default values to game settings
    const promises = [
      game.settings.set('business', 'targetDC', DEFAULT_TARGET_DC_CONFIG),
      game.settings.set('business', 'earnIncome', DEFAULT_EARN_INCOME_CONFIG),
      game.settings.set('business', 'workerCost', DEFAULT_WORKER_COST_CONFIG),
      game.settings.set('business', 'buildingCost', DEFAULT_BUILDING_COST_CONFIG)
    ];

    await Promise.all(promises);

    // Optionally, display a confirmation message
    ui.notifications.info('Settings reset to default values.');

    // Reload the form with default values
    this.render(true, {
      targetDC: DEFAULT_TARGET_DC_CONFIG,
      earnIncome: DEFAULT_EARN_INCOME_CONFIG,
      workerCost: DEFAULT_WORKER_COST_CONFIG,
      buildingCost: DEFAULT_BUILDING_COST_CONFIG
    });

  }

  async _updateObject(event, formData) {
    // Handle form submission here

    const parsedData = {
      targetDC: this._parseForm(formData, 'targetDC-'),
      earnIncome: this._parseForm(formData, 'earnIncome-'),
      workerCost: this._parseForm(formData, 'workerCost-'),
      buildingCost: this._parseForm(formData, 'buildingCost-')
    };

    // After processing the data, you may want to save it to game settings
    // For example:
    game.settings.set('business', 'targetDC', parsedData.targetDC);
    game.settings.set('business', 'earnIncome', parsedData.earnIncome);
    game.settings.set('business', 'workerCost', parsedData.workerCost);
    game.settings.set('business', 'buildingCost', parsedData.buildingCost);

    // Optionally, you can also display a confirmation message to the user
    ui.notifications.info('Settings saved successfully.');
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Additional listeners for dynamic behavior
    html.find('#reset-defaults').click(() => {
      this._resetToDefaults();
    });
  }
}