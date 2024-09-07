class BusinessManager {
    openDialogs = {}

    async openDialog(id) {

        if (this.openDialogs[id]) {
            if(this.openDialogs[id]._minimized)
                this.openDialogs[id].maximize();
            return;
        }

        let business = game.actors.get(id);
        const template_data = { business: business };
        const template = await getTemplate('modules/business/scripts/manageSheet.hbs');
        const rendered_html = template(template_data, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });


        let d = new Dialog({
            title: "Business Management",
            content: rendered_html,
            buttons: {},
            close: () => { 
                Hooks.off("updateActor", d.hook);
                delete this.openDialogs[id];
            },
            render: () => {
                $("#roll-business").click(() => {
                    // Handle rolling business action
                    console.log("Rolling business...");
                });


                addListenerToDragActor(business);
            },
        });

        d.submit = () => { };
        d.render(true, { resizable: true, width: 640, height: game.user.isGM ? 675 : 600 });
        d.hook = Hooks.on("updateActor", (actor, data, options, userId) => {
            if (actor.id === id ) {
                refreshBonusHTML(id)
            }
          });

        this.openDialogs[id] = d;
    }
}


function addListenerToDragActor(business) {
    const dropZone = document.getElementById('drop-zone');

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        const actorDataString = event.dataTransfer.getData('text/plain');
        const actorData = JSON.parse(actorDataString);
        const actorUuid = actorData.uuid.split('.')[1];
        console.log(`Dropped actor ID: ${actorUuid}`);
        updateOwnerId(business.id, actorUuid);
    });
}

function updateName(newName, businessID) {
    const b = game.actors.get(businessID);
    if (newName !== b.name) {
        b.update({
            name: newName,
        }).catch(() =>
            refreshBonusHTML(businessID))
    }
}

async function updateLevel(newLevel, businessID) {
    const b = game.actors.get(businessID);
    if (newLevel !== b.level) {

        const lvl = Math.min(Math.max(parseInt(newLevel, 10), 0), 20);
        await b.update({
            'system.details.level.value': lvl,
        }).catch(() =>
            refreshBonusHTML(businessID))

    }
}

function updateGoldInvested(newGoldInvested, businessID) {
    const b = game.actors.get(businessID);
    if (newGoldInvested !== b.flags.business.goldInvested) {
        try {
            const gold = parseInt(newGoldInvested);
            b.update({ 'flags.business.goldInvested': gold }).catch(() =>
                refreshBonusHTML(businessID));
        }
        catch (e) {

        }
    }
}

async function addWorker(businessID) {
    const b = game.actors.get(businessID);

    const newWorker = {
        name: 'New Worker',
        proficiency: 0,
        isLeader: false
    };

    const workersList = foundry.utils.duplicate(b.flags.business.workers);
    workersList.push(newWorker);

    await b.update({ 'flags.business.workers': workersList }).catch(() =>
        refreshBonusHTML(businessID))
}

async function removeWorker(businessID, index) {
    const b = game.actors.get(businessID);
    const workers = foundry.utils.duplicate(b.flags.business.workers);

    if (index >= 0 && index < workers.length) {
        workers.splice(index, 1);
        await b.update({ 'flags.business.workers': workers }).catch(() =>
            refreshBonusHTML(businessID));
    }
}

function decreaseInvestment(businessID) {
    const b = game.actors.get(businessID);
    const newInvestmentLevel = Math.max(0, b.flags.business.investmentLevel - 1);
    b.update({ 'flags.business.investmentLevel': newInvestmentLevel }).catch(() =>
        refreshBonusHTML(businessID));
    //document.getElementById('investmentTag').innerHTML = Handlebars.helpers.investmentLabel(newInvestmentLevel);
}

function increaseInvestment(businessID) {
    const b = game.actors.get(businessID);
    const newInvestmentLevel = Math.min(4, b.flags.business.investmentLevel + 1);
    b.update({ 'flags.business.investmentLevel': newInvestmentLevel }).catch(() =>
        refreshBonusHTML(businessID));
    //document.getElementById('investmentTag').innerHTML = Handlebars.helpers.investmentLabel(newInvestmentLevel);
}

