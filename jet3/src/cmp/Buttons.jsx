import { useMargaret } from "../io/MargaretProvider";
import { CANCEL_TEXT, OK_TEXT } from "../aux/FormUtil";

const Buttons = ({
  cancelText = CANCEL_TEXT,
  cancelEnabled = true,
  onCancel,
  optionText = null,
  optionEnabled = false,
  onOption = null,
  okText = OK_TEXT,
  okEnabled = true,
  onOk = null,
  onSubmit = null,
}) => {
  const margaret = useMargaret();

  const handleCancel = () => {
    onCancel();
  };

  const handleOption = () => {
    onOption();
  };

  const handleOk = () => {
    onOk();
  };

  const renderMac = () => {
    return (
      <>
        {onCancel && (
          <button
            className="w3-button w3-round w3-border"
            type="button"
            disabled={!cancelEnabled}
            onClick={handleCancel}
          >
            {cancelText}
          </button>
        )}
        {onOption && (
          <button
            className="w3-button w3-round w3-border"
            type="button"
            disabled={!optionEnabled}
            onClick={handleOption}
          >
            {optionText}
          </button>
        )}
        {onSubmit && (
          <button
            className="w3-button w3-round z3-primary"
            type="submit"
            disabled={!okEnabled}
          >
            {okText}
          </button>
        )}
        {onOk && (
          <button
            className="w3-button w3-round z3-primary"
            type="button"
            disabled={!okEnabled}
            onClick={handleOk}
          >
            {okText}
          </button>
        )}
      </>
    );
  };

  const renderWin = () => {
    return (
      <>
        {onSubmit && (
          <button
            className="w3-button w3-round z3-primary"
            type="submit"
            disabled={!okEnabled}
          >
            {okText}
          </button>
        )}
        {onOk && (
          <button
            className="w3-button w3-round z3-primary"
            type="button"
            disabled={!okEnabled}
            onClick={handleOk}
          >
            {okText}
          </button>
        )}
        {onOption && (
          <button
            className="w3-button w3-round w3-border"
            type="button"
            disabled={!optionEnabled}
            onClick={handleOption}
          >
            {optionText}
          </button>
        )}
        {onCancel && (
          <button
            className="w3-button w3-round w3-border"
            type="button"
            disabled={!cancelEnabled}
            onClick={handleCancel}
          >
            {cancelText}
          </button>
        )}
      </>
    );
  };

  return margaret.isMac() ? renderMac() : renderWin();
};

export default Buttons;

