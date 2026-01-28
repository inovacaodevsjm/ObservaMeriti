/* =======================================================================
   SCRIPT.JS - VERSÃO FINAL OTIMIZADA
   Descrição: Controla API IBGE, Gráficos (Chart.js), Loaders e Slider.
   ======================================================================= */

// --- 1. CONFIGURAÇÃO E DADOS ---

// Dados de Backup (Fallback seguro caso a API falhe)
let appData = {
    populacao: { 2010: 458673, 2022: 440962 },
    salario: 1.7,
    pib: 18935.50,
    densidade: 12521.64
};

// Cores Oficiais (Reutilizáveis)
const COLORS = {
    green: '#009039',
    yellow: '#FDC806',
    blue: '#0056b3',
    gray: '#AAA',
    grid: 'rgba(255, 255, 255, 0.05)'
};

// --- 2. INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicia animações visuais (Scroll e Contadores)
    initScrollAnimation();
    initCounterAnimation(); 
    
    // 2. Inicia o sistema principal (API + Loaders + Gráficos)
    initAppSystem();
    
    // 3. Inicia componentes interativos
    initSlider();
});

/* =======================================================================
   3. SISTEMA PRINCIPAL (API + LOADERS)
   ======================================================================= */

async function initAppSystem() {
    // A) Inicia Loaders Visuais
    const cards = document.querySelectorAll('.analise-card');
    cards.forEach(card => addLoaderToCard(card));

    // B) Busca dados REAIS na API em paralelo
    await fetchIBGEData();

    // C) Configura Observador para remover loaders quando visíveis
    setupLoaderObserver(cards);
}

// Adiciona o HTML do loader ao card
function addLoaderToCard(card) {
    card.classList.add('is-loading');
    card.style.position = 'relative'; 
    const loaderHTML = `<div class="loader-container"><div class="tech-loader"></div></div>`;
    card.insertAdjacentHTML('beforeend', loaderHTML);
}

// Configura o IntersectionObserver para remover o loader e iniciar gráficos
function setupLoaderObserver(cards) {
    let chartsInitialized = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const loader = card.querySelector('.loader-container');
                observer.unobserve(card);

                // Delay estético (3s) para mostrar a animação tecnológica
                setTimeout(() => {
                    if(loader) loader.style.opacity = '0';
                    card.classList.remove('is-loading');
                    card.classList.add('is-loaded');
                    
                    // Remove do DOM após fade-out
                    setTimeout(() => { if(loader) loader.remove(); }, 500);

                    // Inicializa gráficos APENAS UMA VEZ
                    if (!chartsInitialized) {
                        initAllCharts(); 
                        chartsInitialized = true;
                    }
                }, 3000); 
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => observer.observe(card));
}

/* =======================================================================
   4. API IBGE (CONEXÃO REAL)
   ======================================================================= */

async function fetchIBGEData() {
    console.log("📡 Conectando ao IBGE...");
    const codSJM = '3305109'; 

    const urls = {
        pop2022: `https://apisidra.ibge.gov.br/values/t/4714/n6/${codSJM}/v/93/p/2022?formato=json`,
        pib: `https://apisidra.ibge.gov.br/values/t/5938/n6/${codSJM}/v/37/p/2021?formato=json`,
        salario: `https://apisidra.ibge.gov.br/values/t/1685/n6/${codSJM}/v/2079/p/2021?formato=json`
    };

    try {
        const [resPop, resPib, resSal] = await Promise.all([
            fetch(urls.pop2022), fetch(urls.pib), fetch(urls.salario)
        ]);

        if (!resPop.ok || !resPib.ok || !resSal.ok) throw new Error("Erro na resposta do IBGE");

        const jsonPop = await resPop.json();
        const jsonPib = await resPib.json();
        const jsonSal = await resSal.json();

        // Atualiza Dados Globais com Segurança
        if (jsonPop[1]?.V) appData.populacao[2022] = parseInt(jsonPop[1].V);
        if (jsonPib[1]?.V) appData.pib = parseFloat(jsonPib[1].V);
        if (jsonSal[1]?.V) appData.salario = parseFloat(jsonSal[1].V);

        console.log("✅ Dados IBGE Atualizados:", appData);
        updateKpiNumbers(); // Atualiza interface

    } catch (error) {
        console.warn("⚠️ Falha na API (Usando Backup):", error.message);
    }
}

function updateKpiNumbers() {
    // Exemplo: Atualiza População no Card KPI se existir
    const elPop = document.querySelector('.kpi-card:first-child .kpi-number');
    if(elPop) elPop.innerText = appData.populacao[2022].toLocaleString('pt-BR');
}

/* =======================================================================
   5. GRÁFICOS (CHART.JS)
   ======================================================================= */

