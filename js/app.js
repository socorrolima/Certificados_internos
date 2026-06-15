/* =====================================================
   app.js — Sistema de Certificados SNAS/MDS
   Estrutura: js/app.js
===================================================== */

/* ── Estado global ────────────────────────────────── */
const ESTADO = {
  senhaAdmin: 'admin123',
  eventos:    [],       // [{nome, cidade, periodo, carga, texto, template, participantes:[]}]
  certAtual:  null,
};

/* =====================================================
   NAVEGAÇÃO
===================================================== */
function aba(nome) {
  document.getElementById('tab-participante').style.display = nome === 'participante' ? '' : 'none';
  document.getElementById('tab-admin').style.display        = nome === 'admin'        ? '' : 'none';
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('ativo',
      (nome === 'participante' && i === 0) ||
      (nome === 'admin'        && i === 1)
    );
  });
  if (nome === 'participante') verificarConfig();
}

function verificarConfig() {
  const temDados = ESTADO.eventos.some(e => e.participantes.length > 0);
  document.getElementById('aviso-config').style.display = temDados ? 'none' : 'block';
  atualizarSelectEvento();
}

function atualizarSelectEvento() {
  const sel  = document.getElementById('sel-evento');
  const wrap = document.getElementById('wrap-evento');
  const evs  = ESTADO.eventos.filter(e => e.participantes.length > 0);
  if (evs.length > 1) {
    sel.innerHTML = evs.map((e, i) =>
      `<option value="${i}">${e.nome} — ${e.cidade}</option>`
    ).join('');
    wrap.style.display = '';
  } else {
    wrap.style.display = 'none';
  }
}

/* =====================================================
   ADMIN — AUTH
===================================================== */
function loginAdmin() {
  const senha = document.getElementById('inp-senha-admin').value;
  const errEl = document.getElementById('err-admin');
  if (senha === ESTADO.senhaAdmin) {
    document.getElementById('admin-login').style.display  = 'none';
    document.getElementById('admin-painel').style.display = '';
    renderizarEventos();
    errEl.style.display = 'none';
  } else {
    errEl.textContent   = 'Senha incorreta.';
    errEl.style.display = 'block';
  }
}

function trocarSenha() {
  const nova = document.getElementById('nova-senha').value;
  const conf = document.getElementById('conf-senha').value;
  const el   = document.getElementById('msg-senha');

  if (!nova) {
    exibirMsg('msg-senha', '⚠️ Digite a nova senha.', 'red'); return;
  }
  if (nova !== conf) {
    exibirMsg('msg-senha', '⚠️ As senhas não coincidem.', 'red'); return;
  }

  ESTADO.senhaAdmin = nova;
  exibirMsg('msg-senha', '✅ Senha alterada com sucesso!', 'green');
  document.getElementById('nova-senha').value = '';
  document.getElementById('conf-senha').value = '';
}

/* =====================================================
   ADMIN — EVENTOS
===================================================== */
function renderizarEventos() {
  const el = document.getElementById('lista-eventos-admin');
  if (!ESTADO.eventos.length) {
    el.innerHTML = '<p class="text-muted small">Nenhum evento. Clique em "Novo Evento".</p>';
    return;
  }
  el.innerHTML = ESTADO.eventos.map((ev, i) => `
    <div class="evento-item">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-bold">${ev.nome}</div>
          <div class="text-muted small">${ev.cidade} · ${ev.periodo} · ${ev.carga}</div>
          <div class="mt-1">
            <span class="${ev.participantes.length ? 'status-ok' : 'status-pen'}">
              ${ev.participantes.length
                ? `✅ ${ev.participantes.length} participantes`
                : '⚠️ Sem participantes'}
            </span>
            &nbsp;&nbsp;
            <span class="${ev.template ? 'status-ok' : 'status-pen'}">
              ${ev.template ? '✅ Template ok' : '⚠️ Sem template'}
            </span>
          </div>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary"  onclick="editarEvento(${i})">✏️ Editar</button>
          <button class="btn btn-sm btn-outline-danger"   onclick="removerEvento(${i})">🗑️</button>
        </div>
      </div>
    </div>`
  ).join('');
}

function abrirNovoEvento() {
  limparFormEvento();
  document.getElementById('form-titulo-ev').textContent = 'Novo Evento';
  document.getElementById('ev-idx').value = '';
  document.getElementById('form-evento').style.display = '';
  document.getElementById('form-evento').scrollIntoView({ behavior: 'smooth' });
}

