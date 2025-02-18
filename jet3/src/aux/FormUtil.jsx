export const getValue = (e) => {
  return e.target.value || "";
};

export const isEnter = (e) => {
  return e.key === "Enter";
};

export const isEscape = (e) => {
  return e.key === "Escape";
};

export const getSelectedRow = (e) => {
  // e.currentTarget = the cell clicked
  return Number(e.target.parentNode.getAttribute("data-item"));
};

export const handleKeyDown = (e) => {
  if (isEnter(e)) {
    e.preventDefault();
    e.target.blur(); // Enter で focus を外す
  }
};

export const handleInputFocus = (e) => {
  e.target.select();
};

export const OK_TEXT = navigator.userAgent.indexOf("Mac") >= 0 ? "OK" : "了解";
export const CANCEL_TEXT =
  navigator.userAgent.indexOf("Mac") >= 0 ? "キャンセル" : "取消し";
export const CODE_TEXT = "コード";
export const NAME_TEXT = "名称";
export const DELETE_TEXT = "削除";
export const SAVE_TEXT = "保存";
export const CHANGE_TEXT = "変更";
export const DONE_TEXT = "終了";
export const ADD_TEXT = "追加";
export const CLEAR_TEXT = "クリア";
export const REVERT_TEXT = "元に戻す";
export const DISCARD_TEXT = "破棄";
export const SEND_TEXT = "送信";
export const CREATE_TEXT = "作成";
export const COPY_TEXT = "コピー";
export const EDIT_TEXT = "編集";
export const PASTE_TEXT = "ペースト";
export const DOWNLOAD_TEXT = "ダウンロード";
export const THUMBNAIL_TEXT = "サムネイル";
export const MODIFY = "修正";
export const INVITE_MEETING = "招待";
export const REGISTER_TEXT = "登録";
export const OPTION_TEXT = "オプション";
export const QUANTITY_TEXT = "数量";
export const TOTAL_QUANTITY_TEXT = "全数量";
export const UNIT_TEXT = "単位";
export const DISPLAY_TEXT = "カルテ表示";
export const CLOSE_TEXT = "閉じる";
export const CANCEL_SHORT_TEXT = "取消";
export const UNDOBABLE_TEXT = "この操作は取り消しできませません。";
export const UNLOCK_TEXT = "ロック解除";
export const LOCK_TEXT = "ロック";