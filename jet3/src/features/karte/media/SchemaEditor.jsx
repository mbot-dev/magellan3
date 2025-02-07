import { useEffect, useReducer, useRef, useState } from 'react';
import styled from 'styled-components';
import { produce, enablePatches, applyPatches } from 'immer';
import { v4 } from 'uuid';
import { svgAsPngUri } from 'save-svg-as-png';
import SimpleColorPalette from "./SimpleColorPalette";
import { useStateValue } from "../../../reducers/state";
import { currFacility } from "../../../models/karteCtx";
import { upload } from "../../../io/mediaIO";
import claimFunc from "../../../models/claimFunc";
import Buttons from '../../../cmp/Buttons';
import { useEscKey } from "../../../hook/useEscKey";
import { useLockBodyScroll } from "../../../hook/useLockBodyScroll";
import { BaseButton } from '../../../aux/commonStyles';
import {UndoButton, RedoButton } from '../../../cmp/IconButtons';
import CloseButton from '../../../cmp/CloseButton';

enablePatches();

const UPLOAD_PATH = '/media/api/v1/upload/file';

const CANVAS_SIZE = 400;
const LINE = 0;
const CURVE = 1;
const RECT = 2;
const ELLIPSE = 3;
const COLOR = '#FF6900';
const DRAG = 10;
const STROKE = 3;
const OPACITY = 0.5;

const TITLE = 'シェーマエディタ';
const TEXT_LINE = '直線';
const TEXT_CURVE = '曲線';
const TEXT_RECT = '四角';
const TEXT_ELLIPSE = '楕円';
const TEXT_DRAG = '移動';
const TEXT_CLEAR = 'クリア';
const TEXT_ATTACH = '添付';

const getCornerCoordinate = points => {
    const start = points[0];
    const end = points[points.length - 1];
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
};

const getBoundingRect = points => {
    const { x1, y1, x2, y2 } = getCornerCoordinate(points);
    const startX = Math.min(x1, x2);
    const startY = Math.min(y1, y2);
    const endX = Math.max(x1, x2);
    const endY = Math.max(y1, y2);
    return { startX, startY, endX, endY };
};

const DrawingLine = ({ points, color }) => {
    const { x1, y1, x2, y2 } = getCornerCoordinate(points);
    const style = { strokeWidth: STROKE, stroke: color };
    return (
        <line x1={`${x1}`} y1={`${y1}`} x2={`${x2}`} y2={`${y2}`} style={style} />
    );
};

const DrawingPath = ({ points, color }) => {
    const style = { strokeWidth: STROKE, stroke: color };
    const pathData = "M " + points
        .map(p => {
            return `${p.x} ${p.y}`;
        })
        .join(" L ");
    return <MyPath d={pathData} style={style} />;
};

// const DrawingPolygon = ({points, color}) => {
//     const style = {fill: color, fillOpacity: OPACITY, strokeWidth: STROKE, stroke: color};
//     const polygonData = points.map((p) => {
//         return `${p.get('x')},${p.get('y')}`
//     }).join(' ');
//     return (
//         <polygon points={polygonData} style={style}/>
//     )
// };

const DrawingRect = ({ points, color }) => {
    const { x1, y1, x2, y2 } = getCornerCoordinate(points);
    const top = Math.min(y1, y2);
    const left = Math.min(x1, x2);
    const width = Math.abs(x1 - x2);
    const height = Math.abs(y1 - y2);
    const style = { fill: color, fillOpacity: OPACITY, strokeWidth: STROKE, stroke: color };
    return (
        <rect x={`${left}`} y={`${top}`} width={`${width}`} height={`${height}`} style={style} />
    );
};

const DrawingEllipse = ({ points, color }) => {
    const { x1, y1, x2, y2 } = getCornerCoordinate(points);
    const startX = Math.min(x1, x2);
    const startY = Math.min(y1, y2);
    const endX = Math.max(x1, x2);
    const endY = Math.max(y1, y2);
    const radiusX = (endX - startX) * 0.5;
    const radiusY = (endY - startY) * 0.5;
    const centerX = startX + radiusX;
    const centerY = startY + radiusY;
    const style = { fill: color, fillOpacity: OPACITY, strokeWidth: STROKE, stroke: color };
    return (
        <ellipse cx={`${centerX}`} cy={`${centerY}`} rx={`${radiusX}`} ry={`${radiusY}`} style={style} />
    );
};