function editarEvento(idx) {
  const ev = ESTADO.eventos[idx];
  document.getElementById('form-titulo-ev').textContent = 'Editar Evento';
  document.getElementById('ev-idx').value     = idx;
  document.getElementById('ev-nome').value    = ev.nome;
  document.getElementById('ev-cidade').value  = ev.cidade;
  document.getElementById('ev-periodo').value = ev.periodo;
  document.getElementById('ev-carga').value   = ev.carga;
  document.getElementById('ev-texto').value   = ev.texto;

  if (ev.template) {
    document.getElementById('prev-template').src          = ev.template.src;
    document.getElementById('prev-template').style.display = 'block';
  }
  if (ev.participantes.length) {
    exibirMsg('prev-planilha', `✅ ${ev.participantes.length} participantes carregados`, 'green', true);
  }

  document.getElementById('form-evento').style.display = '';
  document.getElementById('form-evento').scrollIntoView({ behavior: 'smooth' });
}

function removerEvento(idx) {
  if (!confirm('Remover este evento?')) return;
  ESTADO.eventos.splice(idx, 1);
  renderizarEventos();
  atualizarSelectEvento();
}

function fecharFormEvento() {
  document.getElementById('form-evento').style.display = 'none';
  limparFormEvento();
}

function limparFormEvento() {
  ['ev-nome','ev-cidade','ev-periodo','ev-carga','ev-texto'].forEach(id =>
    document.getElementById(id).value = ''
  );
  document.getElementById('prev-template').style.display  = 'none';
  document.getElementById('prev-planilha').style.display  = 'none';
  document.getElementById('msg-evento').style.display     = 'none';
  document.getElementById('ev-planilha').value = '';
  document.getElementById('ev-template').value = '';
}

async function salvarEvento() {
  const nome  = document.getElementById('ev-nome').value.trim();
  const texto = document.getElementById('ev-texto').value.trim();

  if (!nome || !texto) {
    alertEvento('⚠️ Nome e Texto do Certificado são obrigatórios.', 'warning');
    return;
  }

  const idxStr = document.getElementById('ev-idx').value;
  const ev     = idxStr !== '' ? ESTADO.eventos[parseInt(idxStr)] : {};

  ev.nome    = nome;
  ev.cidade  = document.getElementById('ev-cidade').value.trim();
  ev.periodo = document.getElementById('ev-periodo').value.trim();
  ev.carga   = document.getElementById('ev-carga').value.trim();
  ev.texto   = texto;
  if (!ev.participantes) ev.participantes = [];

  // Template
  const tFile = document.getElementById('ev-template').files[0];
  if (tFile) {
    ev.template = await carregarImagem(tFile);
  }

  // Planilha
  const pFile = document.getElementById('ev-planilha').files[0];
  if (pFile) {
    const nomes = await lerPlanilha(pFile);
    if (!nomes.length) {
      alertEvento('❌ Nenhum nome encontrado na planilha. Verifique a coluna "Nome".', 'danger');
      return;
    }
    ev.participantes = nomes;
    exibirMsg('prev-planilha', `✅ ${nomes.length} participantes carregados`, 'green', true);
  }

  if (idxStr === '') ESTADO.eventos.push(ev);

  alertEvento('✅ Evento salvo com sucesso!', 'success');
  renderizarEventos();
  atualizarSelectEvento();
  setTimeout(fecharFormEvento, 1200);
}

function alertEvento(txt, tipo) {
  const el = document.getElementById('msg-evento');
  el.className   = 'alert alert-' + tipo + ' small py-2';
  el.textContent = txt;
  el.style.display = 'block';
}

/* =====================================================
   LEITURA DE PLANILHA (SheetJS)
===================================================== */
function lerPlanilha(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rows.length < 2) { res([]); return; }

        const header = rows[0].map(c => String(c).trim().toLowerCase());
        const iNome  = header.findIndex(c => c === 'nome' || c === 'name');
        const iMun   = header.findIndex(c => c.includes('munic'));
        const col    = iNome >= 0 ? iNome : 0;

        const participantes = rows.slice(1)
          .map(r => ({
            nome:      String(r[col] || '').trim(),
            municipio: iMun >= 0 ? String(r[iMun] || '').trim() : ''
          }))
          .filter(r => r.nome && !/^\d+$/.test(r.nome));

        res(participantes);
      } catch(e) { rej(e); }
    };
    reader.onerror = rej;
    reader.readAsArrayBuffer(file);
  });
}

