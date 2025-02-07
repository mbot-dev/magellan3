import { useState, useEffect } from "react";
import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import { requestRefreshAndAccessToken, sendLoginLink } from "../../io/issIO";
import connectionManager from "../../io/connectionManager";
import { signIn } from "../../io/userIO";
import LoginDialog from "./LoginDialog";
import LoginWaiting from "./LoginWaiting";
import withDisplayNull from "../../aux/withDisplayNull";

const STAGE_SILENT = 0;
const STAGE_DIALOG = 1;
const STAGE_WAITING = 2;

const Login = () => {
  const [{ copyRight, isOnline, appStatus, loginName, bearerToken }, dispatch] =
    useStateValue();
  const [stage, setStage] = useState(STAGE_SILENT);

  useEffect(() => {
    if (!isOnline || appStatus === "login") {
      return;
    }
    // Local storage に保存された username を取得
    const username = window.localStorage.getItem("username");
    if (!username) {
      setStage(STAGE_DIALOG);
      return;
    }
    // Try silent login
    silentLogin(username);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, appStatus]);

  // メールでログインをクリック
  // メールのリンククリックを待ち受ける（画面表示
  // Pusher からアクセストークンが通知される
  // Silent login する
  useEffect(() => {
    // Pusher sets the bearerToken
    if (!loginName || !bearerToken) {
      return;
    }
    setStage(STAGE_SILENT);
    silentLogin(loginName);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginName, bearerToken]);

  // Silent login
  // 1. Request refresh and access token
  // 2. Save access token to connectionManager
  // 3. Sign in with new access token
  // 5. Save user to local storage
  // 6. Start access token timer
  // 7. Set appStatus=login
  const silentLogin = (userName) => {
    const asyncRefresh = async (username) => {
      try {
        // Refresh Token を更新、新しい Access Token を取得する
        // Refresh Toiken は cokkie に保存されている HttpOnly なので Javascript からは取得できない
        // 新しい Access Token を connectionMgr に保存する
        const newAccessToken = await requestRefreshAndAccessToken({
          sub: username,
        });
        connectionManager.setToken(newAccessToken);

        // 新しい Access Token でログインする
        const user = await signIn({ username: username });
        user.currFc = user.facilities[0].id; // uuid
        // User 設定を通知する
        if (user?.settings) {
          dispatch({
            type: "setUserSettings",
            settings: user.settings.settings,
          });
        }
        // User を local storage に保存する
        window.localStorage.setItem("username", username);
        // AppStatus を login に設定する
        dispatch({ type: "setLogin", user: user });
        // Start access token timer
        dispatch({ type: "startAccessTokenTimer", start: true });
        // Routing to /patient
        dispatch({ type: "setPath", path: "/home" });

        if (window?.electron) {
          const res = await window.electron.storeLoginData(
            user.currFc,
            newAccessToken,
          );
          console.log(res);
        } else {
          console.log("electron not found");
        }
      } catch (err) {
        // Move to login dialog silently
        console.log(err);
        setStage(STAGE_DIALOG);
      }
    };
    asyncRefresh(userName).catch((err) => console.log(err));
  };

  // LoginDialog でメールでログインが選択されたときのコールバック
  // ログインリンクの送信を依頼する
  const handleSendLink = (email) => {
    const ayncSend = async (mail) => {
      try {
        const res = await sendLoginLink({ sub: mail });
        // auth server response
        const { username, channel } = res;
        // Listen to the pusher channel
        dispatch({
          type: "setLoginName",
          username: username,
          channel: channel,
        });
        // Show waiting dialog
        setStage(STAGE_WAITING);
      } catch (err) {
        dispatch({ type: "setError", error: err });
        setStage(STAGE_DIALOG);
      }
    };
    ayncSend(email);
  };

  // Cancel Waiting
  const handleCancelWating = () => {
    setStage(STAGE_DIALOG);
  };

  // Resend
  const handleResend = () => {
    setStage(STAGE_DIALOG);
  };

  // LoginDialogfでSignupボタン押下 -> signup 画面に遷移
  const handleSignUp = () => {
    setStage(STAGE_SILENT);
    dispatch({ type: "setPath", path: "/signup" });
  };

  return (
    <Wrapper>
      {stage === STAGE_DIALOG && (
        <LoginDialog
          onSendLink={handleSendLink}
          onSignup={handleSignUp}
          copyRight={copyRight}
        />
      )}
      {stage === STAGE_WAITING && (
        <LoginWaiting
          loginName={loginName}
          onCancel={handleCancelWating}
          onResend={handleResend}
        />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100% !important;
  height: 100% !important;
`;

const EnhancedLogin = withDisplayNull(Login);
export default EnhancedLogin;
