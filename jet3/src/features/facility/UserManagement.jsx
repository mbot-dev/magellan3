import { useEffect, useState } from "react";
import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import { useMargaret } from "../../io/MargaretProvider";
import { currFacility } from "../../models/karteCtx";
import LobbyMessage from "../lobby/LobbyMessage";
import MoreVertClick from "../../cmp/MoreVertClick";
import SimpleAlert from "../../cmp/SimpleAlert";
import CustomSelect2 from "../../cmp/CustomSelect2";
import DaingerSelection from "../../cmp/DaingerSelection";
import UserInfoEditor from "./UserInfoEditor";
import UserAddEditor from "./UserAddEditor";
import withDisplayNull from "../../aux/withDisplayNull";
import { StickyBody, StickyColumn } from "../../aux/commonStyles";
import { LIST_SPEC_USER, OPTIONS_USER_STATUS } from "./userSpec";
import UserFunc from "./userFunc";

const successMessage = (account) => {
  return [
    `${account} さんに確認のメールを送信しました。`,
    `${account} さんがメールのボタンをクリックすると、職員として登録されます。`,
    "このダイアログは自動では閉じません。下のボタンをクリックして閉じてください。",
  ];
};

const useOwner = (user) => {
  const [isOwner, setOwner] = useState(false);
  useEffect(() => {
    if (user) {
      const fc = currFacility(user);
      setOwner(fc.owner === user.id);
    }
  }, [user]);

  return isOwner;
};

const getUsersMenu = (status) => {
  const menus = [];
  if (status === "active") {
    menus.push({ action: "updateUserInfo", name: "編集" });
    menus.push({ action: "absence", name: "休職" });
    menus.push({ action: "leaved", name: "退職" });
    menus.push({ action: "comeback", name: "復職", disabled: true });
  } else if (status === "absence") {
    menus.push({ action: "updateUserInfo", name: "編集", disabled: true });
    menus.push({ action: "absence", name: "休職", disabled: true });
    menus.push({ action: "leaved", name: "退職" });
    menus.push({ action: "comeback", name: "復職" });
  } else if (status === "leaved") {
    menus.push({ action: "updateUserInfo", name: "編集", disabled: true });
    menus.push({ action: "absence", name: "休職", disabled: true });
    menus.push({ action: "comeback", name: "復職" });
    menus.push({ action: "leaved", name: "退職", disabled: true });
  }
  return menus;
};