function updateWorkerName(newName, businessID, index) {
    const b = game.actors.get(businessID);
    const workers = foundry.utils.duplicate(b.flags.business.workers);
    if (newName !== workers[index].name) {
        workers[index].name = newName;
        b.update({ 'flags.business.workers': workers }).catch(()=>{
            refreshBonusHTML(businessID)
        })
    }
}

function updateWorkerProficiency(newProficiency, businessID, index) {
    const b = game.actors.get(businessID);
    const workers = foundry.utils.duplicate(b.flags.business.workers);
    if (newProficiency !== workers[index].proficiency) {
        const prof = parseInt(newProficiency);
        workers[index].proficiency = prof;
        b.update({ 'flags.business.workers': workers }).catch(() =>
            refreshBonusHTML(businessID))
    }
}

function updateLeader(businessID, index) {
    console.log(businessID + " " + index)

    const b = game.actors.get(businessID);
    console.log(b)
    const workersList = foundry.utils.duplicate(b.flags.business.workers);
    for (i in workersList) {
        console.log(workersList[i])
        console.log(i + " " + index)
        if (i == index) {
            console.log("XD")
            workersList[i].isLeader = true;
        }
        else {
            workersList[i].isLeader = false;
        }
    }
    b.update({ 'flags.business.workers': workersList }).finally(() =>
        refreshBonusHTML(businessID))
}

function updateCircumstanceBonus(businessID, event){
    const newValue = event.target.value;
    const b = game.actors.get(businessID);
    b.update({ 'flags.business.businessMods.mod1': newValue }).catch(() =>
        refreshBonusHTML(businessID))
}

function updateGMNotes(event, businessID) {
    const newValue = event.target.value;
    const b = game.actors.get(businessID);
    b.update({ 'flags.business.gmNotes': newValue }).catch(() =>
        refreshBonusHTML(businessID))
}

function refreshBonusHTML(businessID) {
    const b = game.actors.get(businessID);
    document.getElementById('businessSize').innerHTML = Handlebars.helpers.investmentLabel(b.flags.business.investmentLevel);
    document.getElementById('mod-workers').value = Handlebars.helpers.proficiencyBonus(b.flags.business.workers);
    document.getElementById('mod-reputation').value = Handlebars.helpers.getOwnerLevel(b.flags.business.ownerID);
    document.getElementById('mod-situation').value = b.flags.business.businessMods.mod1;
    document.getElementById('target-dc').value = Handlebars.helpers.getTargetDC(b.level);
    document.getElementById('expected-salary').value = Handlebars.helpers.getExpectedSalaryFormatted(b.level);
    document.getElementById('max-workers').value = Handlebars.helpers.getMaxWorkers(b.flags.business.investmentLevel);
    document.getElementById('workers-cost').value = Handlebars.helpers.getWorkersCost(businessID);
    document.getElementById('goldInvestment').value = Handlebars.helpers.formatGold(b.flags.business.goldInvested);
    document.getElementById('businessLevel').value = b.level;

    document.getElementById('workerList').innerHTML = Handlebars.compile('{{> workersTemplate}}')({ business: b }, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });
    document.getElementById('drag-actor').innerHTML = Handlebars.compile('{{> dragActor}}')({ business: b }, { allowProtoMethodsByDefault: true, allowProtoPropertiesByDefault: true });
    
    document.getElementById('businessName').value = `${b.name}`;
    document.getElementById('businessImg').src = `${b.img}`

    addListenerToDragActor(b)

    const element = document.getElementById('gmNotes');
    if (element)
        element.innerHTML = b.flags.business.gmNotes;
}

