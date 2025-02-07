import {produce} from 'immer';

export const initialKarteState = {
    karteShape: null,

    diagnosis_list: [],
    continuedDisease: [],

    allergy_list: [],
    infection_list: [],
    past_history_list: [],
    family_history_list: [],
    vaccination_list: [],
    blood_type_list: [],
    life_style_list: [],
    childhood_list: [],
    riskToEdit: [],
    riskSubmitted: [],
    
    documentList: []
};

export const karteReducer = produce((draft, action) => {
    const { type, payload } = action;
    const entity = payload?.entity;
    let targetList = null;

    switch (type) {
        case 'setKarteShape':
            draft.karteShape = payload;
            break;
        case 'setRiskList':
            if (entity === 'continued') {
                draft.continuedDisease = [...payload.list];
                break;
            }
            draft[`${entity}_list`] = [...payload.list];
            break;
        case 'setRiskToEdit':
            if (payload === null) {
                draft.riskToEdit = null;
            } else {
                draft.riskToEdit = {
                    entity,
                };
            }
            break;
        case 'submitRisk':
            draft.riskSubmitted = {
                entity,
                risk: payload.risk,
            };
            break;
        case 'upcertRisk': {
            targetList = draft[`${entity}_list`];
            const index = targetList.findIndex(r => r.id === payload.risk.id);
            if (index === -1) {
                targetList.push(payload.risk);
            } else {
                targetList.splice(index, 1, payload.risk);
            }
            break;
        }
        case 'deleteRisk': {
            targetList = draft[`${entity}_list`];
            const idx = targetList.findIndex(r => r.id === payload.pk);
            targetList.splice(idx, 1);
            break;
        }
        default:
            break;
    }
});
