import { useState } from 'react';
import styled from "styled-components";
import { isValidateEmail } from '../../util/strings';
import { GridItem, rowAt } from '../../aux/commonStyles';

const LoginDialog = ({ onSendLink, onSignup, copyRight }) => {
    const [email, setEmail] = useState('');

    const handleEmail = e => {
        setEmail(e.target.value);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        onSendLink(email);
    };

    const handleSignUp = () => {
        onSignup();
    };

    return (
        <Wrapper>
            <form onSubmit={handleSubmit}>
                <Inner>
                    <Header>
                        <Title>{TEXT_TITLE}</Title>
                    </Header>
                    <Contents>
                        <GridItem grid={rowAt(1, 1)}>
                            <input
                                className='w3-input w3-border w3-round'
                                type='email'
                                placeholder={TEXT_EMAIL}
                                autoFocus={true}
                                value={email}
                                onChange={handleEmail}
                            />
                        </GridItem>
                        <GridItem grid={rowAt(2, 1)}>
                            <LoginButton
                                type='submit'
                                disabled={!isValidateEmail(email)}
                            >{TEXT_LOGIN}
                            </LoginButton>
                        </GridItem>
                        <GridItem grid={rowAt(3, 1)} style={{ paddingTop: '16px' }}>
                            <div className='z3-flex' style={{'--align': 'center'}}>
                                <span style={{ fontSize: '15px' }}>{TEXT_NO_ACCOUNT}</span>
                            </div>
                        </GridItem>
                        <GridItem grid={rowAt(4, 1)}>
                            <AccountButton
                                type='button'
                                onClick={handleSignUp}
                            >
                                {TEXT_CREATE_ACCOUNT}
                            </AccountButton>
                        </GridItem>
                    </Contents>
                    <Footer>
                        <span>{copyRight}</span>
                    </Footer>
                </Inner>
            </form>
        </Wrapper>
    );
};

const Wrapper = styled.div`
    width: ${props => props.width || '480px'} !important;
    padding-top: 64px;
    margin: auto;
`;

const Inner = styled.div.attrs({
    className: 'w3-card w3-round'
})`
    dispay: grid;
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
    align-items: center;
    padding-left: 32px;
`;

const Title = styled.h3`
    font-weight: 700;
`;

const Contents = styled.div`
    grid-area: content;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    row-gap: 16px;
    padding: 24px 32px;
    border-top: 1px solid #efefef !important;
    border-bottom: 1px solid #efefef !important;
`;

const LoginButton = styled.button.attrs({
    className: 'w3-button w3-round w3-block'
})`
    background-color: var(--primary) !important;
    color: var(--on-primary) !important;
`;

const AccountButton = styled.button.attrs({
    className: 'w3-button w3-round w3-block'
})`
    color: var(--on-surface) !important;
    background-color: var(--surface) !important;
    &:hover {
        background-color: var(--primary) !important;
    }
`;

const Footer = styled.div`
    grid-area: footer;
    height: 80px !important;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.8rem !important;
    color: #666 !important;
`;

const TEXT_TITLE = 'マーガレットにログイン';
const TEXT_EMAIL = '電子メールアドレス';
const TEXT_LOGIN = 'メールでログイン';
const TEXT_CREATE_ACCOUNT = 'アカウント作成';
const TEXT_NO_ACCOUNT = 'アカウントをお持ちではありませんか？ 下のボタンをクリックし、ユーザー登録を行ってください。';

export default LoginDialog;
