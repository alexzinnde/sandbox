import log from "./src/logger";
import server from "./src/server";

const PORT = 3322;
server.listen(PORT, () => log.info(`Server listening on [${PORT}]`));