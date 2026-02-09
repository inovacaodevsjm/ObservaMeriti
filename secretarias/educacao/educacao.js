/* =======================================================================
   EDUCACAO.JS - VERSÃO FINAL (ESCALA DINÂMICA + 1 CASA DECIMAL)
   ======================================================================= */

// Registro do Plugin de Dados (DataLabels)
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

const SIDRA_URLS = {
    ideb_iniciais: "https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2005|2007|2009|2011|2013|2015|2017|2019|2021|2023/variaveis/63?localidades=N6[3305109]",
    ideb_finais: "https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2005%7C2007%7C2009%7C2011%7C2013%7C2015%7C2017%7C2019%7C2021%7C2023/variaveis/63?localidades=N6%5B3305109%5D&classificacao=12030%5B115175%5D",
    matriculas: "https://servicodados.ibge.gov.br/api/v3/agregados/5930/periodos/2018|2019|2020|2021|2022/variaveis/1000096?localidades=N6[3305109]",
    taxa_abandono: "https://servicodados.ibge.gov.br/api/v3/agregados/5935/periodos/2018|2019|2020|2021|2022/variaveis/64?localidades=N6[3305109]",
    taxa_distorcao: "https://servicodados.ibge.gov.br/api/v3/agregados/5936/periodos/2018|2019|2020|2021|2022/variaveis/1000096?localidades=N6[3305109]",
    mat_infantil: "https://servicodados.ibge.gov.br/api/v3/agregados/5929/periodos/2018|2019|2020|2021|2022/variaveis/1000096?localidades=N6[3305109]",
    mat_fundamental: "https://servicodados.ibge.gov.br/api/v3/agregados/5930/periodos/2018|2019|2020|2021|2022/variaveis/1000096?localidades=N6[3305109]"
};

const FALLBACK_DATA = {
    ideb_iniciais: { labels: ['05','07','09','11','13','15','17','19','21','23'], values: [3.7, 3.6, 4.0, 4.2, 4.5, 4.5, 4.6, 4.9, 4.6, 4.9] },
    ideb_finais: { labels: ['05','07','09','11','13','15','17','19','21','23'], values: [2.6, 2.7, 3.0, 3.2, 3.4, 3.5, 3.7, 4.1, 4.0, 4.2] },
    matriculas: { labels: ['18','19','20','21','22'], values: [26188, 26500, 27100, 27800, 28377] },
    taxas_distorcao: { labels: ['18','19','20','21','22'], values: [29.8, 28.5, 27.2, 26.8, 25.4] },
    taxas_abandono: { labels: ['18','19','20','21','22'], values: [2.04, 1.95, 1.80, 1.45, 1.1] },
    mat_infantil: { labels: ['18','19','20','21','22'], values: [8800, 8950, 9100, 9300, 9476] },
    mat_fundamental: { labels: ['18','19','20','21','22'], values: [18000, 18500, 19200, 19500, 19850] }
};

const COLORS = { blue: '#00A8E8', green: '#009039', yellow: '#FDC806', pink: '#FF4081', purple: '#9C27B0', grid: 'rgba(255, 255, 255, 0.05)' };
let chartInstances = [];

document.addEventListener('DOMContentLoaded', () => {
    initAllCharts();
});

async function fetchSidraData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro API");
        const json = await response.json();
        const resultados = json[0].resultados[0].series[0].serie;
        return {
            labels: Object.keys(resultados).map(ano => ano.slice(-2)),
            values: Object.values(resultados).map(v => (v === "..." || v === "-") ? 0 : parseFloat(v))
        };
    } catch (e) { return null; }
}

