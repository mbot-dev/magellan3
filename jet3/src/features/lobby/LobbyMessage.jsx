import withDisplayNull from "../../aux/withDisplayNull";
import SimpleAlert from "../../cmp/SimpleAlert";

const LobbyMessage = ({title, messages, onCancel, width='384px'}) => {
    return (
        <SimpleAlert title={title} width={width} onCancel={onCancel}>
            <div className='w3-panel'>
            {
                messages.map((msg, i) => {
                    return (
                        <p key={i}>{msg}</p>
                    );
                })
            }
            </div>
        </SimpleAlert>
    );
};

const EnhancedLobbyMessage = withDisplayNull(LobbyMessage);
export default EnhancedLobbyMessage;
