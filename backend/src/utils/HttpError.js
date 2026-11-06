// Erro com código HTTP. Lançado nos controllers e tratado em middlewares/erros.js
class HttpError extends Error {
  /**
   * @param {number} status   código HTTP (400, 401, 403, 404, 409...)
   * @param {string} mensagem texto enviado ao front-end
   * @param {object} [detalhes] dados extras devolvidos junto com o erro
   */
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

module.exports = HttpError;