/* --- MOTOR DE INICIALIZAÇÃO COM LOADER TECNOLÓGICO --- */
async function initAllCharts() {
    const cards = document.querySelectorAll('.sebrae-card, .analise-card');
    const banners = document.querySelectorAll('.status-banner');
    
    // 1. Ativa o Loader Tecnológico
    cards.forEach(card => {
        card.classList.add('is-loading');
        if (!card.querySelector('.loader-container')) {
            const loader = document.createElement('div');
            loader.className = 'loader-container';
            loader.innerHTML = '<div class="tech-loader"></div>';
            card.appendChild(loader);
        }
    });

    try {
        const response = await fetch('./dados_educacao.json');
        if (!response.ok) throw new Error("Erro ao carregar JSON");
        const bd = await response.json();

        // --- PARTE 1: ATUALIZAÇÃO DOS KPIS ---
        const kpiMap = {
            'kpi-escolas': bd.kpi_escolas,
            'kpi-alunos': bd.kpi_alunos,
            'kpi-professores': bd.kpi_professores,
            'kpi-funcionarios': bd.kpi_funcionarios,
            'kpi-turmas': bd.kpi_turmas,
            'kpi-responsaveis': bd.kpi_responsaveis,
            'kpi-vagas': bd.kpi_vagas,
            'kpi-aulas': bd.kpi_aulas,
            'kpi-eventos': bd.kpi_eventos,
            'kpi-refeicoes': bd.kpi_refeicoes,
            'kpi-distorcao-ano': bd.kpi_distorcao_ano
        };

        Object.keys(kpiMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('data-target', kpiMap[id] || 0);
                el.innerText = "0";
            }
        });

        // Inicia contagem dos números IMEDIATAMENTE
        initKpiCounters();

        // --- PARTE 2: INICIALIZAÇÃO DOS GRÁFICOS (RESTAURADA) ---
        // Aqui chamamos as funções que renderizam os gráficos usando os dados do JSON
        if (bd.ideb_iniciais) renderIdebLocal(bd.ideb_iniciais, bd.ideb_finais);
        if (bd.taxa_distorcao) renderTaxasLocal(bd.taxa_distorcao, bd.taxa_abandono);
        if (bd.mat_infantil) renderMatriculasPorNivel(bd.mat_infantil, bd.mat_fundamental);
        
        // Se o dado de evolução de matrículas existir no JSON, usa ele, senão Fallback
        const dMat = bd.matriculas || FALLBACK_DATA.matriculas;
        renderEvolucaoMatriculasLocal(dMat);

        // --- PARTE 3: FINALIZAÇÃO DOS LOADERS ---
        setTimeout(() => {
            const sidraStatus = bd.status_das_fontes?.find(s => s.includes("SIDRA/IBGE"));
            const isOffline = sidraStatus && sidraStatus.includes("Offline");

            banners.forEach(banner => {
                const statusText = banner.querySelector('span');
                banner.classList.remove('status-loading');
                if (isOffline) {
                    statusText.innerText = `FONTE: SIDRA/IBGE (INSTÁVEL) - USANDO BASE LOCAL PROTEGIDA (${bd.ultima_sincronizacao})`;
                    banner.classList.add('status-warning');
                } else {
                    statusText.innerText = `DADOS SINCRONIZADOS VIA ${bd.fonte_origem} EM ${bd.ultima_sincronizacao}`;
                    banner.classList.add('status-success');
                }
            });

            document.querySelectorAll('.loader-container').forEach(l => l.remove());
            cards.forEach(card => {
                card.classList.remove('is-loading');
                card.classList.add('is-loaded');
            });
        }, 2000);

    } catch (error) {
        console.error("Erro ao inicializar painel:", error);
        document.querySelectorAll('.loader-container').forEach(l => l.remove());
    }
}

function renderIdebLocal(dInit, dEnd) {
    const chart = createChart('chartIdeb', 'bar', {
        labels: dInit.labels,
        datasets: [{ label: 'Nota', data: dInit.values, backgroundColor: COLORS.yellow, borderRadius: 4 }]
    });

    document.getElementById('filterIdebType')?.addEventListener('change', function() {
        const isInit = this.value === 'iniciais';
        const data = isInit ? dInit : dEnd;
        updateChartDynamic(chart, isInit ? 'Anos Iniciais' : 'Anos Finais', data, COLORS.yellow);
    });
}

function renderTaxasLocal(dDist, dAban) {
    const chart = createChart('chartTaxasRendimento', 'bar', {
        labels: dDist.labels,
        datasets: [{ label: 'Taxa', data: dDist.values, backgroundColor: COLORS.green, borderRadius: 4 }]
    });

    document.getElementById('filterTaxasType')?.addEventListener('change', function() {
        const isDist = this.value === 'distorcao';
        const data = isDist ? dDist : dAban;
        updateChartDynamic(chart, isDist ? 'Distorção' : 'Abandono', data, isDist ? COLORS.green : COLORS.pink);
    });
}

function renderEvolucaoMatriculasLocal(dMat) {
    createChart('chartEvolucaoMatriculas', 'line', {
        labels: dMat.labels,
        datasets: [{ label: 'Matrículas', data: dMat.values, borderColor: COLORS.blue, fill: true, tension: 0.4 }]
    });
}

