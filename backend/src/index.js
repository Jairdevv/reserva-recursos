import "dotenv/config";
import express, { json } from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
