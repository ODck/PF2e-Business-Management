import { businessManager } from './business-manager.js';
import { BusinessSettingsMenu } from './business-settings.js';


export class BusinessModule {
  static #instance = null;
  _activeDialog;

  static getInstance() {
    if (!BusinessModule.#instance) {
      BusinessModule.#instance = new BusinessModule();
    }
    return BusinessModule.#instance;
  }

  constructor() {
    if (BusinessModule.#instance) {
      return BusinessModule.#instance;
    }
    BusinessModule.#instance = this;
  }

  show() {
    if (this._activeDialog != null) {
      if (this._activeDialog._minimized)
        this._activeDialog.maximize();
      return;
    }
    let businesses = getAllBusinesses();
    let content = getRenderedContent(businesses);

    this._activeDialog = new Dialog({
      title: "Business Management",
      content: content,
      buttons: {},
      close: () => {
        Hooks.off("createActor", this.hookId);
        Hooks.off("deleteActor", this.hookId2);
        Hooks.off("updateActor", this.hookId3);
        this._activeDialog = null;
      },
      render: () => {
        // Add event listener for manage and delete buttons
        $(".manage-business").click((event) => {
          manageBusiness(event, businesses);
        });

        $(".delete-business").click((event) => {
          deleteBusiness(event, businesses);
        });

        $("#create-new-business").click(async () => {
          // Call function to create a new business
          await createBusiness();
        });

        $("#update-business").click(async () => {
          this.refreshDialog();
        });

        $("#open-settings").click(async () => {
          openBusinessSettings()
        });

        this._addHelpButton(this._activeDialog);

      }
    });
    this._activeDialog.render(true, { resizable: true });

    this.hookId = Hooks.on("createActor", (actor, data, options, userId) => {
      updateDialog(this._activeDialog);
    });

    this.hookId2 = Hooks.on("deleteActor", (actor, data, options, userId) => {
      updateDialog(this._activeDialog);
    });

    this.hookId3 = Hooks.on("updateActor", (actor, data, options, userId) => {
      if (actor.flags.business?.isBusiness === true) {
        // if(actor.flags.business.updatedFromSheet !== true){
        //   updateDialog(this._activeDialog);
        // }
        // actor.flags.business.updatedFromSheet = false;
        //refreshNameAndImg(actor.id)
        updateDialog(this._activeDialog);
      }
    });
  }

  refreshDialog() {
    updateDialog(this._activeDialog);
  }
  _addHelpButton(dialog) {
    const helpButton = $(`
        <a class="header-button help-button" title="Business Rules">
            <i class="fas fa-question-circle"></i>
        </a>
    `);

    helpButton.on('click', async (event) => {
      event.preventDefault();
      const pack = game.packs.get("pf2e-business.pf2e-business-rules");
      if (!pack) {
          ui.notifications.error("Business Rules compendium not found");
          return;
      }

      const index = await pack.getIndex();
      const firstEntry = index.contents[0];
      if (!firstEntry) {
          ui.notifications.error("No help document found in the compendium");
          return;
      }

      const journal = await pack.getDocument(firstEntry._id);
      journal.sheet.render(true);
    });

    dialog.element.find('.window-header .window-title').after(helpButton);
  }
}

function updateDialog(d) {
  let dialogContent = d.element.find(".dialog-content");
  let businesses = getAllBusinesses();

  let updatedContent = getRenderedContent(businesses);
  dialogContent.html(updatedContent);
  addClickButtons(dialogContent, businesses);
}