const containsPoint = (points, point) => {
    const { startX, startY, endX, endY } = getBoundingRect(points);
    const x = point.x;
    const y = point.y;
    let contain = x > startX;
    contain = contain && y > startY;
    contain = contain && x < endX;
    contain = contain && y < endY;
    // return delta
    return contain ? { x: startX - x, y: startY - y } : null;
};

// const appliedDeltaLine = (points, delta) => {
//     const appliedLine = points.splice(0, points.size);
//     appliedLine.forEach((p) => {
//         p.set('x', p.get('x') + delta.x);
//         p.set('y', p.get('y') + delta.y);
//     });
//     return appliedLine;
// };

const undoableActions = ['addShape', 'clear'];
let changes = {};
let currentVersion = -1;
const noOfVersionsSupported = 20;

const initialState = {
    shapeList: [],
    dragIndex: -1,
    dragPoint: null,
    canUndo: false,
    canRedo: false,
};

const reducer = (state, action) => {
    return produce(state, draft => {

        switch (action.type) {
            case 'addShape':
                if (draft.dragIndex !== -1) {
                    // Replace
                    draft.shapeList.splice(draft.dragIndex, 1, action.shape);
                    draft.dragIndex = -1;  // trick
                } else {
                    draft.shapeList.push(action.shape);
                }
                break;
            case 'clear':
                draft.shapeList = [];
                break;
            case 'undo':
                return produce(
                    applyPatches(state, changes[currentVersion--].undo),
                    newDraft => {
                        newDraft.canUndo = changes.hasOwnProperty(currentVersion);
                        newDraft.canRedo = true;
                        newDraft.dragIndex = -1;  /* tric */
                    }
                );
            case 'redo':
                return produce(
                    applyPatches(state, changes[++currentVersion].redo),
                    newDraft => {
                        newDraft.canUndo = true;
                        newDraft.canRedo = changes.hasOwnProperty(currentVersion + 1);
                    }
                );
            case 'dragDown':
                draft.dragIndex = action.index;
                break;
            default:
                break;
        }
        if (undoableActions.indexOf(action.type) !== -1) {
            draft.canUndo = true;
            draft.canRedo = false;
        }
    },
        (patches, inversePatches) => {
            if (undoableActions.indexOf(action.type) !== -1) {
                currentVersion++;

                changes[currentVersion] = {
                    redo: patches,
                    undo: inversePatches
                };

                delete changes[currentVersion + 1];
                delete changes[currentVersion - noOfVersionsSupported];
            }
        }
    );
};

