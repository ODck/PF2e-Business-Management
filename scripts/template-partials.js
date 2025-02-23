export function registerTemplatePartials() {

  Handlebars.registerPartial('workersTemplate', `
    <div id="worker-template" for="{{business.flags.business.workers}}">
        <!-- Iterate through the workers array -->
        {{#each business.flags.business.workers}}
          <div
            class="worker-row {{#if isLeader}}leader{{/if}}"
            style="display: flex; align-items: center; margin-bottom: 5px; {{#if (isWorkerMisconfigured this @index ../business.flags.business.workers ../business.flags.business.investmentLevel)}}background-color: #fff0f0; border-left: 3px solid #ff4444;{{/if}}"
          >
          <div class="b-checkbox-container" id="myCheckboxContainer_{{@index}}">
            <input type="checkbox" class="b-hidden-check" 
                id="myCheckbox_{{@index}}"
                onclick="WorkersManager.updateLeader('{{@root.business.id}}', {{@index}})"
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
              onchange="WorkersManager.updateWorkerName(this.value, '{{@root.business.id}}', {{@index}})"
            />
            <select
              class="b-input"
              style="{{proficiencyColor proficiency}}"
              id="workerProficiency"
              value="{{proficiency}}"
              onchange="WorkersManager.updateWorkerProficiency(this.value, '{{@root.business.id}}', {{@index}})"
            >
              <option value="0" style="color: #000000" {{selectedProficiency 0 proficiency}}>{{proficiencyText 0}}</option>
              <option value="1" style="color: #000000" {{selectedProficiency 1 proficiency}}>{{proficiencyText 1}}</option>
              <option value="2" style="color: #000000" {{selectedProficiency 2 proficiency}}>{{proficiencyText 2}}</option>
              <option value="3" style="color: #000000" {{selectedProficiency 3 proficiency}}>{{proficiencyText 3}}</option>
              <option value="4" style="color: #000000" {{selectedProficiency 4 proficiency}}>{{proficiencyText 4}}</option>                
            </select>
              {{#if (isWorkerMisconfigured this @index ../business.flags.business.workers ../business.flags.business.investmentLevel)}}
                  <i class="fas fa-exclamation-triangle" style="color: #ff4444; margin-left: 5px;" title="{{isWorkerMisconfigured this @index ../business.flags.business.workers ../business.flags.business.investmentLevel}}"></i>
              {{/if}}
            <button
              onclick="WorkersManager.removeWorker('{{@root.business.id}}', {{@index}})"
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
                <button onclick="BusinessUpdater.updateOwnerId('{{business.id}}')" style="width: 30px; margin: -10px"><i class="fas fa-trash"></i></button>
            </div>
        {{else}}
            Drop an actor here to set the owner of the business
        {{/if}}
    </div>
  `)
}