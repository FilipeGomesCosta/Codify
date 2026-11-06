// Autenticação por token JWT e controle de acesso por tipo de usuário
const jwt = require('jsonwebtoken');
const HttpError = require('../utils/HttpError');

/** Exige o cabeçalho "Authorization: Bearer <token>". Preenche req.usuario. */
function autenticar(req, res, next) {
  const [esquema, token] = (req.headers.authorization || '').split(' ');
  if (esquema !== 'Bearer' || !token) {
    throw new HttpError(401, 'Faça login para continuar.');
  }
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: dados.id, tipo: dados.tipo, nome: dados.nome };
  } catch {
    throw new HttpError(401, 'Sessão inválida ou expirada. Faça login novamente.');
  }
  next();
}

/** Libera a rota só para os tipos informados. Ex.: permitir('professor') */
function permitir(...tipos) {
  return (req, res, next) => {
    if (!tipos.includes(req.usuario?.tipo)) {
      throw new HttpError(403, 'Você não tem permissão para acessar este recurso.');
    }
    next();
  };
}

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id_usuario, tipo: usuario.tipo, nome: usuario.nome },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

module.exports = { autenticar, permitir, gerarToken };
