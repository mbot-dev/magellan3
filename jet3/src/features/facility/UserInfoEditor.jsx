import { useState } from "react";
import ModalEditorLarge from "../../cmp/ModalEditorLarge";
import UserEditor from "./UserEditor";
import { ENTITY_SPEC_USER } from "./userSpec";
import { CHANGE_TEXT } from "../../aux/FormUtil";

const UserInfoEditor = ({ userToEit, onSubmit, onCancel }) => {
  const [submitCnt, setSumbitCnt] = useState(0);
  const [isDirty, setDirty] = useState(false);

  const handleDirty = (dirty) => {
    setDirty(dirty);
  };

  const handleSubmit = () => {
    setSumbitCnt(submitCnt + 1);
  };

  const handleCancel = () => {
    onCancel();
  };

  // UserEditor submit -> here with new attrs
  const handleEditEnd = (newAttrs) => {
    onSubmit(newAttrs);
  };

  return (
    <ModalEditorLarge
      id="user_info_editor"
      title="ユーザー編集"
      okText={CHANGE_TEXT}
      okEnabled={isDirty}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      width="828px"
    >
      <UserEditor
        spec={ENTITY_SPEC_USER}
        userToEdit={userToEit}
        onDirty={handleDirty}
        submit={submitCnt}
        onSubmit={handleEditEnd}
      />
    </ModalEditorLarge>
  );
};

export default UserInfoEditor;