async function rollForBusiness(businessID) {
    // Define the default formula
    const b = game.actors.get(businessID);
    //const investmentMod = Handlebars.helpers.investmentBonus(b.flags.business.investmentLevel);
    const proficiencyMod = Handlebars.helpers.proficiencyBonus(b.flags.business.workers);
    const situationMod = b.flags.business.businessMods.mod1;
    const reputationMod = Handlebars.helpers.getOwnerLevel(b.flags.business.ownerID);

    const targetDC = Handlebars.helpers.getTargetDC(b.level);

    const defaultFormula = '1d20 + ' + proficiencyMod + ' + ' + reputationMod + ' + ' + situationMod;


    // Create a new Dialog object
    const dialog = new Dialog({
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
                callback: async (html) => {
                    // Get the formula from the dialog
                    const formula = html.find('#formula')[0].value;

                    // Create a new Roll object
                    const roll = new Roll(formula);

                    // Roll the dice
                    await roll.roll();

                    // Get the HTML representation of the roll
                    const rollHTML = await roll.render();

                    const SuccessDegreeEnum = {
                        CRITICAL_SUCCESS: 'Critical Success',
                        SUCCESS: 'Success',
                        FAILURE: 'Failure',
                        CRITICAL_FAILURE: 'Critical Failure'
                    };

                    const successDegree = ((rollResult, targetDC) => {
                        if (rollResult >= targetDC + 10) {
                            return SuccessDegreeEnum.CRITICAL_SUCCESS;
                        } else if (rollResult >= targetDC) {
                            return SuccessDegreeEnum.SUCCESS;
                        } else if (rollResult + 10 <= targetDC) {
                            return SuccessDegreeEnum.CRITICAL_FAILURE
                        } else if (rollResult < targetDC) {
                            return SuccessDegreeEnum.FAILURE;
                        }
                    })(roll.total, targetDC);
                    console.log(successDegree)

                    const successDegreeText = ((successDegree) => {
                        switch (successDegree) {
                            case SuccessDegreeEnum.CRITICAL_SUCCESS:
                                return `<span style="color: #008000;">Critical Success`;
                            case SuccessDegreeEnum.SUCCESS:
                                return `<span style="color: #0000ff;">Success`;
                            case SuccessDegreeEnum.FAILURE:
                                return `<span style="color: #ff4500;">Failure`
                            case SuccessDegreeEnum.CRITICAL_FAILURE:
                                return `<span style="color: #ff0000;">Critical Failure`;
                            default:
                                return;
                        }
                    })(successDegree)

                    let newLevel = b.level;
                    if (successDegree === SuccessDegreeEnum.CRITICAL_SUCCESS ||
                        successDegree === SuccessDegreeEnum.SUCCESS) {
                        newLevel++;
                    } else if (successDegree === SuccessDegreeEnum.CRITICAL_FAILURE) {
                        newLevel--;
                    }

                    newLevel = Math.min(Math.max(parseInt(newLevel, 10), 0), 20);
                    let earnIncome = Handlebars.helpers.getExpectedSalary(newLevel);
                    if (successDegree === SuccessDegreeEnum.CRITICAL_SUCCESS) {
                        earnIncome = earnIncome * 1.2;
                        console.log(earnIncome)
                    }

                    const goldElementID = `addGoldButton${Date.now()}`;
                    const payWorkersID = `payWorkersButton${Date.now()}`;
                    const updateLevelID = `updateLevelButton${Date.now()}`;

                    // Construct the update level button if not a failure
                    let updateLevelButton = '';
                    if (successDegree !== SuccessDegreeEnum.FAILURE) {
                        updateLevelButton = `<button type="button" id="${updateLevelID}">Update Level (Mod: ${newLevel - b.level})</button>`;
                    }

                    // Post the result to the chat
                    const rollMessage = await roll.toMessage({
                        speaker: {
                            "scene": null,
                            "actor": null,
                            "token": null,
                            "alias": b.name
                        },
                        flavor: `Rolling ${formula}...`,
                        content: `
                            <strong>Investment:</strong> ${Handlebars.helpers.investmentLabel(b.flags.business.investmentLevel)}<br>
                            <strong>Workers Proficiency:</strong> ${proficiencyMod}<br>
                            <strong>Owner Reputation:</strong> ${reputationMod}<br>
                            <strong>Situational Bonus:</strong> ${situationMod}<br>
                            <br>
                            <strong>Result</strong> ${successDegreeText} (DC: ${targetDC}, Roll: ${roll.total}) </span><br>
                            <strong>New Business Level:</strong> ${newLevel}<br>
                            <strong>Income this week:</strong> ${formatGold(earnIncome)}<br>
                            <br>
                            ${rollHTML}

                            <button type="button" id="${goldElementID}")">Add Gold</button>
                            <button type="button" id="${payWorkersID}")">Pay Workers</button>
                            ${updateLevelButton}
                        `
                    });

                    const hooked = (app, html, messageData) =>{
                        html.find(`#${goldElementID}`).click(async () => {
                            const oldTreasury = parseInt(b.flags.business.goldInvested);
                            const treasury = oldTreasury + earnIncome;
                            updateGoldInvested(treasury, businessID);
                            const msg = game.messages.get(messageData.message._id)
                            await msg.update({
                                content: msg.content.replace(`<button type="button" id="${goldElementID}">Add Gold</button>`, `<button type="button" id="${goldElementID}" class="b-disabled-button">Added Gold</button>`),
                                "flags": {
                                    "buttonVisible": false,
                                    "type": 0
                                }
                            });
                            ChatMessage.create({
                                speaker: ChatMessage.getSpeaker({ actor: b }),
                                content: `<strong>${b.name}:</strong> Added ${formatGold(earnIncome)} gold to the treasury.`
                            });
                        });

                        html.find(`#${payWorkersID}`).click(async () => {
                            const oldTreasury = parseInt(b.flags.business.goldInvested);
                            let paymentOK = true;
                            if(getWorkersCostRaw(businessID) > oldTreasury){
                                paymentOK = false;
                            }
                            let treasury = oldTreasury - getWorkersCostRaw(businessID);
                            treasury = Math.max(1, treasury);
                            updateGoldInvested(treasury, businessID);
                            const msg = game.messages.get(messageData.message._id)
                            await msg.update({
                                content: msg.content.replace(`<button type="button" id="${payWorkersID}">Pay Workers</button>`, `<button type="button" id="${payWorkersID}" class="b-disabled-button">Pay Workers</button>`),
                                "flags": {
                                    "buttonVisible": false,
                                    "type": 0
                                }
                            });
                            let newMsg = ""
                            if(paymentOK)
                                newMsg = `<strong>${b.name}:</strong> Removed ${formatGold(getWorkersCostRaw(businessID))} gold from the treasury to pay the workers.`
                            else
                                newMsg = `<strong>${b.name}:</strong> Removed ${formatGold(getWorkersCostRaw(businessID) - oldTreasury)} gold from the treasury to pay the workers. <strong><br>
                                <strong style="color: #ff4500;">Not enough gold to pay workers! ${formatGold(getWorkersCostRaw(businessID) -(getWorkersCostRaw(businessID) - oldTreasury))} left to complete payment</strong>`

                            ChatMessage.create({
                                speaker: ChatMessage.getSpeaker({ actor: b }),
                                content: newMsg
                            });
                        });

                        if (successDegree !== SuccessDegreeEnum.FAILURE) {
                            html.find(`#${updateLevelID}`).click(async () => {
                                const msg = game.messages.get(messageData.message._id)
                                const nL = newLevel;
                                const bL = b.level;
                                updateLevel(newLevel, businessID);
                                await msg.update({
                                    content: msg.content.replace(`<button type="button" id="${updateLevelID}">Update Level (Mod: ${nL - bL})</button>`, `<button type="button" id="${updateLevelID}" class="b-disabled-button">Update Level (Mod: ${nL - bL})</button>`),
                                    "flags": {
                                        "buttonVisible": false,
                                        "type": 0
                                    }
                                });
                                ChatMessage.create({
                                    speaker: ChatMessage.getSpeaker({ actor: b }),
                                    content: `<strong>${b.name}:</strong> Business level updated to ${nL}.`
                                });
                            });
                        }
                    }

                    // Attach the event listener after the chat message is rendered
                    Hooks.on('renderChatMessage', (app, html, messageData) => {
                        if(messageData.message._id === rollMessage._id)
                            hooked(app, html, messageData);
                    });
                }
            }
        },
        default: 'roll',
        close: () => console.log('Dialog closed')
    });

    // Render the dialog
    dialog.render(true);
}

