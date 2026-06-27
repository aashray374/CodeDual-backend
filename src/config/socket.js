import socketAuth from "../middlewares/socketAuth.js";
import registerSocketEvents from "../sockets/socketEvents.js";

export default function configureSocket(io){

    io.use(socketAuth);

    io.on("connection",(socket)=>{

        registerSocketEvents(io,socket);

    });

}