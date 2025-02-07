import { useEffect, useRef, useState } from 'react';
import { useStateValue } from "../../../reducers/state";
import { currFacility } from "../../../models/karteCtx";
import { upload } from "../../../io/mediaIO";
import claimFunc from "../../../models/claimFunc";
import ModalEditorLarge from '../../../cmp/ModalEditorLarge';

const TEXT_TITLE = '画像アップロード';
const UPLOAD_PATH = '/media/api/v1/upload/file';
const TEXT_ATTACH = '添付';

const ImageUploader = ({ target }) => {
    const [{ user }, dispatch] = useStateValue();
    const [source, setSource] = useState(null);
    const facility_id = useRef(currFacility(user).id);

    useEffect(() => {
        let isCancel = false;
        if (target && !isCancel) {
            setSource(URL.createObjectURL(target));
        }
        return () => {
            isCancel = true;
            if (source) {
                URL.revokeObjectURL(source);
            }
        };
    }, [target]);

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append('file', target, target.name);  // file: fastAPI
        const path = `${UPLOAD_PATH}/${facility_id.current}`;
        await upload(path, formData)
            .then(result => {
                const { thumbnail, body, filename } = result;
                const { lastModified, size, type } = target;
                const imageData = {
                    filename,
                    contentType: type,
                    size,
                    lastModified,
                    thumbnail,
                    body,
                };
                const imageItem = claimFunc['createImageItem'](imageData);
                const imageBundle = claimFunc['createBundle'](['refImage', imageItem]);
                dispatch({ type: imageBundle.onCreate, bundle: imageBundle });

            }).catch(err => {
                console.log(err);  // ToDo Alert
            }).finally(() => {
                dispatch({ type: 'setImageFileToUpload', target: null });
            });
    };

    const handleCancel = () => {
        dispatch({ type: 'setImageFileToUpload', target: null });
    };

    return source && (
        <ModalEditorLarge
            id='image_uploader'
            title={TEXT_TITLE}
            onCancel={handleCancel}
            okText={TEXT_ATTACH}
            okEnabled={true}
            onSubmit={handleUpload}
            width='512px'
        >
            {source &&
                <div className='z3-flex' style={{'--justify': 'center'}}>
                    <img
                        src={source}
                        alt='upload'
                        style={{ width: '100%', height: 'auto' }}
                    />
                </div>
            }
        </ModalEditorLarge>
    );
};

export default ImageUploader;
