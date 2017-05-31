import SignallingServer from "./SignallingServer";
import PeerManager from "./Communication/PeerManager";
import Config from "./Communication/Config";

const signallingServer = new SignallingServer();

const peerManager = new PeerManager(signallingServer,
    (clientId, att) => {console.log(`#onReceivedAttribute(${clientId}, ${att})`)},
    (clientId) => {console.log(`#onReceivedConnection(${clientId})`)},
    (clientId) => {console.log(`#onRemovedConnection(${clientId})`)},
    new Config([], {test:()=>{console.log("got an update :)")}})
);

window.peerManager = peerManager;