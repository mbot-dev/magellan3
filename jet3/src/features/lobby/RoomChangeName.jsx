import { useState, useEffect } from "react";
import styled from "styled-components";
import withDisplayNull from "../../aux/withDisplayNull";
import { useStateValue } from "../../reducers/state";
import { sendChangeUsernameLink } from "../../io/issIO";
import { getValue } from "../../aux/FormUtil";
import { isValidateEmail } from "../../util/strings";
import Buttons from "../../cmp/Buttons";

const WaitingTap = ({ username, step, onCancel }) => {
    const handleCancel = () => {
        onCancel();
    };
    return (
        <SystemContent>
            <div className='w3-panel w3-card w3-round'>
                <div className='w3-panel' style={{ borderRadius: '4px 4px 0 0' }}>
                    <h4>メール確認</h4>
                </div>
                <div className='w3-panel'>
                    <p>{username}に、メールを送信しました。メールを開き表示されたリンクをタップしてください。</p>
                    <p>タップするとこの画面は自動的に閉じ、{step === '1' ? '新しいメールアドレスの入力画面に進みます。' : 'メールアドレスを変更します。'}</p>
                    <p>メールが届きませんか？ この変更処理を中止し、最初からやり直してください。</p>
                </div>
                <div className='w3-panel'>
                    <div className='z3-flex' style={{'--align': 'center'}}>
                        <button
                            className='w3-button w3-round w3-light-grey'
                            onClick={handleCancel}
                        >変更を中止
                        </button>
                    </div>
                </div>
                <div className='w3-panel' />
            </div>
        </SystemContent>
    );
};

const NewUserIdInput = ({ onSubmit, onCancel }) => {
    const [email, setEmail] = useState('');

    const handleEmail = e => {
        setEmail(getValue(e));
    };

    const handleSubmit = e => {
        e.preventDefault();
        onSubmit(email);
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <SystemContent>
            <div className='w3-panel w3-card w3-round'>
                <form onSubmit={handleSubmit}>
                    <div className='w3-panel' style={{ borderRadius: '4px 4px 0 0' }}>
                        <h4>電子メールアドレス変更</h4>
                    </div>
                    <div className='w3-panel'>
                        <label style={{ paddingLeft: '7px' }}>新しいメールアドレス:</label>
                        <input
                            className='w3-input'
                            type='text'
                            name='email'
                            placeholder=''
                            value={email}
                            onChange={handleEmail}
                        />
                    </div>
                    <div className='w3-panel'>
                        <div className='z3-flex' style={{'--gap': '8px', '--justify': 'flex-end'}}>
                            <Buttons
                                onCancel={handleCancel}
                                okText='新しいアドレスへメール送信'
                                okEnabled={isValidateEmail(email)}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                    <div className='w3-panel' />
                </form>
            </div>
        </SystemContent>
    );
};

// send current userId(phyId) mail
// show waiting tap
// received pusher event from server -> dispatch(pusherEven) in Reachability
// show input new userId form
// send new userId mail
// show waiting tap
// received pusher event from server -> dispatch(pusherEven) in Reachability
// save new account, logout, restart
const RoomChangeName = () => {
    const [{ user, pusherEvent }, dispatch] = useStateValue();
    const [showWaitingTap1, setShowWaitingTap1] = useState(false);
    const [showNewUsernameInput, setShowNewUsernameInput] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [showWaitingTap2, setShowWaitingTap2] = useState(false);

    useEffect(() => {
        if (!user) {
            return;
        }
        const asyncPOst = async (payload) => {
            try {
                await sendChangeUsernameLink(payload);
                setShowWaitingTap1(!showWaitingTap1);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        const payload = {
            sub: user.username,
            step: '1'
        };
        asyncPOst(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (!newUsername) {
            return;
        }
        const asyncPost = async (payload) => {
            try {
                await sendChangeUsernameLink(payload);
                setShowNewUsernameInput(!showNewUsernameInput);
                setShowWaitingTap2(!showWaitingTap2);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        const payload = {
            sub: user.username,
            new_sub: newUsername,
            step: '2'
        };
        asyncPost(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newUsername]);

    useEffect(() => {
        if (!pusherEvent) {
            return;
        }
        if (pusherEvent === 'step1') {
            setShowWaitingTap1(!showWaitingTap1);
            setShowNewUsernameInput(!showNewUsernameInput);

        } else if (pusherEvent === 'step2') {
            setShowWaitingTap2(!showWaitingTap2);
            window.localStorage.setItem('username', newUsername);
            dispatch({ type: 'updatePhysician', attributes: {username: newUsername}});
        }
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pusherEvent]);

    // New Account へメール送信依頼
    const handleNewAccount = email => {
        setNewUsername(email);
    };

    const handleCancel = () => {
        if (showWaitingTap1) {
            setShowWaitingTap1(false);
        }
        if (showNewUsernameInput) {
            setShowNewUsernameInput(false);
        }
        if (showWaitingTap2) {
            setShowWaitingTap2(false);
        }
        // dispatch({ type: 'setRoomIndex', index: SYSTEM_INDEX });
    };

    return (
        <RoomWrapper>
            {showWaitingTap1 &&
                <WaitingTap username={user.username} step='1' onCancel={handleCancel} />
            }
            {showNewUsernameInput &&
                <NewUserIdInput onSubmit={handleNewAccount} onCancel={handleCancel} />
            }
            {showWaitingTap2 &&
                <WaitingTap username={newUsername} step='2' onCancel={handleCancel} />
            }
        </RoomWrapper>
    );
};

// parent = LobbyWrapper
const RoomWrapper = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
`;

// parent = RoomWrapper
const SystemContent = styled.div`
    width: 384px;
    padding-top: 64px;
    margin: auto;
`;

const EnhancedRoomChangeName = withDisplayNull(RoomChangeName);
export default EnhancedRoomChangeName;