function updateOwnerId(businessID, ownerID) {
    console.log(businessID)
    const b = game.actors.get(businessID);
    b.update({ 'flags.business.ownerID': ownerID || null }).then(() =>
        refreshBonusHTML(businessID))
    console.log(b)
}


function formatGold(amount) {
    const gp = Math.floor(amount / 10);
    const sp = amount % 10;
    let formattedGold = '';
    if (gp > 0) {
        formattedGold += `${gp} gp`;
    }
    if (sp > 0) {
        if (formattedGold !== '') {
            formattedGold += ' ';
        }
        formattedGold += `${sp} sp`;
    }

    return formattedGold;
}

async function addGold(businessID) {
    let goldInputValue = '';
    let silverInputValue = '';

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

    const confirmed = await Dialog.confirm({
        title: 'Save Earnings In Treasury',
        content: dialogContent,
        yes: () => {
            // Get the values of the input fields
            goldInputValue = parseInt(document.getElementById('goldInput').value || 0);
            silverInputValue = parseInt(document.getElementById('silverInput').value || 0);

            const b = game.actors.get(businessID);
            const oldTreasury = parseInt(b.flags.business.goldInvested)
            const treasury = oldTreasury + ((goldInputValue * 10) + silverInputValue)
            updateGoldInvested(treasury, businessID)
        },
        no: () => false,
        defaultYes: false
    });
}

