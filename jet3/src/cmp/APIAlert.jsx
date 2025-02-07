import React from "react";
import SimpleAlert from "./SimpleAlert";

const APIAlert = ({ status, onOk, width = "384px" }) => {
  const messageFrom = (status) => {
    switch (status) {
      case 401:
        return "電子メールアドレスまたはパスワードが一致しません。";
      case 403:
        return "電子メールアドレスに対応するアカウントが存在しません。";
      case 404:
        return "アカウントが存在しません。";
      case 409:
        return "アカウントは既に登録されています。";
      case 500:
        return "内部サーバーエラー（500）";
      default:
        return "予期しないエラー";
    }
  };
  return (
    <SimpleAlert onCancel={onOk} width={width}>
      <p>{messageFrom(status)}</p>
    </SimpleAlert>
  );
};

export default APIAlert;

