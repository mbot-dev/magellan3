import { useMargaret } from '../io/MargaretProvider';
import { CANCEL_TEXT, OK_TEXT } from '../aux/FormUtil';

const SmallButtons = ({
  cancelText = CANCEL_TEXT,
  cancelEnabled = true,
  onCancel,
  optionText,
  optionEnabled,
  onOption,
  option2Text,
  option2Enabled,
  onOption2,
  okText = OK_TEXT,
  okEnabled,
  onOk,
  onSubmit
}) => {
  const margaret = useMargaret();

  const handleCancel = () => {
    onCancel();
  };

  const handleOption = () => {
    onOption();
  };

  const handleOption2 = () => {
    onOption2();
  };

  const handleOk = () => {
    onOk();
  };

  const renderMac = () => {
    return (
      <>
        {
          onCancel &&
          <button
            className='w3-button w3-round w3-padding-small w3-border'
            type='button'
            disabled={!cancelEnabled}
            onClick={handleCancel}
          >
            {cancelText}
          </button>
        }
        {
          onOption &&
          <button
            className='w3-button w3-round w3-padding-small w3-border'
            type='button'
            disabled={!optionEnabled}
            onClick={handleOption}
          >
            {optionText}
          </button>
        }
        {
          onOption2 &&
          <button
            className='w3-button w3-round w3-padding-small w3-border'
            type='button'
            disabled={!option2Enabled}
            onClick={handleOption2}
          >
            {option2Text}
          </button>
        }
        {
          onSubmit &&
          <button
            className='w3-button w3-round w3-padding-small z3-primary'
            type='submit'
            disabled={!okEnabled}
          >
            {okText}
          </button>
        }
        {
          onOk &&
          <button
            className='w3-button w3-round w3-padding-small z3-primary'
            type='button'
            disabled={!okEnabled}
            onClick={handleOk}
          >
            {okText}
          </button>
        }
      </>
    );
  };

  const renderWin = () => {
    return (
      <>
        {
          onSubmit &&
          <button
            className='w3-button w3-round w3-padding-small z3-primary'
            type='submit'
            disabled={!okEnabled}
          >
            {okText}
          </button>
        }
        {
          onOk &&
          <button
            className='w3-button w3-round w3-padding-small z3-primary'
            type='button'
            disabled={!okEnabled}
            onClick={handleOk}
          >
            {okText}
          </button>
        }
        {
          onOption &&
          <button
            className='w3-button w3-round w3-padding-small w3-border'
            type='button'
            disabled={!optionEnabled}
            onClick={handleOption}
          >
            {optionText}
          </button>
        }
        {
          onOption2 &&
          <button
            className='w3-button w3-round w3-padding-small w3-border'
            type='button'
            disabled={!option2Enabled}
            onClick={handleOption2}
          >
            {option2Text}
          </button>
        }
        {
          onCancel &&
          <button
            className='w3-button w3-round w3-padding-small w3-border'
            type='button'
            disabled={!cancelEnabled}
            onClick={handleCancel}
          >
            {cancelText}
          </button>
        }
      </>
    );
  };

  return margaret.isMac() ? (
    renderMac()
  ) : (
    renderWin()
  );
};

export default SmallButtons;