async function clearTreasury(businessID) {
    const confirmed = await Dialog.confirm({
        title: 'Empty Treasury',
        content: 'Are you sure you want to empty your treasury?',
        yes: () => {
            updateGoldInvested(0, businessID)
            return true;
        },
        no: () => false,
        defaultYes: false
    });
}

function getWorkersCostRaw(businessID) {
    const workersCost = game.settings.get('business', 'workerCost');
    const b = game.actors.get(businessID);
    const workersList = b.flags.business.workers;
    let totalCost = 0;
    for (let worker of workersList) {
        totalCost += workersCost[worker.proficiency];
    }
    return totalCost;
}


Handlebars.registerHelper('investmentLabel', function (level) {
    const labels = {
        0: { label: 'Cart', color: '#424242' },
        1: { label: 'Small', color: '#171f69' },
        2: { label: 'Medium', color: '#3c005e' },
        3: { label: 'Large', color: '#664400' },
        4: { label: 'Huge', color: '#5e0000' }
    };

    const label = labels[level] || labels[0];

    return new Handlebars.SafeString(`<span style="color: ${label.color};">${label.label}</span>`);

});

Handlebars.registerHelper('investmentBonus', function (investmentLevel) {
    const investmentMod = [-2, 0, 1, 2, 3, 4, 5];
    return investmentMod[investmentLevel];
});

Handlebars.registerHelper('proficiencyText', function (proficiency) {
    switch (proficiency) {
        case 0: return 'Untrained';
        case 1: return 'Trained';
        case 2: return 'Expert';
        case 3: return 'Master';
        case 4: return 'Legendary';
        default: return 'Untrained';
    }
});

Handlebars.registerHelper('proficiencyColor', function (proficiency) {
    switch (proficiency) {
        case 0: return 'font-weight: 600; color: #424242';
        case 1: return 'font-weight: 600; color: #171f69';
        case 2: return 'font-weight: 600; color: #3c005e';
        case 3: return 'font-weight: 600; color: #664400';
        case 4: return 'font-weight: 600; color: #5e0000';
        default: return 'font-weight: 600; color: #424242';
    }
});

Handlebars.registerHelper('selectedProficiency', function (option, value) {
    if (option === value) {
        return ' selected';
    } else {
        return ''
    }
});

Handlebars.registerHelper('proficiencyBonus', function (workers) {
    const proficiencyMod = [0, 2, 4, 6, 8];
    let bonus = 0
    for (i in workers) {
        bonus += proficiencyMod[workers[i].proficiency]
    }
    return bonus;
});

Handlebars.registerHelper('getActorName', function (actorId) {
    const actor = game.actors.get(actorId);
    if (!actor) return '';
    return `${actor.name} - Level ${actor.level}`;
});

Handlebars.registerHelper('getOwnerLevel', function (actorId) {
    const actor = game.actors.get(actorId);
    if (!actor) return 0;
    return actor.level;
});

