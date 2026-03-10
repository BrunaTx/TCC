require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const app = express();

app.use(cors());
app.use(express.json());

app.use(session({
  secret: "essencia_do_mar",
  resave: false,
  saveUninitialized: false
}));


app.use("/styles", express.static(path.join(__dirname, "../frontend/styles")));
app.use("/images", express.static(path.join(__dirname, "../frontend/images")));
app.use("/js", express.static(path.join(__dirname, "../frontend/js")));


function verificarLogin(req, res, next) {
  if (req.session.usuario) next();
  else res.redirect("/");
}

function verificarLoginAPI(req, res, next) {
  if (req.session.usuario) next();
  else res.status(401).json({ erro: "Não autorizado" });
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use("/pages", verificarLogin, express.static(path.join(__dirname, "../frontend/pages")));

app.get("/pages/dashboard.html", verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/dashboard.html"));
});


// login
const authRoutes = require("./src/routes/auth_routes");
app.use("/api/auth", authRoutes);

// categorias
const categoriaRoutes = require("./src/routes/categorias_routes");
app.use("/api/categorias", verificarLoginAPI, categoriaRoutes);

// produtos 
const produtoRoutes = require("./src/routes/produtos_routes");
app.use("/api/produtos", verificarLoginAPI, produtoRoutes);

// clientes
const clienteRoutes = require("./src/routes/clientes_routes");
app.use("/api/clientes", clienteRoutes);

const vendaRoutes = require("./src/routes/vendas_routes");
app.use("/api/vendas", verificarLoginAPI, vendaRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});