import { useState, useEffect } from 'react';
import { v4 } from 'uuid';
import { useStateValue } from "../../../reducers/state";
import { useEscKey } from "../../../hook/useEscKey";
import ModalEditorLarge from '../../../cmp/ModalEditorLarge';
import styled from 'styled-components';

const CELL_SIZE = 128;
const NUM_COLS = 4;
const NUM_ROWS = 3;
const OFFSET = 16;
const WINDOW_WIDTH = NUM_COLS * CELL_SIZE + (NUM_COLS - 1) * OFFSET * 2 + 64;
const WINDOW_HEIGHT = CELL_SIZE * NUM_ROWS + (NUM_ROWS - 1) * OFFSET * 2 + 48;
const SVG_HEIGHT = 2048;

const SchemaPanel = () => {
    const dispatch = useStateValue()[1];
    const [images, setImages] = useState([]);
    const [schemaToEdit, setSchemaToEdit] = useState(null);
    const [selection, setSelection] = useState(null);

    useEscKey(() => {
        handleCancel();
    });

    useEffect(() => {
        const handleDefaultRead = () => {
            const p = [];
            listSchema().forEach(f => p.push(readImageData(f)));
            Promise.all(p).then(arr => {
                setImages(arr);
            });
        };
        handleDefaultRead();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const listSchema = () => {
        const arr = [];
        const host = ''; // process.env.PUBLIC_URL;
        for (let i = 1; i < 58; i++) {
            const num = i < 10 ? `0${i}` : `${i}`;
            const f = `${host}/schema/img${num}.JPG`;
            arr.push(f);
        }
        return arr;
    };

    const readImageData = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            const imageBlob = await response.blob();
            return await readAsDataURL(imageBlob);
        } catch (err) {
            console.log(err);
            return null;
        }
    };

    const readAsDataURL = file => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = function () {
                return resolve(fileReader.result);
            };
            fileReader.readAsDataURL(file);
        });
    };

    const handleClickSchema = index => {
        const image = images[index];
        setSchemaToEdit(image);
        setSelection(index);
    };

    const handleCancel = () => {
        dispatch({ type: 'closeSchemaPanel' });
    };

    const handleSubmit = () => {
        dispatch({ type: 'setSchemaToEdit', target: schemaToEdit });
        handleCancel();
    };

    return (
        <ModalEditorLarge
            id='schema_panel2'
            title={TEXT_TITLE}
            justify='center'
            onCancel={handleCancel}
            okText={TEXT_EDIT}
            okEnabled={schemaToEdit !== null}
            onSubmit={handleSubmit}
            width={`${WINDOW_WIDTH}px`}
        >
            <div style={{ width: '100%', height: `${WINDOW_HEIGHT}px`, overflowY: 'scroll', display: 'flex', justifyContent: 'center' }}>
                <svg style={{ width: '100%', height: `${SVG_HEIGHT}px`, overflow: 'scroll' }}>
                    {
                        images.map((entry, index) => {
                            const row = Math.floor(index / NUM_COLS);
                            const column = index % NUM_COLS;
                            const x = column * (CELL_SIZE + OFFSET) + OFFSET;
                            const y = row * (CELL_SIZE + OFFSET);
                            return (
                                <Image
                                    key={v4()}
                                    x={x}
                                    y={y}
                                    width={`${CELL_SIZE}px`}
                                    height={`${CELL_SIZE}px`}
                                    href={entry}
                                    onClick={() => handleClickSchema(index)}
                                    selected={selection === index}
                                />
                            );
                        })
                    }
                </svg>
            </div>
        </ModalEditorLarge>
    );
};

const Image = styled.image`
    outline: ${({ selected }) => selected ? `2px solid 'var(--on-secondary)'` : null} !important;
`;

const TEXT_TITLE = 'シェーマリスト';
const TEXT_EDIT = '編集';

export default SchemaPanel;
