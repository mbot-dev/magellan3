import { useState } from 'react';
import ModalEditorLarge from '../../cmp/ModalEditorLarge';
import UserEditor from './UserEditor';
import { ADD_TEXT } from '../../aux/FormUtil';
import {ENTITY_SPEC_USER} from './userSpec';

const UserAddEditor = ({onSubmit, onCancel}) => {
    const [submitCnt, setSumbitCnt] = useState(0);
    const [isDirty, setDirty] = useState(false);

    const handleDirty = dirty => {
        setDirty(dirty);
    };

    const handleSubmit = () => {
        setSumbitCnt(submitCnt + 1);
    };

    const handleCancel = () => {
        onCancel();
    };

    // UserEditor submit -> here with new attrs
    const handleEditEnd = (newUser) => {
        onSubmit(newUser);
    };  

    return (
        <ModalEditorLarge
            id='user_add_editor'
            title='職員登録'
            okText={ADD_TEXT}
            okEnabled={isDirty}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            width="828px"
        >
            <UserEditor
                spec={ENTITY_SPEC_USER}
                onDirty={handleDirty}
                submit={submitCnt}
                onSubmit={handleEditEnd}
            />
        </ModalEditorLarge>
    );
};

export default UserAddEditor;