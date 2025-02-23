import { BusinessModule } from './business.js';
import { registerHelpers, registerGlobals } from './helpers.js';
import { registerTemplatePartials } from './template-partials.js';
import { BusinessSettings, BusinessSettingsMenu } from './business-settings.js';

registerGlobals()



Hooks.once("init", () => {
  console.log('Business Module | Initializing');
  registerHelpers();
  registerTemplatePartials();
  BusinessSettings.registerSettings();

});

Hooks.once('ready', async () => {
  await BusinessSettings.migrateSettings();
  
  game.settings.registerMenu(BusinessSettings.MODULE_ID, 'BusinessSettingsMenu', {
      name: 'Business Settings',
      label: 'Business Settings',
      icon: 'fas fa-cogs',
      type: BusinessSettingsMenu,
      restricted: false
  });
});

Hooks.on("renderActorDirectory", (app, html, data) => {
  const createButton = $(
    `<button class="create-business-button" title="Create Business">Business</button>`
  );

  createButton.click(() => {
    BusinessModule.getInstance().show();
  });

  //business.show();
  html.find(".directory-footer").append(createButton);
});