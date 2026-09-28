# Apps Script — append leads to Google Sheet

CRM Sheet ID: `1yPmonk-Wg-iSvBfafTiiFRfZxhF8Cid3vbtXjuvZMW8`  
Tab: **Leads**

## Colunas atuais (cabeçalho real)

```
id, nome, tipo, cidade, quartos_est, instagram, site, email, telefone,
fonte, tier, status, owner, ultimo_contato, proximo_passo, notas, atualizado
```

O formulário do site envia JSON semântico. O script abaixo **mapeia** para essas colunas (sem service account no repositório).

| Campo do formulário | Coluna na Sheet |
|---|---|
| (gerado) | `id` |
| `nome` | `nome` |
| `empresa` | entra em `notas` (+ `tipo` = `lead-site`) |
| `cidade` | `cidade` |
| `email` | `email` |
| `whatsapp` | `telefone` |
| `fonte` (`landing` / `piloto`) | `fonte` |
| — | `status` = `Novo` |
| `dor` + empresa | `notas` |
| agora | `ultimo_contato`, `atualizado` |

## Deploy

1. Abra a planilha → **Extensões → Apps Script**.
2. Cole o código abaixo e salve.
3. **Implantar → Nova implantação → Tipo: app da web**.
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa** (o endpoint só aceita POST JSON; a URL fica só no secret `LEADS_WEBHOOK_URL` da Cloudflare).
4. Copie a URL `…/exec` e coloque em **Cloudflare Pages → Environment variables** como `LEADS_WEBHOOK_URL`.

## Código

```javascript
const SHEET_ID = '1yPmonk-Wg-iSvBfafTiiFRfZxhF8Cid3vbtXjuvZMW8';
const TAB = 'Leads';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(TAB);
    if (!sheet) throw new Error('Tab Leads não encontrada');

    const now = new Date();
    const id = Utilities.getUuid();
    const nome = String(data.nome || '').trim();
    const empresa = String(data.empresa || '').trim();
    const cidade = String(data.cidade || '').trim();
    const email = String(data.email || '').trim();
    const telefone = String(data.whatsapp || data.telefone || '').trim();
    const fonte = String(data.fonte || 'landing').trim();
    const dor = String(data.dor || '').trim();
    const status = String(data.status || 'Novo').trim();

    const notasParts = [];
    if (empresa) notasParts.push('Empresa: ' + empresa);
    if (dor) notasParts.push('O que trava: ' + dor);
    const notas = notasParts.join(' | ');

    // Ordem = cabeçalho da aba Leads
    sheet.appendRow([
      id,           // id
      nome,         // nome
      'lead-site',  // tipo
      cidade,       // cidade
      '',           // quartos_est
      '',           // instagram
      '',           // site
      email,        // email
      telefone,     // telefone
      fonte,        // fonte
      '',           // tier
      status,       // status
      '',           // owner
      now,          // ultimo_contato
      'Responder lead do site', // proximo_passo
      notas,        // notas
      now,          // atualizado
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, id: id }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** Teste rápido no editor */
function testAppend() {
  doPost({
    postData: {
      contents: JSON.stringify({
        nome: 'Teste',
        empresa: 'Pousada Exemplo',
        cidade: 'Tibau do Sul / RN',
        email: 'teste@example.com',
        whatsapp: '84999990000',
        dor: 'Cotações paradas na alta',
        fonte: 'landing',
        status: 'Novo',
      }),
    },
  });
}
```

## Cloudflare

Em **Pages → Settings → Environment variables** (Production + Preview):

- `RESEND_API_KEY` (secret)
- `LEAD_NOTIFY_TO` = `marebots.com@gmail.com` (opcional)
- `LEADS_WEBHOOK_URL` = URL do Apps Script (opcional, mas recomendado)

No Resend: verifique o domínio `marebots.com` e use o remetente `contato@marebots.com`.
