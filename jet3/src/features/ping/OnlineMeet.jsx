import { useState } from 'react';
import dateFormat from 'dateformat';
import ModalEditorLarge from "../../cmp/ModalEditorLarge";
import { INVITE_MEETING } from "../../aux/FormUtil";
import { GridColumn12, GridItem, rowAt, LABEL_MARGIN } from '../../aux/commonStyles';

const OnlineMeet = ({ patient, onSubmit, onCancel }) => {
    const [isUsed, setUsed] = useState(false);
    const [isLight, setLight] = useState(false);

    const handleSubmit = () => {
        onSubmit();
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleSetUsed = e => {
        setUsed(e.target.checked);
    };

    const handleSetLight = e => {
        setLight(e.target.checked);
    };

    return (
        <ModalEditorLarge
            id='ping_editor'
            title='オンライン診療'
            okText={INVITE_MEETING}
            okEnabled={isUsed && isLight}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <GridColumn12 rowGap='16px'>

                <GridItem grid={rowAt(1, 1, 4)}>
                    <span>患者氏名</span>
                </GridItem>
                <GridItem grid={rowAt(1, 5, 8)}>
                    <span>{patient.fullName}</span>
                </GridItem>

                <GridItem grid={rowAt(2, 1, 4)}>
                    <span>カナ</span>
                </GridItem>
                <GridItem grid={rowAt(2, 5, 8)}>
                    <span>{patient.kana}</span>
                </GridItem>

                <GridItem grid={rowAt(3, 1, 4)}>
                    <span>性別</span>
                </GridItem>
                <GridItem grid={rowAt(3, 5, 8)}>
                    <span>{patient.gender}</span>
                </GridItem>

                <GridItem grid={rowAt(4, 1, 4)}>
                    <span>生年月日</span>
                </GridItem>
                <GridItem grid={rowAt(4, 5, 8)}>
                    <span>{`${patient.dob}（${patient.age}）`}</span>
                </GridItem>

                <GridItem grid={rowAt(5, 1, 4)}>
                    <span>メールアドレス</span>
                </GridItem>
                <GridItem grid={rowAt(5, 5, 8)}>
                    <span>{patient.email || 'kazushi.minagawa@mac.com'}</span>
                </GridItem>

                <GridItem grid={rowAt(6, 1, 4)}>
                    <span>予約時間</span>
                </GridItem>
                <GridItem grid={rowAt(6, 5, 8)}>
                    <span>{dateFormat(new Date(), 'yyyy-m-d HH:MM')}</span>
                </GridItem>

                <GridItem grid={rowAt(7, 1, 4)}>
                    <span>ヘッドセット</span>
                </GridItem>
                <GridItem grid={rowAt(7, 5, 8)}>
                    <label>
                        <input 
                            className="w3-check" 
                            type="checkbox"
                            style={LABEL_MARGIN}
                            checked={isUsed}
                            onChange={handleSetUsed}
                        />
                        つけた
                    </label>
                </GridItem>

                <GridItem grid={rowAt(8, 1, 4)}>
                    <span>照明</span>
                </GridItem>
                <GridItem grid={rowAt(8, 5, 8)}>
                    <label>
                        <input 
                            className="w3-check" 
                            type="checkbox"
                            style={LABEL_MARGIN}
                            checked={isLight}
                            onChange={handleSetLight}
                        />
                        明るい
                    </label>
                </GridItem>

            </GridColumn12>
        </ModalEditorLarge>
    );
};

export default OnlineMeet;