function getRenderedContent(businesses) {
  let content = `
        <div>
          <div style="display:flex;">
            <h2  style="flex: 1;">Active Businesses</h2>
            <button id="open-settings" style="margin-right: 10px; width: 40px;background:none; border: none;">      
            <i class="fas fa-cogs" style="margin-left: 10px"></i>
            </button>
            <button id="update-business" style="margin-right: 10px; width: 40px;background:none; border: none;">      
            <i class="fa-solid fa-arrows-rotate" style="margin-left: 10px"></i>
            </button>
          </div>
        <hr>
      `;

  businesses.forEach((business, index) => {
    content += `
        <div style="display: flex; align-items: center; margin: 2px 0;" name="businessList">
          <p style="flex: 1;">
            <strong>${business.name}</strong> - Level ${business.level} 
          </p>
          <button class="manage-business" data-business-index="${index}" style="margin-right: 10px; width: 75px;">Manage</button>
          <button class="delete-business" data-business-index="${index}" style="width: 25px; color: white; background: #5e0000; cursor: pointer;">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
        `;
  });

  content += `
          <div style="margin-bottom: 50px">
            <div style="position:absolute; bottom: 0px; padding-bottom: 5px; width: 95%; background: #dad8cc;">
              <hr>
              <button id="create-new-business">Create New Business</button>
            </div>
          </div>
        </div>
      `;
  return content;
}

function getAllBusinesses() {
  let folder = game.folders.getName("Business Management");
  let businesses = [];
  if (folder) {
    businesses = folder.contents
      .filter(actor => actor.flags.business?.isBusiness === true)
      .map(actor => ({
        name: actor.name,
        level: actor.level,
        id: actor.id,
      }));
  }
  return businesses;
}

function addClickButtons(dialogContent, businesses) {
  dialogContent.find(".manage-business").click((event) => {
    manageBusiness(event, businesses);
  });

  dialogContent.find(".delete-business").click((event) => {
    deleteBusiness(event, businesses);
  });

  dialogContent.find("#create-new-business").click(async () => {
    await createBusiness();
  });

  dialogContent.find("#update-business").click(async () => {
    business.refreshDialog();
  });

  dialogContent.find("#open-settings").click(async () => {
    openBusinessSettings();
  });
}


async function createBusiness() {
  console.log("Creating a new business...");
  let folder = game.folders.getName("Business Management");
  if (!folder) {
    // Create the folder if it doesn't exist
    folder = await Folder.create({
      name: "Business Management",
      type: "Actor",
      parent: null // Set the parent folder if necessary
    });
  }

  // Define custom flag data
  let businessFlag = {
    isBusiness: true,
    businessMods: {
      mod1: 0,
      mod2: 0,
      mod3: 0
    },
    ownerID: null,
    investmentLevel: 0,
    goldInvested: 0,
    gmNotes: ``,
    workers: [],
  };

  let businessData = {
    name: "New Business",
    type: "npc",
    folder: folder,
    img: "icons/environment/settlement/market-stall.webp",
    flags: {
      business: businessFlag
    }
  };
  await Actor.create(businessData);
}

function deleteBusiness(event, businesses) {
  let index = parseInt($(event.currentTarget).attr("data-business-index"));
  let businessAux = businesses[index];
  let business = game.actors.get(businessAux.id);

  // Call function to delete business with business data

  new Dialog({
    title: "Confirm Delete",
    content: "<p>Are you sure you want to delete this business?</p>",
    buttons: {
      yes: {
        icon: '<i class="fas fa-check"></i>',
        label: "Yes",
        callback: async () => {
          // Call function to delete business with business data
          await business.delete();
          console.log("Deleting business:", business);
        }
      },
      no: {
        icon: '<i class="fas fa-times"></i>',
        label: "No"
      }
    }
  }).render(true);
}

function manageBusiness(event, businesses) {
  let index = parseInt($(event.currentTarget).attr("data-business-index"));
  let business = businesses[index];
  businessManager.openDialog(business.id)
  // Call function to manage business with business data
  console.log("Managing business:", business);
}

function openBusinessSettings() {
  new BusinessSettingsMenu().render(true);
}

export const business = BusinessModule.getInstance();

//TODO stop listening hooks
//TODO resize window
//TODO pull create button bottom