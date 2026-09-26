import server from "./server";
import { config } from "./config/env";

const PORT = config.port;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
