import {useState, useEffect, useRef} from 'react';
import {nanoid} from 'nanoid';
import axios from "axios";
import styled from "styled-components";
import {BsXCircleFill} from "react-icons/all";
import {useStateValue} from "../reducer/state";
import withDisplayBlock from './withDisplayBlock';

const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL;
const MAX_LEN = parseInt(process.env.REACT_APP_MAX_PICTURES);
const DISPLAY_WIDTH = process.env.REACT_APP_DISPLAY_WIDTH;  // 80%

const useFile = files => {
    const [sources, setSources] = useState([]);
    useEffect(() => {
        if (!files?.length) {
            setSources([]);
        }
        const arr = files.map(f => {
            return URL.createObjectURL(f);
        });
        setSources(arr);

    }, [files]);
    return sources;
};

const Capture = () => {
    const [{token}, dispatch] = useStateValue();
    const [files, setFiles] = useState([]);
    const sources = useFile(files);
    const inputRef = useRef(null);
    const [error, setError] = useState('デバッグ');

    useEffect(() => {
        if (!token) {
            return;
        }
        // setError(token.accessToken);
        handleUpload();

    }, [token]);

    const revoke = () => {
        sources.forEach(url => {
            URL.revokeObjectURL(url);
        });
    };

    // シャッター
    const handleCapture = target => {
        if (!target.files?.length) {
            return;
        }
        const [file] = target.files;
        const newFiles = [...files];
        newFiles.push(file);
        revoke();
        // sources will be updated
        setFiles(newFiles);
    };

    const handleUpload = () => {
        const data = JSON.parse(token);
        const {facilityId, channel, accessToken} = data;
        const endpoint = `${UPLOAD_URL}/${facilityId}/${channel}`;
        const config = {
            headers: {
                'Content-Type': "multipart/form-data",
                'Authorization': `Bearer ${accessToken}`
            }
        }
        const p = files.map(f => {
            const formData = new FormData();
            formData.append('file', f, f.name);  // file: fastAPI
            return axios.post(endpoint, formData, config);
        })
        Promise.all(p)
            .then(()=> {
                revoke();
                setFiles([]);
                dispatch({type: 'mode', mode: 'capture', token: null});
            })
            .catch(err=> {
                console.log(err);
                setError(err.message);
            })
    };

    // 添付（送信）ボタンタップ
    // QRCode Scan -> token -> handleUpload
    const scan = () => {
        dispatch({type: 'mode', mode: 'scan', token: null});
    };

    // 撮影ボタンタップ
    const handleStart = () => {
        if (inputRef && inputRef.current) {
            inputRef.current.click();
        }
    };

    // 削除
    const handleDelete = index => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    return (
        <CaptureBox>
            {
                sources.map((s, index) => {
                    return (
                        <ImageBox key={nanoid()}>
                            <div
                                className='w3-display-container'
                                style={{width: DISPLAY_WIDTH}}
                                >
                                <Img
                                    src={s}
                                    alt='capture'
                                />
                                <div
                                    className='w3-padding w3-display-topright'
                                    onClick={()=>handleDelete(index)}
                                    >
                                    <BsXCircleFill color='#ffffff' size='22px'/>
                                </div>
                            </div>
                        </ImageBox>
                    )
                })
            }
            <InputBox>
                <input
                    ref={inputRef}
                    className='w3-input'
                    style={{display: 'none'}}
                    accept='image/*'
                    type='file'
                    capture='environment'
                    onChange={(e) => handleCapture(e.target)}
                />
                <button
                    className='w3-button w3-large w3-padding-large w3-hover-green w3-round-large w3-black w3-border w3-border-white'
                    onClick={handleStart}
                    disabled={files.length > MAX_LEN}
                    >{files.length === 0 ? '撮 影' : '撮影 +'}
                </button>
                <button
                    className='w3-button w3-large w3-padding-large w3-hover-green w3-round-large w3-black w3-border w3-border-white'
                    onClick={scan}
                    disabled={sources.length===0}
                    >添 付
                </button>
            </InputBox>
            {error &&
                <div>
                    <p className='w3-text-white'>{error}</p>
                </div>
            }
        </CaptureBox>
    )
};

const CaptureBox = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: black;
`;

const ImageBox = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 16px;
`;

const Img = styled.img`
    width: 100%;
    height: auto;
    border-radius: 8px;
`;

const InputBox = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding-right: 10%;
    padding-left: 10%;
    margin-top: 32px;
`;

export default withDisplayBlock(Capture);