function initAllCharts() {
    // Configuração Global Chart.js
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = COLORS.gray;
    Chart.defaults.scale.grid.color = COLORS.grid;

    // --- MINI GRÁFICO HOME (EDUCAÇÃO) ---
    createChart('miniChartEduHome', 'line', {
        labels: ['2021', '2022', '2023', '2024'],
        datasets: [{
            label: 'Alunos', data: [38800, 39100, 39350, 39500],
            borderColor: COLORS.yellow, borderWidth: 3,
            backgroundColor: (ctx) => createGradient(ctx, COLORS.yellow),
            fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6
        }]
    }, { scales: { x: {display: false}, y: {display: false, min: 38000} } });

    // --- 1. POPULAÇÃO ---
    createChart('chartPop', 'bar', {
        labels: ['Censo 2010', 'Censo 2022'],
        datasets: [{
            label: 'População', data: [appData.populacao[2010], appData.populacao[2022]],
            backgroundColor: [COLORS.blue, COLORS.green], borderRadius: 6, barThickness: 50
        }]
    }, { scales: { y: { beginAtZero: false, min: 400000 } } });

    // --- 2. TRABALHO ---
    createChart('chartTrab', 'bar', {
        labels: ['SJM', 'Estado RJ', 'Brasil'],
        datasets: [{
            label: 'Salários Mínimos', data: [appData.salario, 2.4, 2.2],
            backgroundColor: [COLORS.yellow, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)'],
            borderRadius: 4, barThickness: 30
        }]
    }, { indexAxis: 'y' });

    // --- 3. EDUCAÇÃO ---
    createChart('chartEdu', 'line', {
        labels: ['2019', '2020', '2021', '2022', '2023'],
        datasets: [{
            label: 'Matrículas', data: [38500, 39100, 38800, 39500, 40100],
            borderColor: COLORS.green, backgroundColor: 'rgba(0, 144, 57, 0.1)',
            fill: true, tension: 0.4, pointRadius: 4
        }]
    }, { scales: { y: { display: false } } });

    // --- 4. ECONOMIA ---
    createChart('chartEcon', 'doughnut', {
        labels: ['Serviços', 'Indústria', 'Adm. Pública', 'Agro'],
        datasets: [{
            data: [65, 15, 19.9, 0.1],
            backgroundColor: [COLORS.yellow, COLORS.blue, COLORS.green, '#999'],
            borderWidth: 0, hoverOffset: 10
        }]
    }, { cutout: '65%', plugins: { legend: { position: 'right' } } });

    // --- 5. SAÚDE ---
    createChart('chartSaude', 'line', {
        labels: ['2018', '2019', '2020', '2021'],
        datasets: [{
            label: 'Óbitos por mil', data: [15.2, 14.9, 14.88, 14.1],
            borderColor: '#FF4444', borderDash: [5, 5], pointBackgroundColor: '#FF4444', tension: 0.2
        }]
    });

    // --- 6. MEIO AMBIENTE ---
    createChart('chartAmb', 'bar', {
        labels: ['Coleta Lixo', 'Água', 'Esgoto'],
        datasets: [{
            label: 'Cobertura (%)', data: [98.7, 91.2, 64.1],
            backgroundColor: [COLORS.green, COLORS.blue, '#555'], borderRadius: 4
        }]
    }, { scales: { y: { max: 100 } } });

    // --- 7. TERRITÓRIO ---
    createChart('chartTerr', 'bar', {
        labels: ['SJM', 'Estado RJ'],
        datasets: [{
            label: 'Hab/km²', data: [12521, 365],
            backgroundColor: [COLORS.yellow, '#444'], borderRadius: 4
        }]
    }, { scales: { y: { type: 'logarithmic' } } });
}

// Helper: Cria Gráfico com Verificação de Existência
function createChart(id, type, data, extraOptions = {}) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    
    new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            ...extraOptions
        }
    });
}

// Helper: Cria Gradiente
function createGradient(context, color) {
    const ctx = context.chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, color.replace(')', ', 0.0)').replace('rgb', 'rgba'));
    return gradient;
}

/* =======================================================================
   6. INTERATIVIDADE (SLIDER, SCROLL, CONTADORES)
   ======================================================================= */

// Slider Horizontal
function initSlider() {
    const container = document.querySelector('.paineis-grid');
    const btnLeft = document.querySelector('.slider-arrow.left');
    const btnRight = document.querySelector('.slider-arrow.right');

    if (!container || !btnLeft || !btnRight) return;

    btnRight.addEventListener('click', () => container.scrollBy({ left: 350, behavior: 'smooth' }));
    btnLeft.addEventListener('click', () => container.scrollBy({ left: -350, behavior: 'smooth' }));
}

// Animação de Scroll (Fade In)
function initScrollAnimation() {
    const elements = document.querySelectorAll('.kpi-card, .painel-card, .section-title');
    elements.forEach(el => el.classList.add('js-scroll'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => observer.observe(el));
}

// Animação de Números (Count Up)
function initCounterAnimation() {
    const numbers = document.querySelectorAll('.kpi-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const el = entry.target;
                const finalValueText = el.innerText;
                const endValue = parseFloat(finalValueText.replace(/\./g, '').replace(',', '.'));
                const isDecimal = finalValueText.includes(',');

                animateValue(el, 0, endValue, 2000, isDecimal, finalValueText);
                el.classList.add('counted');
            }
        });
    }, { threshold: 0.5 });
    
    numbers.forEach(el => observer.observe(el));
}

function animateValue(obj, start, end, duration, isDecimal, originalText) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = progress === 1 ? end : (1 - Math.pow(1 - progress, 3)) * end;

        obj.innerHTML = isDecimal 
            ? currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : Math.floor(currentVal).toLocaleString('pt-BR');

        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = originalText;
    };
    window.requestAnimationFrame(step);
}