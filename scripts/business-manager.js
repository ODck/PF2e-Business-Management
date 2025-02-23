import { BusinessRoll } from './business-roll.js';
import { refreshBonusHTML } from './utils.js';
import { DragDropManager } from './drag-drop-manager.js';


export class BusinessManager {
    static #instance = null;
    openDialogs = {};

    static getInstance() {
        if (!BusinessManager.#instance) {
            BusinessManager.#instance = new BusinessManager();
        }
        return BusinessManager.#instance;
    }

    constructor() {
        if (BusinessManager.#instance) {
            return BusinessManager.#instance;
        }
        BusinessManager.#instance = this;
    }

    async openDialog(id) {
        if (this.openDialogs[id]) {
            if(this.openDialogs[id]._minimized)
                this.openDialogs[id].maximize();
            return;
        }

        let business = game.actors.get(id);
        const template_data = { business: business };
        const template = await getTemplate('modules/pf2e-business/templates/manageSheet.hbs');
        const rendered_html = template(template_data, { 
            allowProtoMethodsByDefault: true, 
            allowProtoPropertiesByDefault: true 
        });

        let d = new Dialog({
            title: "Business Management",
            content: rendered_html,
            buttons: {},
            close: () => { 
                Hooks.off("updateActor", d.hook);
                delete this.openDialogs[id];
            },
            render: () => {
                $("#roll-business").click(() => BusinessRoll.rollForBusiness(id));
                DragDropManager.addListenerToDragActor(business);
            },
        });

        d.submit = () => { };
        d.render(true, { resizable: true, width: 640, height: game.user.isGM ? 675 : 600 });
        d.hook = Hooks.on("updateActor", (actor, data, options, userId) => {
            if (actor.id === id) {
                refreshBonusHTML(id);
            }
        });

        this.openDialogs[id] = d;
    }
}

export const businessManager = BusinessManager.getInstance();