const SchemaEditor = ({ target }) => {
    const [{ user }, globalDispatch] = useStateValue();
    const [state, dispatch] = useReducer(reducer, initialState);
    // Drwaing staff
    const [canvasPos, setCanvasPos] = useState(null);
    const [tool, setTool] = useState(ELLIPSE);
    const [color, setColor] = useState(COLOR);
    const [imageDim, setImageDim] = useState(null);
    const [drawingShape, setDrawingShape] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [dragPoint, setDragPoint] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    //------------------------------------------------------
    const ref = useRef(undefined);
    const svg = useRef(undefined);
    const facility_id = useRef(currFacility(user).id);
    useLockBodyScroll();
    useEscKey(() => {
        globalDispatch({ type: 'setSchemaToEdit', target: null });
    });

    useEffect(() => {
        if (!ref?.current) {
            return;
        }
        const { top, left } = ref.current.getBoundingClientRect();
        setCanvasPos({
            top,
            left,
        });
    }, [ref]);

    useEffect(() => {
        // dataURI
        if (!target) {
            return;
        }
        const i = new Image();
        i.src = target;
        i.onload = () => {
            const { naturalWidth, naturalHeight } = i;
            let width, height, offsetX, offsetY;
            if (naturalWidth < CANVAS_SIZE && naturalHeight < CANVAS_SIZE) {
                width = naturalWidth;
                height = naturalHeight;
                offsetX = (CANVAS_SIZE - width) / 2.0;
                offsetY = (CANVAS_SIZE - height) / 2.0;
            } else if (naturalWidth >= naturalHeight) {
                const ratio = CANVAS_SIZE / naturalWidth;
                width = CANVAS_SIZE;
                height = ratio * naturalHeight;
                offsetX = 0;
                offsetY = (CANVAS_SIZE - height) / 2.0;
            } else {
                const ratio = CANVAS_SIZE / naturalHeight;
                width = ratio * naturalWidth;
                height = CANVAS_SIZE;
                offsetX = (CANVAS_SIZE - width) / 2.0;
                offsetY = 0;
            }
            const dim = { x: offsetX, y: offsetY, width: width, height: height };
            setImageDim(dim);
        };
    }, [target]);

    const relativeCoordinatesForEvent = e => {
        return {
            x: e.clientX - canvasPos.left,
            y: e.clientY - canvasPos.top
        };
    };

    const handleMouseDown = e => {
        if (e.button !== 0) {
            return;
        }
        const point = relativeCoordinatesForEvent(e);
        if (tool === DRAG) {
            state.shapeList.forEach((shape, index) => {
                if (containsPoint(shape.points, point)) {
                    dispatch({ type: 'dragDown', index: index });
                    const toDrag = state.shapeList[index];
                    const clone = JSON.parse(JSON.stringify(toDrag));
                    clone.key = v4();
                    setDrawingShape(clone);
                    setIsDragging(true);
                    setDragPoint(point);
                }
            });
        } else {
            // Create drawingShape
            const shape = {
                key: v4(),
                color: color,
                tool: tool,
                points: [point]
            };
            setDrawingShape(shape);
            setIsDrawing(true);
        }
    };

    const handleMouseMove = e => {
        const point = relativeCoordinatesForEvent(e);
        if (isDragging) {
            const delta = {
                x: point.x - dragPoint.x,
                y: point.y - dragPoint.y,
            };
            drawingShape.points.forEach(p => {
                p.x = p.x + delta.x;
                p.y = p.y + delta.y;
            });
            // Update the drag point
            setDragPoint(point);

        } else if (isDrawing) {
            const newShape = { ...drawingShape };
            newShape.points.push(point);
            setDrawingShape(newShape);
        }
    };

    const handleMouseUp = () => {
        dispatch({ type: 'addShape', shape: drawingShape });
        setDrawingShape(null);
        setIsDragging(false);
        setIsDrawing(false);
    };

    const handleClickLine = () => {
        setTool(LINE);
    };

    const handleClickCurve = () => {
        setTool(CURVE);
    };

    const handleClickRect = () => {
        setTool(RECT);
    };

    const handleClickEllipse = () => {
        setTool(ELLIPSE);
    };

    const handleClickDrag = () => {
        setTool(DRAG);
    };

    const handleClickColor = c => {
        setColor(c);
    };

    const handleClickUndo = () => {
        dispatch({ type: 'undo' });
    };

    const handleClickRedo = () => {
        dispatch({ type: 'redo' });
    };

    const handleClickClear = () => {
        dispatch({ type: 'clear' });
    };

    const handleAccept = () => {
        const { x, y, width, height } = imageDim;
        const option = {
            top: y,
            left: x,
            width: width,
            height: height
            // scale: PNG_SIZE / CANVAS_SIZE
        };
        svgAsPngUri(svg.current, option).then(async dataURI => {
            const res = await fetch(dataURI);
            const blob = await res.blob();
            const formData = new FormData();
            formData.append('file', blob, 'schema.png');
            const path = `${UPLOAD_PATH}/${facility_id.current}`;
            await upload(path, formData)
                .then(result => {
                    const { thumbnail, body, filename } = result;
                    const lastModified = (new Date()).getMilliseconds();
                    const schemaData = {
                        filename,
                        contentType: blob.type,
                        size: blob.size,
                        lastModified,
                        thumbnail,
                        body,
                    };
                    const schemaItem = claimFunc['createSchemaItem'](schemaData);
                    const imageBundle = claimFunc['createBundle'](['schema', schemaItem]);
                    globalDispatch({ type: imageBundle.onCreate, bundle: imageBundle });

                }).catch(err => {
                    console.log(err);  // ToDo Alert
                }).finally(() => {
                    globalDispatch({ type: 'setSchemaToEdit', target: null });
                });
        });
    };

    const handleCancel = () => {
        globalDispatch({ type: 'setSchemaToEdit', target: null });
    };

    const renderSvg = shape => {
        if (!shape?.key) {
            return null;
        }
        const { key, tool, color, points } = shape;

        if (tool === LINE) {
            return <DrawingLine key={key} points={points} color={color} />;
        }
        if (tool === CURVE) {
            return <DrawingPath key={key} points={points} color={color} />;
        }
        if (tool === RECT) {
            return <DrawingRect key={key} points={points} color={color} />;
        }
        if (tool === ELLIPSE) {
            return <DrawingEllipse key={key} points={points} color={color} />;
        }
        return null;
    };

    return (
        <Modal width='432px'>
            <ModalContent width='432px'>
                <Header>
                    <span>{TITLE}</span>
                    <FlexGrow />
                    <CloseButton onClick={handleCancel}/>
                </Header>
                <Layout>
                    <ShapePanel>
                        <ToolButton
                            onClick={handleClickLine}
                            selected={tool === LINE}
                            color={color}
                        >{TEXT_LINE}
                        </ToolButton>
                        <ToolButton
                            onClick={handleClickCurve}
                            selected={tool === CURVE}
                            color={color}
                        >{TEXT_CURVE}
                        </ToolButton>
                        <ToolButton
                            onClick={handleClickRect}
                            selected={tool === RECT}
                            color={color}
                        >{TEXT_RECT}
                        </ToolButton>
                        <ToolButton
                            onClick={handleClickEllipse}
                            selected={tool === ELLIPSE}
                            color={color}
                        >{TEXT_ELLIPSE}
                        </ToolButton>
                        <ToolButton
                            onClick={handleClickDrag}
                            selected={tool === DRAG}
                            color={color}
                        >{TEXT_DRAG}
                        </ToolButton>
                        <UndoButton
                            onClick={handleClickUndo}
                            disabled={!state.canUndo}
                            padding='small'
                        />
                        <RedoButton
                            onClick={handleClickRedo}
                            disabled={!state.canRedo}
                            padding='small'
                        />
                        <ToolButton
                            onClick={handleClickClear}
                            disabled={state.shapeList.length === 0}
                            color={color}
                        >{TEXT_CLEAR}
                        </ToolButton>
                    </ShapePanel>

                    <SimpleColorPalette onPicked={handleClickColor} />

                    <SchemaCanvas
                        ref={ref}
                        tool={tool}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        <SvgArea ref={svg}>
                            {
                                target && imageDim &&
                                <image
                                    x={imageDim.x}
                                    y={imageDim.y}
                                    width={imageDim.width}
                                    height={imageDim.height}
                                    href={target}
                                />
                            }
                            {
                                target && imageDim &&
                                <rect
                                    x={imageDim.x}
                                    y={imageDim.y}
                                    width={imageDim.width}
                                    height={imageDim.height}
                                    stroke="gray"
                                    strokeWidth="1"
                                    fill="none"
                                />
                            }
                            {
                                state.shapeList.filter((x, idx) => idx !== state.dragIndex).map(shape => {
                                    return renderSvg(shape);
                                })
                            }
                            {
                                drawingShape && (
                                    renderSvg(drawingShape)
                                )
                            }
                        </SvgArea>
                    </SchemaCanvas>
                </Layout>

                <div className='z3-flex' style={{ height: '80px', paddingRight: '32px', '--justify': 'flex-end', '--align': 'center', 'gap': '8px'}}>
                    <Buttons
                        justify='end'
                        onCancel={handleCancel}
                        okText={TEXT_ATTACH}
                        okEnabled={state.shapeList.length}
                        onOk={handleAccept}
                    />
                </div>


            </ModalContent>
        </Modal>
    );
};

