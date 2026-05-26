import { createServer } from "./server.js";

const port = Number(process.env.PORT ?? 3978);
const app = createServer();

app.listen(port, () => {
  console.log(`SharePoint Site Request Agent listening on port ${port}`);
});
