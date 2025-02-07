import { useEffect, useState } from 'react';
import styled from "styled-components";
import Buttons from '../../cmp/Buttons';
import DaingerSelection from '../../cmp/DaingerSelection';
import { REGISTER_TEXT } from '../../aux/FormUtil';
import AccountEntry from './AccontEntry';

const UserRegistration = ({ username, onRegister, onCancel }) => {
    const [userToEdit, setUserToEdit] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [submitCount, setSubmitCount] = useState(0);
    const [cancelRegister, setCancelRegister] = useState(false);

    useEffect(() => {
        if (!username) {
            return;
        }
        setUserToEdit({ username: username });

    }, [username]);

    const handleCancelRegister = () => {
        onCancel();
    };

    const handleDirty = (dirty) => {
        setDirty(dirty);
    };

    const handleOk = () => {
        setSubmitCount(submitCount + 1);
    };

    const handleRegister = (newAccount) => {
        onRegister(newAccount);
    };

    return (
        <Wrapper>
            <Inner>
                <Header>
                    <Title>{TEXT_TITLE}</Title>
                    <span className='w3-small'>電子メールアドレスを確認しました。次の情報を入力し、アカウント作成を完了してください（登録後に変更できます）。</span>
                </Header>
                <Contents>
                    <AccountEntry
                        mode='edit'
                        userToEdit={userToEdit}
                        onDirty={handleDirty}
                        submit={submitCount}
                        onSubmit={handleRegister}
                    />
                </Contents>
                <Footer>
                    <Buttons
                        onCancel={() => setCancelRegister(!cancelRegister)}
                        okText={REGISTER_TEXT}
                        okEnabled={dirty}
                        onOk={handleOk}
                    />
                </Footer>
            </Inner>
            {
                cancelRegister &&
                <DaingerSelection
                    daingerText='ユーザー登録をキャンセル'
                    cancelText='いいえ'
                    messages={['ユーザー登録をキャンセルしますか?']}
                    onDainger={handleCancelRegister}
                    onCancel={() => setCancelRegister(!cancelRegister)}
                />
            }
        </Wrapper>
    );
};

const Wrapper = styled.div`
    width: ${props => props.width || '900px'} !important;
    padding-top: 64px;
    margin: auto;
`;

const Inner = styled.div.attrs({
    className: 'w3-card w3-round'
})`
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
        'header'
        'content'
        'footer';
    border-top: 6px solid #9121c2;
    background-color: #fff;
`;

const Header = styled.div`
    grid-area: header;
    height: 90px !important;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    row-gap: 4px;
    padding-left: 32px;
`;

const Title = styled.h3`
    font-weight: 700;
`; 

const Contents = styled.div`
    grid-area: content;
    padding: 16px 32px 24px 32px;
    border-top: 1px solid #efefef !important;
    border-bottom: 1px solid #efefef !important;
`;

const Footer = styled.div`
    grid-area: footer;
    height: 80px !important;
    padding-right: 32px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    column-gap: 8px;
`;

const TEXT_TITLE = '基本情報登録';

export default UserRegistration;