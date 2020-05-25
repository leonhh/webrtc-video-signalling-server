import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import cors from "cors";
import { StartCallWebSocketMessage, WebRTCIceCandidateWebSocketMessage, User, LoginWebSocketMessage, WebRTCOfferWebSocketMessage, WebRTCAnswerWebSocketMessage } from "./types";

export class Server {
    private httpServer: HTTPServer;
    private app: Application;
    private io: SocketIOServer;

    private activeUsers: Array<User> = [];

    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = socketIO(this.httpServer);

        this.app.use(cors());

        this.app.get('/users', (req, res) => {
            res.json(this.activeUsersList());
        });

        this.handleSocketConnection();
    }

    public start(): void {
        this.httpServer.listen(5000, () => {
            console.log('server started at port 5000')
        });
    }

    private handleSocketConnection(): void {
        this.io.on("connection", socket => {
            let sender: User = undefined;

            socket.on('login', (data: LoginWebSocketMessage) => {
                this.activeUsers.push({
                    socket: socket.id,
                    sessionId: data.sessionId,
                    name: data.name
                });

                sender = this.findUserBySocket(socket.id);

                socket.broadcast.emit('users-list-update', this.activeUsersList())

                console.log(`login by: ${sender.name}`);
            });

            socket.on('start_call', (data: StartCallWebSocketMessage) => {
                console.log(`${data.caller.name} started a call with ${data.recipient.name}`);
 
                socket.to(data.recipient.socket).emit('start_call', {
                    caller: data.caller,
                    recipient: data.recipient
                });
            });

            socket.on('icecandidate', (data: WebRTCIceCandidateWebSocketMessage) => {
                console.log(`received ice candidate from ${sender.sessionId}`);

                if (sender.sessionId === data.caller.sessionId) {
                    socket.to(data.recipient.socket).emit('icecandidate', data);
                } else {
                    socket.to(data.caller.socket).emit('icecandidate', data);
                }
            });

            socket.on('offer', (data: WebRTCOfferWebSocketMessage) => {
                console.log(`received offer from ${sender.sessionId}, send offer to ${data.caller.sessionId}`);
                
                socket.to(data.caller.socket).emit('offer', data);
            });


            socket.on('answer', (data: WebRTCAnswerWebSocketMessage) => {
                console.log(`received answer from ${sender.sessionId}, send answer to ${data.recipient.sessionId}`);
                
                socket.to(data.recipient.socket).emit('answer', data);
            });

            socket.on("disconnect", () => {
                this.activeUsers = this.activeUsers.filter((user) => {
                    if (user.socket === socket.id) {
                        console.log(`${user.sessionId} disconnected`);
                        return false;
                    }

                    return true;
                });

                socket.emit('users-list-update', this.activeUsersList())
            });
        });
    }

    private activeUsersList() {
        return this.activeUsers.filter((user) => {
            return user.sessionId !== undefined;
        });
    }

    private findUserBySocket(socket: string): User | undefined {
        return this.activeUsers.find((user) => user.socket === socket);
    }

    private findUserBysessionId(sessionId: string): User | undefined {
        return this.activeUsers.find((user) => user.sessionId === sessionId);
    }
}