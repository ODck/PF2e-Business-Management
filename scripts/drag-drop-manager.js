import { BusinessUpdater } from './business-updater.js';

export class DragDropManager {
    static addListenerToDragActor(business) {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        });

        dropZone.addEventListener('drop', (event) => {
            event.preventDefault();
            const actorDataString = event.dataTransfer.getData('text/plain');
            const actorData = JSON.parse(actorDataString);
            const actorUuid = actorData.uuid.split('.')[1];
            BusinessUpdater.updateOwnerId(business.id, actorUuid);
        });
    }
}