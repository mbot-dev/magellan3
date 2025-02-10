import { useState, useEffect } from "react";
import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import { useMargaret } from "../../io/MargaretProvider";
import SignUpDialog from "./SignUpDialog";
import SignUpWaiting from "./SignUpWaiting";
import UserRegistration from "./UserRegistration";
import connectionManager from "../../io/connectionManager";
import withDisplayNull from "../../aux/withDisplayNull";

const STAGE_DIALOG = 0;
const STAGE_WAITING = 1;
const STAGE_REGISTER = 2;

const SignUp = () => {
  const margaret = useMargaret();
  const [{ loginName, bearerToken }, dispatch] = useStateValue();
  const [stage, setStage] = useState(STAGE_DIALOG);

  useEffect(() => {
    // Pusher sets the bearerToken
    if (!loginName || !bearerToken) {
      return;
    }
    // ここみそ
    connectionManager.setToken(bearerToken);
    setStage(STAGE_REGISTER);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginName, bearerToken]);

  const handleSendLink = (email) => {
    const asycSend = async (mail) => {
      try {
        const res = await margaret.getApi("iss").sendSignupLink({ sub: mail });
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
        // Stay in the dialog
      }
    };
    asycSend(email);
  };

  const handleCancelSignUp = () => {
    dispatch({ type: "setPath", path: "/login" });
  };

  const handleCancelWaiting = () => {
    dispatch({ type: "setPath", path: "/login" });
  };

  const handleResend = () => {
    setStage(STAGE_DIALOG);
  };

  //------------------------------------------------------------
  // User Registration
  //------------------------------------------------------------
  const handleRegister = (payload) => {
    const asyncRegister = async (payload) => {
      try {
        // ここで登録される
        const user = await margaret.geApi("user").signUp(payload);
        user.currFc = user.facilities[0].id;
        // Save username to local storage
        const { username } = user;
        window.localStorage.setItem("username", username);
        // AppStatus を login に設定する
        dispatch({ type: "setLogin", user: user });
        // Start access token timer
        dispatch({ type: "startAccessTokenTimer", start: true });
        // Routing to /patient
        dispatch({ type: "setPath", path: "/home" });
      } catch (err) {
        dispatch({ type: "setError", error: err });
        setStage(STAGE_DIALOG);
      }
    };
    asyncRegister(payload);
  };

  const handleCancelRegister = () => {
    dispatch({ type: "setPath", path: "/login" });
  };

  return (
    <Wrapper>
      {stage === STAGE_DIALOG && (
        <SignUpDialog
          onSendLink={handleSendLink}
          onCancel={handleCancelSignUp}
        />
      )}
      {stage === STAGE_WAITING && (
        <SignUpWaiting
          loginName={loginName}
          onCancel={handleCancelWaiting}
          onResend={handleResend}
        />
      )}
      {stage === STAGE_REGISTER && (
        <UserRegistration
          username={loginName}
          onRegister={handleRegister}
          onCancel={handleCancelRegister}
        />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100% !important;
  height: 100% !important;
`;

const EnhancedSignUp = withDisplayNull(SignUp);
export default EnhancedSignUp;
