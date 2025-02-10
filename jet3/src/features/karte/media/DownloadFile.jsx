import { useEffect, useState } from "react";
import { useMargaret } from "../../../io/MargaretProvider";
import ModalEditorLarge from "../../../cmp/ModalEditorLarge";

const useSrc = (src) => {
  const [filename, setFilename] = useState("");
  const [path, setPath] = useState("");

  useEffect(() => {
    if (!src) {
      return;
    }
    const [f, p] = src.split(" ");
    setFilename(f);
    setPath(p);
  }, [src]);
  return [filename, path];
};

const DownloadFile = ({ src, onCancel, width = "300px" }) => {
  const margaret = useMargaret();
  const [filename, path] = useSrc(src);

  useEffect(() => {
    if (!filename || !path) {
      return;
    }
    const dl = async () => {
      await margaret
        .getApi("media")
        .download(path)
        .then((data) => {
          const url = window.URL.createObjectURL(new Blob([data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
          onCancel();
        });
    };
    dl().catch((err) => console.log(err));
  }, [onCancel, filename, path]);

  const handleCancel = () => {
    // setCancel(true);
  };

  return (
    <ModalEditorLarge
      id="download_file"
      title={TEXT_DOWNLOAD}
      justify="center"
      onCancel={handleCancel}
      okText={null}
      okEnabled={false}
      onSubmit={null}
      width={width}
    >
      <span className="w3-small">{`${filename}...`}</span>
    </ModalEditorLarge>
  );
};

const TEXT_DOWNLOAD = "ダウンロード";

export default DownloadFile;