const Modal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    padding-top: 64px;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 16;
`;

const ModalContent = styled.div`
    position: relative;
    margin: auto;
    padding: 0;
    width: ${props => props.width};
    background-color: var(--background);
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    border-radius: 4px;
`;

const Header = styled.div`
    height: 48px !important;
    padding: 0 16px 0 32px !important;
    background-color: var(--background) !important;
    color: var(--on-background) !important;
    border-radius: 4px 4px 0 0;
    display: flex;
    align-items: center;
`;

const FlexGrow = styled.div`
    flex-grow: 1;
`;

const Layout = styled.div`
    padding-top: 8px;
    padding-bottom: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 4px;
    border-top: 1px solid #efefef;
    border-bottom: 1px solid #efefef;
`;

const ShapePanel = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const SchemaCanvas = styled.div`
    width: 400px !important;
    height: 400px !important;
    cursor: ${props => props.tool === DRAG ? 'move' : 'crosshair'};
`;

const SvgArea = styled.svg`
    width: 100% !important;
    height: 100% !important;
`;

const ToolButton = styled(BaseButton)`
    padding: 4px 8px;
    background-color: ${props => props.selected ? props.color : '#f1f1f1'};
    outline: 0;
    &:hover {
        background-color: var(--surface);
    }
`;

// svg path
const MyPath = styled.path`
    fill: none;
    stroke-width: 1px;
    stroke: black;
    stroke-linejoin: round;
    stroke-linecap: round;
`;

export default SchemaEditor;