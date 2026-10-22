// Variante do site. A única diferença entre as duas versões publicadas:
//   com preço  -> precopesqueiro.chumbada.com.br  (preços visíveis + "Minha Seleção" enviada por WhatsApp)
//   sem preço  -> pesqueiro.chumbada.com.br        (sem valores + "lista" exportada em PDF)
export const PRECO = false;
export const SITE_URL = 'https://pesqueiro.chumbada.com.br';
export const HUB_HOST = PRECO ? 'catalogosdeprecos.chumbada.com.br' : 'catalogos.chumbada.com.br';
