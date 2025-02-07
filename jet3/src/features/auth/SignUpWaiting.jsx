import styled from "styled-components";
import Buttons from "../../cmp/Buttons";

const SignUpWaiting = ({ loginName, onCancel, onResend }) => {

    const handleCancel = () => {
        onCancel();
    };

    const handleResend = () => {
        onResend();
    };

    return (
        <Wrapper>
            <Inner>
                <Header>
                    <Title>{TEXT_CONFIRM_MAIL}</Title>
                </Header>
                <Contents>
                    <div className="z3-flex-column" style={{'--gap': '8px'}}>
                        <span>{loginName}に電子メールを送信しました。受信したメールを開きアカウントを作成をしてください。</span>
                        <span>有効期間が設定されています。それを過ぎると再送信が必要です。</span>
                        <span>メールが届きませんか？ 電子メールアドレスを確認し、再送信してください。</span>
                    </div>
                </Contents>
                <Footer>
                    <Buttons
                        cancelText={TEXT_CANCEL_REGISTRATION}
                        onCancel={handleCancel}
                        optionText={TEXT_RESEND}
                        optionEnabled={true}
                        onOption={handleResend}
                    />
                </Footer>
            </Inner>
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

const TEXT_CONFIRM_MAIL = 'メール確認';
const TEXT_CANCEL_REGISTRATION = 'アカウント作成キャンセル';
const TEXT_RESEND = '再送信';

export default SignUpWaiting;
