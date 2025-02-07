import { useState } from 'react';
import styled from "styled-components";
import { getValue } from "../../aux/FormUtil";
import { isValidateEmail } from '../../util/strings';
import { GridItem, rowAt } from '../../aux/commonStyles';
import Buttons from '../../cmp/Buttons';

const SignUpDialog = ({ onSendLink, onCancel }) => {
    const [email, setEmail] = useState('');

    const handleEmailChange = e => {
        setEmail(getValue(e));
    };

    const handleSubmit = e => {
        e.preventDefault();
        onSendLink(email);
    };

    const handleCancel = () => {
        onCancel();
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
                            <div className="z3-flex-column" style={{'--gap': '8px'}}>
                                <span>マーガレットは、アカウント（ユーザーID）に電子メールアドレスを使用します。</span>
                                <span>ご使用される電子メールアドレスを入力し、「送信」ボタンをクリックしてください。</span>
                                <span>受信したメールを開くと、アカウント作成を行うことができます。</span>
                            </div>
                        </GridItem>
                        <GridItem grid={rowAt(2, 1)}>
                            <div className="z3-flex-column" style={{'--gap': '4px'}}>
                                <div>
                                    <span>{TEXT_EMAIL_ADDRESS}</span><span style={{ fontSize: '14px' }}>（登録後にいつでも変更できます）</span>
                                </div>
                                <input
                                    className='w3-input w3-border w3-round'
                                    type='email'
                                    autoFocus={true}
                                    placeholder=''
                                    value={email}
                                    onChange={handleEmailChange}
                                />
                            </div>
                        </GridItem>
                    </Contents>
                    <Footer>
                        <Buttons
                            onCancel={handleCancel}
                            okText={TEXT_SEND_MAIL}
                            okEnabled={isValidateEmail(email)}
                            onSubmit={true}
                        />
                    </Footer>
                </Inner>
            </form>
        </Wrapper>
    );
};

const Wrapper = styled.div`
    width: var(--w, 480px) !important;
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

const TEXT_TITLE = 'アカウント作成';
const TEXT_SEND_MAIL = 'メール送信';
const TEXT_EMAIL_ADDRESS = '電子メールアドレス';

export default SignUpDialog;
