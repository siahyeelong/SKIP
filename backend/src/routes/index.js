import attractions from "./attractions.js";

export default (app) => {
  app.use("/attractions", attractions);
};