/* User
id: "62b62412-cead-43fb-90fe-e397dd4151c9"
createdAt: "2023-12-01T20:29:15"
updatedAt: "2023-12-01T20:29:15"
username: "kazushi.minagawa@mac.com"
fullName: "皆川 和史"
kana: "ミナガワ ナガワカズシ"
license: "doctor"
memo: ""
narcoticLicenseNum: ""
----------------------------------------
users_facility association
status: "active"  active | 休職  退職
userRole: "admin"  admin | user
*/
const UserManagement = () => {
  const margaret = useMargaret();
  const [{ user }, dispatch] = useStateValue();
  const isOwner = useOwner(user);
  const [userStatusToList, setUserStatusToList] = useState("active");
  const [users, setUsers] = useState([]);
  const [showAddUser, toggleShowAddUserDialog] = useState(false);
  const [duplicateUser, setDuplicateUser] = useState(null); // 既に登録済みのユーザー
  const [error, setError] = useState(null); // 職員登録エラー
  const [success, setSuccess] = useState(null); // 職員登録 メール送信成功
  const [userToAction, setUserToAction] = useState(null);

  useEffect(() => {
    if (!user || !userStatusToList) {
      return;
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userStatusToList]);

  const fetchUsers = () => {
    if (!user || !userStatusToList) {
      return;
    }
    const asyncGet = async () => {
      try {
        const res = await margaret.getApi("user").listUsers(currFacility(user).id, userStatusToList);
        setUsers(res);
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    asyncGet();
  };

  const handleUserActionMenu = (action, row) => {
    const target = users[row];
    setUserToAction({ user: target, action: action });
  };

  const handleCancelError = () => {
    setError(null);
  };

  const handleCancelSuccess = () => {
    setSuccess(null);
  };

  const handleUserAction = async () => {
    const facilityId = currFacility(user).id;
    const targetId = userToAction.user.id;
    const newStatus = userToAction.action;
    const data = {
      facilityId,
      userId: targetId,
      newStatus: newStatus === "comeback" ? "active" : newStatus,
    };
    try {
      await margaret.getApi("user").updateUserStatus(data);
      setUserToAction(null);
      fetchUsers();
    } catch (err) {
      dispatch({ type: "setError", error: err });
    }
  };

  const handleUpdateUserInfo = (updatedAttrs) => {
    const targetId = userToAction.user.id; // user.id;  Do not change my self!
    const isMe = targetId === user.id;
    const asyncUpdate = async () => {
      try {
        await margaret.getApi("user").updateUserInfo(targetId, updatedAttrs);
        setUserToAction(null);
        if (isMe) {
          dispatch({ type: "updateMe", me: updatedAttrs });
        }
        fetchUsers();
      } catch (err) {
        dispatch({ type: "setError", error: err });
      }
    };
    asyncUpdate();
  };

  const handleCancelUserAction = () => {
    setUserToAction(null);
  };

  const handleShowAddUserDialog = () => {
    toggleShowAddUserDialog(!showAddUser);
  };

  const handleAddNewUser = async (newUser) => {
    toggleShowAddUserDialog(!showAddUser);
    const facility = currFacility(user);
    const payload = {
      invite: {
        sub: newUser.username, // sub for auth server
        fullName: newUser.fullName,
        kana: newUser.kana,
        license: newUser.license,
        narcoticLicenseNum: newUser.narcoticLicenseNum,
        userRole: "user",
        status: "active",
      },
      user: {
        id: user.id,
        name: user.fullName,
      },
      facility: {
        id: facility.id,
        name: facility.name,
      },
    };
    try {
      await margaret.getApi("iss").sendInviteLink(payload);
      setSuccess(successMessage(newUser.fullName));
    } catch (err) {
      if (err?.status === 409) {
        setDuplicateUser({ fullName: newUser.fullName });
      } else {
        dispatch({ type: "setError", error: err });
      }
    }
  };

  const handleCancelAddUser = () => {
    toggleShowAddUserDialog(!showAddUser);
  };

  const handleAcceptDuplicateUser = () => {
    setDuplicateUser(null);
  };

  const handleUserStatusToList = (option) => {
    if (!option) {
      return;
    }
    setUserStatusToList(option.value);
  };

  const ownerTable = () => {
    return (
      <table className="w3-table w3-bordered w3-hoverable">
        <StickyColumn>
          <tr>
            {LIST_SPEC_USER.columnGetters.map((col, index) => {
              return <th key={index}>{col.label}</th>;
            })}
            {isOwner && <th style={{ textAlign: "right" }}>編集</th>}
          </tr>
        </StickyColumn>
        <StickyBody>
          {users.map((u, row) => {
            return (
              <tr key={u.id}>
                {LIST_SPEC_USER.columnGetters.map((col) => {
                  const { key, func, arg } = col;
                  const args = arg ? arg.map((a) => u[a]) : [];
                  if (func) {
                    return <td key={key}>{UserFunc[func](...args)}</td>;
                  } else {
                    return <td key={key}>{u[key]}</td>;
                  }
                })}
                <td className="w3-right-align">
                  <MoreVertClick
                    menus={getUsersMenu(userStatusToList)}
                    disabled={!isOwner}
                    sourceIndex={row}
                    onSelect={handleUserActionMenu}
                    right={true}
                  />
                </td>
              </tr>
            );
          })}
        </StickyBody>
      </table>
    );
  };

  return (
    <ContentGrid>
      <div
        className="z3-flex"
        style={{ height: "40px", "--align": "center", "--gap": "8px" }}
      >
        <span>{`${TEXT_STAFF_LIST}:`}</span>
        <CustomSelect2
          options={OPTIONS_USER_STATUS}
          labelGetter="label"
          valueGetter="value"
          selectedValue={userStatusToList}
          onSelect={handleUserStatusToList}
        />
        <div className="z3-flex-glue" />
        <button
          className="w3-button w3-round w3-border w3-padding-small"
          disabled={!isOwner}
          onClick={handleShowAddUserDialog}
        >
          {TEXT_ADD_NEW_STAFF}
        </button>
      </div>
      <div
        className="z3-calc-scroll-container"
        style={{ "--max-height": "100vh-180px", minHeight: "300px" }}
      >
        {ownerTable()}
      </div>
      {userToAction && userToAction.action === "updateUserInfo" && (
        <UserInfoEditor
          userToEit={userToAction.user}
          onSubmit={handleUpdateUserInfo}
          onCancel={handleCancelUserAction}
        />
      )}
      {userToAction && userToAction.action === "absence" && (
        <DaingerSelection
          messages={[`${userToAction.user.fullName}さんを休職にしますか？`]}
          description="復職されるまでは電子カルテにログインできません。"
          daingerText="休職"
          onDainger={handleUserAction}
          onCancel={handleCancelUserAction}
        />
      )}
      {userToAction && userToAction.action === "leaved" && (
        <DaingerSelection
          messages={[
            `${userToAction.user.fullName}さんを退職にしますか？`,
            `退職されても${userToAction.user.fullName}さんが記載された情報は残ります。`,
          ]}
          description="復職されると同じ電子メールアドレスを使用することができます。"
          daingerText="退職"
          onDainger={handleUserAction}
          onCancel={handleCancelUserAction}
        />
      )}
      {userToAction && userToAction.action === "comeback" && (
        <DaingerSelection
          messages={[`${userToAction.user.fullName}さんを復職にしますか？`]}
          description="以前と電子メールアドレスでログインすることができます。"
          daingerText="復職"
          onDainger={handleUserAction}
          onCancel={handleCancelUserAction}
        />
      )}
      {showAddUser && (
        <UserAddEditor
          onSubmit={handleAddNewUser}
          onCancel={handleCancelAddUser}
        />
      )}
      {error && (
        <LobbyMessage
          show={error ? "true" : undefined}
          title="職員登録"
          messages={error}
          onCancel={handleCancelError}
        />
      )}
      {success && (
        <LobbyMessage
          show={success ? "true" : undefined}
          title="職員登録"
          messages={success}
          onCancel={handleCancelSuccess}
        />
      )}
      {duplicateUser && (
        <SimpleAlert onCancel={handleAcceptDuplicateUser}>
          <div className="w3-panel">
            <p>{`${duplicateUser.fullName}さんは職員として登録済みです。`}</p>
            <p>休職または退職されている場合は復職の処理をしてください。</p>
            <p>
              また、異なる電子メールアドレスで新規に登録することもできます。
            </p>
          </div>
        </SimpleAlert>
      )}
    </ContentGrid>
  );
};

const ContentGrid = styled.div`
  width: 1024px;
  padding: 0 0 0 32px;
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-flow: row;
  row-gap: 16px;
  overflow-y: visible;
`;

const TEXT_STAFF_LIST = "職員リスト";
const TEXT_ADD_NEW_STAFF = "+追加";

const UserManagementWithDisplayNull = withDisplayNull(UserManagement);
export default UserManagementWithDisplayNull;