// Função que realiza o cálculo da subida do número
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Efeito de desaceleração para ficar mais suave
        const currentVal = Math.floor(progress * (end - start) + start);
        
        // Formata com pontos de milhar (ex: 25.181)
        obj.innerHTML = currentVal.toLocaleString('pt-BR');
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end.toLocaleString('pt-BR');
        }
    };
    window.requestAnimationFrame(step);
}

// Função que localiza os números e dispara a contagem
function initKpiCounters() {
    const numbers = document.querySelectorAll('.count-up');
    numbers.forEach(el => {
        const target = parseFloat(el.getAttribute('data-target'));
        if (!isNaN(target)) {
            animateValue(el, 0, target, 2000); // 2000ms = 2 segundos de duração
        }
    });
}

/* Nova função para o gráfico de Matrículas por Nível */
function renderMatriculasPorNivel(dInf, dFund) {
    // Se os dados não existirem no JSON, usa o Fallback de segurança
    const inf = dInf || FALLBACK_DATA.mat_infantil;
    const fund = dFund || FALLBACK_DATA.mat_fundamental;
    
    // Calcula o total somando Infantil + Fundamental
    const dTotal = { 
        labels: inf.labels, 
        values: inf.values.map((val, i) => val + (fund.values[i] || 0)) 
    };

    const chart = createChart('chartMatriculas', 'bar', {
        labels: dTotal.labels,
        datasets: [{ label: 'Total', data: dTotal.values, backgroundColor: COLORS.blue, borderRadius: 4 }]
    });

    // Filtro dinâmico para trocar entre Total, Infantil e Fundamental
    document.getElementById('filterMatriculasType')?.addEventListener('change', function() {
        let targetData, label, color;
        if (this.value === 'total') { 
            targetData = dTotal; label = 'Total'; color = COLORS.blue; 
        } else if (this.value === 'infantil') { 
            targetData = inf; label = 'Infantil'; color = COLORS.green; 
        } else { 
            targetData = fund; label = 'Fundamental'; color = COLORS.yellow; 
        }
        updateChartDynamic(chart, label, targetData, color);
    });
}


/* --- FUNÇÃO AUXILIAR: CALCULA TETO DA GRADE (SUPERIOR PRÓXIMO) --- */
function getSuperiorProximo(values) {
    const maxVal = Math.max(...values);
    if (maxVal <= 10) return maxVal + 0.5;      // Ex: IDEB 4.9 -> 5.4
    if (maxVal <= 100) return maxVal + 5;       // Ex: Taxas 29% -> 34%
    return maxVal * 1.05;                       // Ex: Matrículas 28k -> 29.4k (Cerca de 5% de margem)
}

/* --- FUNÇÃO DE CRIAÇÃO (COM ESCALA AJUSTADA) --- */
function createChart(id, type, data, options = {}) {
    const ctx = document.getElementById(id);
    if (!ctx) return null;

    const isLight = document.body.classList.contains('light-theme');
    const labelColor = isLight ? '#000000' : '#FFFFFF';

    const chart = new Chart(ctx, {
        type: type,
        data: data,
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: false },
                datalabels: {
                    display: type === 'bar', // Apenas nas barras
                    anchor: 'end', align: 'top', color: labelColor,
                    font: { weight: 'bold', size: 10 },
                    formatter: (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                }
            },
            scales: { 
                y: { 
                    grid: { color: COLORS.grid },
                    ticks: { color: isLight ? '#000' : '#AAA' },
                    suggestedMax: getSuperiorProximo(data.datasets[0].data) // Grade Superior Próxima
                }
            },
            ...options 
        }
    });
    chartInstances.push(chart);
    return chart;
}

function updateChartDynamic(chart, label, data, color) {
    chart.data.labels = data.labels;
    chart.data.datasets[0].label = label;
    chart.data.datasets[0].data = data.values;
    chart.data.datasets[0].backgroundColor = color;

    // Recalcula o teto da grade para acompanhar a segmentação
    if (chart.options.scales && chart.options.scales.y) {
        chart.options.scales.y.suggestedMax = getSuperiorProximo(data.values);
    }

    chart.update();
}

/* --- INICIALIZAÇÕES --- */

