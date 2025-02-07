import React, { useState, useEffect, useRef } from 'react';
import { v4 } from 'uuid';
import styled from 'styled-components';
import sanitizeHtml from "sanitize-html";
import { useStateValue } from "../../../reducers/state";
import { currFacility } from "../../../models/karteCtx";
import { getSummaryMemo, upcertSummaryMemo } from "../../../io/riskIO";
import { useRedKey } from '../../../hook/useRedKey';

const MemoEditor = ({ htmlText, onChange, onBlur }) => {
    const memo = useRef(htmlText);
    const ref = useRef(undefined);

    useRedKey(ref, () => {
        document.execCommand('foreColor', false, '#ff0000');
    });

    const handleInput = React.useCallback(evt => {
        onChange(evt.currentTarget.innerHTML);
      }, []);

    const handleBlur = () => {
        onBlur();
    };

    return (
        <EditorDiv
            ref={ref}
            contentEditable={true}
            onInput={handleInput}
            onBlur={handleBlur}
            dangerouslySetInnerHTML={{ __html: memo.current }}
        />
    );
};

const EditorDiv = styled.div`
    min-height: 64px;
    padding: 2px 2px;
    resize: none;
    outline: none;
    &:focus {
        outline: 1px solid var(--shadow-color);
    }
`;

const SummaryMemo = ({ patient }) => {
    const [{ user }, dispatch ] = useStateValue();
    const [smPayload, setSmPayload] = useState(null);
    const [memo, setMemo] = useState('');

    useEffect(() => {
        if (!user || !patient) {
            return;
        }
        const asyncGet = async (fc_id, pt_id) => {
            try {
                const result = await getSummaryMemo(fc_id, pt_id);
                if (!result?.length) {
                    setMemo('');
                    setSmPayload({
                        id: v4(),
                        facility_id: fc_id,
                        patient_id: pt_id
                    });
                } else {
                    const { content, ...rest } = result[0];  // rest=id only 
                    setMemo(content);
                    setSmPayload(rest);
                }
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        const facility_id = currFacility(user).id;
        const patient_id = patient.id;
        asyncGet(facility_id, patient_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, patient]);

    const handleChange = value => {
        setMemo(value);
    };

    const handleBlur = () => {
        const asyncPut = async payload => {
            try {
                await upcertSummaryMemo(payload);
            } catch (err) {
                dispatch({ type: 'setError', error: err });
            }
        };
        const data = sanitizeHtml(memo, {
            allowedTags: [ 'b', 'i', 'em', 'strong', 'a', 'font', 'br', 'div', 'p' ],
            allowedAttributes: {
                'a': [ 'href' ],
                'font': [ 'color' ]
            }
        });
        smPayload.content = data;
        asyncPut(smPayload);
    };

    return smPayload && (
        <Layout>
            <span>{TEXT_MEMO}</span>
            <div className='w3-border'>
                <MemoEditor
                    htmlText={memo}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />   
            </div>   
        </Layout>
    );
};

const Layout = styled.div`
    display: flex;
    flex-direction: column;
`;

const TEXT_MEMO = 'メモ';

export default SummaryMemo;