/* =====================================================
   BUSCA DE PARTICIPANTE
===================================================== */
function normalizar(t) {
  if (!t) return '';
  return t.trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function similaridade(a, b) {
  a = normalizar(a); b = normalizar(b);
  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const pa = new Set(a.split(' '));
  const pb = new Set(b.split(' '));
  const comuns = [...pa].filter(x => pb.has(x));
  return comuns.length / Math.max(pa.size, pb.size);
}

function buscar() {
  const nome = document.getElementById('inp-nome').value.trim();
  if (!nome) { msgBusca('⚠️ Digite seu nome completo.', 'warning'); return; }

  const evs = ESTADO.eventos.filter(e => e.participantes.length > 0);
  if (!evs.length) {
    msgBusca('⚠️ Nenhuma lista de participantes carregada.', 'warning');
    return;
  }

  // Seleciona evento
  let evento;
  if (evs.length === 1) {
    evento = evs[0];
  } else {
    const idx = parseInt(document.getElementById('sel-evento').value);
    evento = evs[idx];
  }

  // Busca exata normalizada
  const nb  = normalizar(nome);
  let enc   = evento.participantes.find(p => normalizar(p.nome) === nb);

  // Busca aproximada
  if (!enc) {
    let best = null, score = 0;
    evento.participantes.forEach(p => {
      const s = similaridade(nome, p.nome);
      if (s > score) { score = s; best = p; }
    });
    if (score >= 0.80) enc = best;
  }

  if (!enc) {
    msgBusca('❌ Nome não encontrado. Favor procurar os organizadores do evento.', 'danger');
    document.getElementById('area-preview').style.display = 'none';
    return;
  }

  msgBusca('✅ Participante encontrado! Gerando certificado...', 'success');
  ESTADO.certAtual = { participante: enc, evento };
  renderizarCertificado(enc, evento);
}

/* =====================================================
   GERAÇÃO DO CERTIFICADO NO CANVAS
===================================================== */
function preencherTexto(tmpl, dados) {
  let t = tmpl;
  Object.entries(dados).forEach(([k, v]) => {
    t = t.replaceAll(`{${k}}`, v || '');
  });
  return t;
}

function quebrarLinhas(ctx, texto, maxLarg) {
  const palavras = texto.split(' ');
  const linhas   = [];
  let atual = '';
  for (const p of palavras) {
    const teste = atual ? atual + ' ' + p : p;
    if (ctx.measureText(teste).width > maxLarg && atual) {
      linhas.push(atual);
      atual = p;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

async function renderizarCertificado(participante, evento) {
  const canvas = document.getElementById('canvas-cert');
  const ctx    = canvas.getContext('2d');

  const tmpl = evento.template || await demoImg();
  const W    = tmpl.naturalWidth  || 2480;
  const H    = tmpl.naturalHeight || 1754;

  canvas.width  = W;
  canvas.height = H;

  // Fundo + template
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(tmpl, 0, 0, W, H);

  // Monta texto com placeholders preenchidos
  const texto = preencherTexto(evento.texto, {
    Nome:          participante.nome,
    Municipio:     participante.municipio || '',
    Cidade:        evento.cidade,
    Data:          evento.periodo,
    Carga_Horaria: evento.carga,
  });

  // Quebra texto em linhas
  const linhasRaw = texto.split('\n').filter(l => l.trim());
  const szTexto   = Math.round(W * 0.020);
  const lhTexto   = szTexto * 1.7;
  const maxLarg   = W * 0.72;

  ctx.save();
  ctx.font         = `bold ${szTexto}px Arial, sans-serif`;
  ctx.fillStyle    = '#1a1a1a';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = 'rgba(255,255,255,0.95)';
  ctx.shadowBlur   = 6;

  const todasLinhas = [];
  linhasRaw.forEach(l => todasLinhas.push(...quebrarLinhas(ctx, l, maxLarg)));

  const totalH = todasLinhas.length * lhTexto;
  const yStart = H * 0.42 - totalH / 2 + lhTexto / 2;
  todasLinhas.forEach((l, i) => ctx.fillText(l, W / 2, yStart + i * lhTexto));
  ctx.restore();

  // Linha de assinatura
  const yA = H * 0.73;
  ctx.save();
  ctx.strokeStyle = '#555';
  ctx.lineWidth   = Math.round(W * 0.0008);
  ctx.beginPath();
  ctx.moveTo(W / 2 - W * 0.17, yA);
  ctx.lineTo(W / 2 + W * 0.17, yA);
  ctx.stroke();
  ctx.restore();

  // Nome do assinante
  const szA = Math.round(W * 0.016);
  ctx.save();
  ctx.font         = `bold ${szA}px Arial`;
  ctx.fillStyle    = '#1a1a1a';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur   = 4;
  ctx.fillText('Elias de Souza Oliveira', W / 2, yA + szA * 1.4);
  ctx.restore();

  // Cargo
  const szC = Math.round(W * 0.012);
  const yC  = yA + szA * 3.2;
  ctx.save();
  ctx.font         = `${szC}px Arial`;
  ctx.fillStyle    = '#444';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur   = 3;
  ctx.fillText('Diretor de Departamento de Proteção Social Básica', W / 2, yC);
  ctx.fillText('da Secretaria Nacional de Assistência Social',      W / 2, yC + szC * 1.6);
  ctx.restore();

  // Código único
  const codigo = 'CERT-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
  ESTADO.certAtual.codigo = codigo;

  // Exibe preview
  document.getElementById('area-preview').style.display = 'block';
  document.getElementById('area-preview').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('cert-codigo').innerHTML =
    'Código: <strong>' + codigo + '</strong>';

  // QR Code
  const qw = document.getElementById('qr-wrap');
  qw.style.display = 'block';
  document.getElementById('qr').innerHTML = '';
  new QRCode(document.getElementById('qr'), {
    text:   window.location.href + '?cert=' + codigo,
    width:  100,
    height: 100
  });

  msgBusca('✅ Certificado gerado para: ' + participante.nome, 'success');
}

/* =====================================================
   DOWNLOAD PDF
===================================================== */
function baixarPDF() {
  if (!ESTADO.certAtual) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.addImage(
    document.getElementById('canvas-cert').toDataURL('image/png', 1.0),
    'PNG', 0, 0, 297, 210
  );
  doc.save('Certificado_' + ESTADO.certAtual.participante.nome.replace(/\s+/g, '_') + '.pdf');
}

/* =====================================================
   UTILITÁRIOS
===================================================== */
function carregarImagem(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img   = new Image();
      img.onload  = () => res(img);
      img.onerror = rej;
      img.src     = e.target.result;
      // Preview no formulário
      document.getElementById('prev-template').src          = e.target.result;
      document.getElementById('prev-template').style.display = 'block';
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

async function demoImg() {
  const W = 2480, H = 1754;
  const c   = document.createElement('canvas');
  c.width   = W; c.height = H;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#eef2ff');
  g.addColorStop(1, '#dbeafe');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#003580'; ctx.lineWidth = 28;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = '#1a56db'; ctx.lineWidth = 8;
  ctx.strokeRect(66, 66, W - 132, H - 132);

  ctx.fillStyle    = '#003580';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 72px Arial';
  ctx.fillText('MINISTÉRIO DO DESENVOLVIMENTO E ASSISTÊNCIA SOCIAL', W / 2, 140);
  ctx.font = 'bold 150px Georgia, serif';
  ctx.fillText('CERTIFICADO', W / 2, 360);

  ctx.fillStyle = '#1a56db';
  ctx.fillRect(280, 560, W - 560, 6);
  ctx.fillStyle = '#003580';
  ctx.fillRect(W / 2 - 320, H - 220, 640, 4);

  ctx.font      = '44px Arial';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('Brasília — 2026', W / 2, H - 160);

  const img = new Image();
  img.src   = c.toDataURL('image/png');
  return new Promise(res => { img.onload = () => res(img); });
}

function msgBusca(txt, tipo) {
  const el     = document.getElementById('msg-busca');
  el.className = 'alert alert-' + tipo + ' py-2 small';
  el.textContent   = txt;
  el.style.display = 'block';
}

function limpar() {
  document.getElementById('inp-nome').value         = '';
  document.getElementById('area-preview').style.display = 'none';
  document.getElementById('msg-busca').style.display    = 'none';
  ESTADO.certAtual = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exibirMsg(id, txt, cor, inline = false) {
  const el         = document.getElementById(id);
  el.textContent   = txt;
  el.style.color   = cor;
  el.style.display = inline ? 'block' : 'block';
}

/* ── Inicialização ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  verificarConfig();
});