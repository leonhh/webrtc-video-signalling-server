export interface User {
    socket: string;
    sessionId: string;
    name: string;
}


export interface LoginWebSocketMessage {
    sessionId: string;
    name: string;
}

export interface StartCallWebSocketMessage {
    caller: User;
    recipient: User;
}

export interface WebRTCIceCandidateWebSocketMessage {
    candiate: RTCIceCandidate;
    caller: User;
    recipient: User;
}

export interface WebRTCOfferWebSocketMessage {
    offer: RTCSessionDescription;
    caller: User;
    recipient: User;
}

export interface WebRTCAnswerWebSocketMessage {
    answer: RTCSessionDescription;
    caller: User;
    recipient: User;
}

// these 4 messages are related to the call itself, thus we can
// bundle them in this type union, maybe we need that later
type WebSocketCallMessage =
    StartCallWebSocketMessage
    | WebRTCIceCandidateWebSocketMessage
    | WebRTCOfferWebSocketMessage
    | WebRTCAnswerWebSocketMessage;