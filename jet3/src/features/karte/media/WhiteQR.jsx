import { useState, useEffect } from "react";
import { v4 } from 'uuid';
import QRCode from "qrcode";
import styled from "styled-components";
import { requestWhiteToken } from "../../../io/issIO";
import { currFacility } from "../../../models/karteCtx";
import { useEscKey } from "../../../hook/useEscKey";
import { useStateValue } from "../../../reducers/state";
import connectionManager from "../../../io/connectionManager";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";
import PusherClient from "../../lobby/pusherClient";
import claimFunc from "../../../models/claimFunc";

const TEXT_TITLE = '写真アップロード（スマートフォン撮影）';
const TEXT_ALT = 'QRコード';

const useQRCode = (user, token, channel) => {
    const dispatch = useStateValue()[1];
    const [qrCode, setQrCode] = useState(null);

    useEffect(() => {
        if (!user || !token || !channel) {
            return;
        }
        const generate = async (dataStr) => {
            try {
                const qrImage = await QRCode.toDataURL(dataStr);
                setQrCode(qrImage);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        const facilityId = currFacility(user).id;
        const data = {
            facilityId,
            channel,
            accessToken: token,
        };
        const dataStr = JSON.stringify(data);
        generate(dataStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, token, channel]);

    return qrCode;
};

const useUrlCode = () => {
    const [qrCode, setQrCode] = useState(null);  // QRCode for App Home Page

    useEffect(() => {
        const generate = async (url) => {
            try {
                const qrImage = await QRCode.toDataURL(url);
                setQrCode(qrImage);
            } catch (err) {
                console.error(err);
            }
        };
        const url = connectionManager.getOpenURL('/capture');
        generate(url);
        
    }, []);

    return qrCode;
};

const WhiteQR = ({ user, onCancel }) => {
    const dispatch = useStateValue()[1];
    const [token, setToken] = useState(null);
    const [channel, setChannel] = useState(null);
    const qrcode = useQRCode(user, token, channel);
    const openUrl = useUrlCode();
    useEscKey(onCancel);
    
    // Get access token, encode it as qrCode
    useEffect(() => {
        if (!user) {
            return;
        }
        const asyncGet = async (data) => {
            try {
                const result = await requestWhiteToken(data);
                setToken(result['accessToken']);
                setChannel(v4());
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        const data = { sub: user.username };  // email
        asyncGet(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Subscribe pusher channel to receive thmbnail data
    useEffect(() => {
        if (!dispatch || !channel) {
            return;
        }
        
        const pcl = new PusherClient();
        const evt = 'magellan:white-capture';
        pcl.subscribe(channel, evt, (data) => {
            pcl.unsubscribe(evt);
            const { thumbnail, body, filename, size, type } = data;
            const lastModified = (new Date()).getTime();
            const imageData = {
                filename,
                contentType: type,
                size,
                lastModified,
                thumbnail,
                body,
            };
            const imageItem = claimFunc['createImageItem'](imageData); // imageItem as claimItem
            const imageBundle = claimFunc['createBundle'](['refImage', imageItem]);
            dispatch({ type: imageBundle.onCreate, bundle: imageBundle }); // this cause close the dialog
            dispatch({ type: 'setImageFileToUpload', target: null }); // ??
        });

        return () => {
            pcl.unsubscribe(channel);
        };

    }, [dispatch, channel]);

    const handleCancel = () => {
        onCancel();
    };

    return (
        <ModalEditorLarge 
            id='white_qr' 
            title={TEXT_TITLE} 
            justify='center' 
            onSubmit={null} 
            onCancel={handleCancel} 
            width='512px'>
            <ul className='w3-ul'>
                <li style={ListStyle}>
                    <div style={{ display: 'flex', justifyContent: "space-between" }}>
                        <span>1.スマートフォンで右のQRコードを撮影し、表示されたURLを開いてください。</span>
                        <QRBoxSmall
                            src={openUrl}
                            alt={TEXT_ALT}
                        />
                    </div>
                </li>
                <li style={ListStyle}>2.Webアプリが起動します。撮影ボタンをタップし、被写体を撮影してください。</li>
                <li style={ListStyle}>3.撮影を終えたら、添付ボタンをタップしてください。QRスキャナが起動しますので、下のQRコードを撮影してください。</li>
                <li style={ListStyle}>4.画像が挿入されたらこのウインドウは自動的に閉じます。</li>
            </ul>
            <ImageBox>
                {
                    qrcode && openUrl ? (
                        <div className='w3-panel'>
                            <QRBox
                                src={qrcode}
                                alt={TEXT_ALT}
                            />
                        </div>
                    ) : (
                        <DotBox>...</DotBox>
                    )
                }
            </ImageBox>
        </ModalEditorLarge>
    );
};

const ListStyle = {
    borderBottom: '0'
};

const ImageBox = styled.div`
    display: flex;
    justify-content: center;
`;

const QRBoxSmall = styled.img`
    max-width: 64px;
    max-height: 64px;
    width: auto;
    height: auto;
`;

const QRBox = styled.img`
    max-width: 128px;
    max-height: 128px;
    width: auto;
    height: auto;
`;

const DotBox = styled.span`
    padding-top: 64px;
`;

export default WhiteQR;
