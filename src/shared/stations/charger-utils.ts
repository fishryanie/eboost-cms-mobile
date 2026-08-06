import { getWorkflowChargerType } from 'app/location/[id]/features/charger-workflows';

export function getChargerSelectionKey(charger: WorkflowChargerRecord) {
  return `${getWorkflowChargerType(charger)}-${charger.id}`;
}