async function initIdebChart() {
    const resInit = await fetchSidraData(SIDRA_URLS.ideb_iniciais);
    const resEnd = await fetchSidraData(SIDRA_URLS.ideb_finais);
    const dInit = resInit || FALLBACK_DATA.ideb_iniciais;
    const dEnd = resEnd || FALLBACK_DATA.ideb_finais;

    const chart = createChart('chartIdeb', 'bar', {
        labels: dInit.labels,
        datasets: [{ label: 'Nota', data: dInit.values, backgroundColor: COLORS.yellow, borderRadius: 4 }]
    });

    document.getElementById('filterIdebType')?.addEventListener('change', function() {
        const isInit = this.value === 'iniciais';
        updateChartDynamic(chart, isInit ? 'Anos Iniciais' : 'Anos Finais', isInit ? dInit : dEnd, isInit ? COLORS.blue : COLORS.blue);
    });
}

async function initEvolucaoMatriculas() {
    const apiMat = await fetchSidraData(SIDRA_URLS.matriculas);
    const dMat = apiMat || FALLBACK_DATA.matriculas;
    // Gráfico de linha terá a grade ajustada, mas sem números no topo
    createChart('chartEvolucaoMatriculas', 'line', {
        labels: dMat.labels,
        datasets: [{ label: 'Matrículas', data: dMat.values, borderColor: COLORS.blue, fill: true, tension: 0.4 }]
    });
}

async function initTaxasChart() {
    const resDist = await fetchSidraData(SIDRA_URLS.taxa_distorcao);
    const resAban = await fetchSidraData(SIDRA_URLS.taxa_abandono);
    const dDist = resDist || FALLBACK_DATA.taxas_distorcao;
    const dAban = resAban || FALLBACK_DATA.taxas_abandono;

    const chart = createChart('chartTaxasRendimento', 'bar', {
        labels: dDist.labels,
        datasets: [{ label: 'Valor', data: dDist.values, backgroundColor: COLORS.green, borderRadius: 4 }]
    });

    document.getElementById('filterTaxasType')?.addEventListener('change', function() {
        const isDist = this.value === 'distorcao';
        const data = isDist ? dDist : dAban;
        updateChartDynamic(chart, isDist ? 'Distorção (%)' : 'Abandono (%)', data, isDist ? COLORS.green : COLORS.pink);
    });
}

async function initMatriculasNivelChart() {
    const resInf = await fetchSidraData(SIDRA_URLS.mat_infantil);
    const resFund = await fetchSidraData(SIDRA_URLS.mat_fundamental);
    const dInf = resInf || FALLBACK_DATA.mat_infantil;
    const dFund = resFund || FALLBACK_DATA.mat_fundamental;
    const dTotal = { labels: dInf.labels, values: dInf.values.map((val, i) => val + (dFund.values[i] || 0)) };

    const chart = createChart('chartMatriculas', 'bar', {
        labels: dTotal.labels,
        datasets: [{ label: 'Total', data: dTotal.values, backgroundColor: 'yellow', borderRadius: 4 }]
    });

    document.getElementById('filterMatriculasType')?.addEventListener('change', function() {
        let targetData, label, color;
        if (this.value === 'total') { targetData = dTotal; label = 'Total'; color = '#009039'; }
        else if (this.value === 'infantil') { targetData = dInf; label = 'Infantil'; color = COLORS.blue; }
        else { targetData = dFund; label = 'Fundamental'; color = COLORS.purple; }
        updateChartDynamic(chart, label, targetData, color);
    });
}

async function initDistribGeralNovo() {
    const resInf = await fetchSidraData(SIDRA_URLS.mat_infantil);
    const dInf = resInf || FALLBACK_DATA.mat_infantil;
    createChart('chartDistribGeral', 'bar', {
        labels: dInf.labels,
        datasets: [{ label: 'Matrículas', data: dInf.values, backgroundColor: COLORS.green, borderRadius: 4 }]
    });
}

window.addEventListener('themeChanged', (e) => {
    const isLight = e.detail.theme === 'light';
    const textColor = isLight ? '#000000' : '#FFFFFF';
    chartInstances.forEach(chart => {
        if (chart.options.plugins.datalabels) chart.options.plugins.datalabels.color = textColor;
        if (chart.options.scales.y) chart.options.scales.y.ticks.color = isLight ? '#000' : '#AAA';
        if (chart.options.scales.x) chart.options.scales.x.ticks.color = isLight ? '#000' : '#AAA';
        chart.update();
    });
});