Handlebars.registerHelper('getTargetDC', function (level) {
    const targetDC = game.settings.get('business', 'targetDC')[level]
    return targetDC;
});

Handlebars.registerHelper('formatGold', function (amount) {
    return formatGold(amount);
});

Handlebars.registerHelper('getExpectedSalary', function (level) {
    const earnIncome = game.settings.get('business', 'earnIncome')[level]
    return earnIncome;
});

Handlebars.registerHelper('getExpectedSalaryFormatted', function (level) {
    const earnIncome = game.settings.get('business', 'earnIncome')[level]
    return formatGold(earnIncome);
});

Handlebars.registerHelper('getMaxWorkers', function (investmentLevel) {
    return investmentLevel;
});

Handlebars.registerHelper('getWorkersCost', function (businessID) {
    let totalCost = getWorkersCostRaw(businessID);
    return formatGold(totalCost);
});

Handlebars.registerHelper('checkedStatus', function (businessID, index) {
    const b = game.actors.get(businessID);
    const workersList = b.flags.business.workers;
    const isWorkerLeader = workersList[index].isLeader;
    return isWorkerLeader;
});

Handlebars.registerHelper('userIsGM', function () {
    return game.user.isGM;
});

Handlebars.registerPartial('workersTemplate', `
<div id="worker-template" for="{{business.flags.business.workers}}">
            <!-- Iterate through the workers array -->
            {{#each business.flags.business.workers}}
              <div
                class="worker-row {{#if isLeader}}leader{{/if}}"
                style="display: flex; align-items: center; margin-bottom: 5px;"
              >
              <div class="b-checkbox-container" id="myCheckboxContainer_{{@index}}">
                <input type="checkbox" class="b-hidden-check" 
                    id="myCheckbox_{{@index}}"
                    onclick="updateLeader('{{@root.business.id}}', {{@index}})"
                    {{#if (checkedStatus @root.business.id @index)}}
                        checked
                    {{/if}}
                    >
                <label for="myCheckbox_{{@index}}">
                    <i class="fas fa-crown b-unchecked-icon"></i>
                    <i class="fas fa-crown b-checked-icon"></i>
                </label>
            </div>
                <input
                  class="b-input"
                  type="text"
                  id="workerName"
                  value="{{name}}"
                  style="flex: 1; margin-right: 10px;"
                  oninput="updateWorkerName(this.value, '{{@root.business.id}}', {{@index}})"
                />
                <select
                  class="b-input"
                  style="{{proficiencyColor proficiency}}"
                  id="workerProficiency"
                  ="{{proficiency}}"
                  onchange="updateWorkerProficiency(this.value, '{{@root.business.id}}', {{@index}})"
                >
                  <option value="0" style="color: #000000" {{selectedProficiency 0 proficiency}}>{{proficiencyText 0}}</option>
                  <option value="1" style="color: #000000" {{selectedProficiency 1 proficiency}}>{{proficiencyText 1}}</option>
                  <option value="2" style="color: #000000" {{selectedProficiency 2 proficiency}}>{{proficiencyText 2}}</option>
                  <option value="3" style="color: #000000" {{selectedProficiency 3 proficiency}}>{{proficiencyText 3}}</option>
                  <option value="4" style="color: #000000" {{selectedProficiency 4 proficiency}}>{{proficiencyText 4}}</option>                </select>
                <button
                  onclick="removeWorker('{{@root.business.id}}', {{@index}})"
                  style="width: 30px;"
                >
                    <i class="fas fa-times"></i>
                </button>
              </div>
            {{/each}}
          </div>
`);

Handlebars.registerPartial('dragActor', `
    <div id="drop-zone" style="border: 1px solid #ccc; padding: 10px; margin: 10px 10px 10px 0;">
        {{#if business.flags.business.ownerID}}
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">{{getActorName business.flags.business.ownerID}}</div>
                <button onclick="updateOwnerId('{{business.id}}')" style="width: 30px; margin: -10px"><i class="fas fa-trash"></i></button>
            </div>
        {{else}}
            Drop an actor here to set the owner of the business
        {{/if}}
    </div>
`)
