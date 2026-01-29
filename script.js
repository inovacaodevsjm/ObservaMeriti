/* =======================================================================
   SCRIPT.JS - VERSÃO FINAL OTIMIZADA
   Descrição: Controla API IBGE, Gráficos (Chart.js), Loaders, Slider e Menu.
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

let chartInstances = []; // Lista para controlar os gráficos ativos


// --- 2. INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicia componentes visuais
    initThemeSystem();
    initMobileMenu();       // <--- NOVO: Ativa o Menu Mobile
    initScrollAnimation();
    initCounterAnimation(); 
    
    if (typeof initAppSystem === 'function') {
        initAppSystem();
    }
    
    // 5. Inicia Slider
    if (typeof initSlider === 'function') {
        initSlider();
    }
});

/* =======================================================================
   3. MENU MOBILE (IGUAL EDUCAÇÃO)
   ======================================================================= */

function initMobileMenu() {
    // Define a função globalmente para o onclick="toggleMenu()" do HTML funcionar
    window.toggleMenu = function() {
        const nav = document.getElementById('navMenu');
        if (nav) {
            nav.classList.toggle('active');
        }
    };

    // (Opcional) Fecha o menu automaticamente ao clicar em um link
    const links = document.querySelectorAll('.nav-menu a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.getElementById('navMenu');
            if (nav) nav.classList.remove('active');
        });
    });
}

/* =======================================================================
   4. SISTEMA PRINCIPAL (API + LOADERS)
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

                // Delay estético (2s) para mostrar a animação tecnológica
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
                }, 2000); 
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => observer.observe(card));
}

// --- INTEGRAÇÃO API IBGE (CORRIGIDA) ---
async function fetchIBGEData() {
    // Código IBGE de São João de Meriti: 3305109
    // Endereços oficiais da API de Agregados (Censo 2022 e PIB)
    const urls = [
        // 1. População (Censo 2022) - Variável 93 (População residente)
        'https://servicodados.ibge.gov.br/api/v3/agregados/9605/periodos/2022/variaveis/93?localidades=N6[3305109]',
        
        // 2. PIB (Produto Interno Bruto) - Variável 37 (PIB a preços correntes)
        'https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/-1/variaveis/37?localidades=N6[3305109]'
    ];

    try {
        // Tenta buscar os dois dados ao mesmo tempo
        const responses = await Promise.all(urls.map(url => fetch(url)));

        // Verifica se algum falhou
        responses.forEach(res => {
            if (!res.ok) throw new Error(`Erro IBGE: ${res.status}`);
        });

        const data = await Promise.all(responses.map(res => res.json()));

        // --- PROCESSAMENTO DOS DADOS ---
        
        // 1. População
        const popValue = data[0][0].resultados[0].series[0].serie['2022'];
        
        // 2. PIB (O valor vem em x1000, ex: 18000000)
        const pibValue = data[1][0].resultados[0].series[0].serie['2021'] || data[1][0].resultados[0].series[0].serie['2020'];

        // Atualiza a variável global appData com os dados frescos
        appData.populacao[2022] = parseInt(popValue);
        appData.pib = parseFloat(pibValue) / 1000000; // Ajusta para Bilhões se necessário, ou mantém original

        console.log("✅ Dados IBGE atualizados com sucesso!");
        
        // Chama a função que desenha os números na tela
        updateDashboardUI();

    } catch (error) {
        console.warn("⚠️ Falha na API (Usando Backup):", error.message);
        // Se der erro, a interface usa o 'appData' original que definimos no topo do arquivo
        updateDashboardUI();
    }
}

function updateKpiNumbers() {
    // Exemplo: Atualiza População no Card KPI se existir
    const elPop = document.querySelector('.kpi-card:first-child .kpi-number');
    if(elPop) elPop.innerText = appData.populacao[2022].toLocaleString('pt-BR');
}

/* =======================================================================
   6. GRÁFICOS (CHART.JS)
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

// Helper: Cria Gráfico com Verificação e Armazenamento
function createChart(id, type, data, extraOptions = {}) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    
    // Cria o gráfico
    const newChart = new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            ...extraOptions
        }
    });

    // --- CORREÇÃO: Salva o gráfico na lista para podermos mudar a cor depois ---
    if (typeof chartInstances !== 'undefined') {
        chartInstances.push(newChart);
    }

    return newChart;
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
   7. INTERATIVIDADE (SLIDER, SCROLL, CONTADORES)
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



/* =======================================================================
   GERENCIADOR DE TEMAS (DARK / WHITE - VERSÃO ÍCONES)
   ======================================================================= */

function initThemeSystem() {
    const themeBtn = document.getElementById('theme-toggle');
    console.log("Botão de tema encontrado?", themeBtn);
    // Busca o elemento 'i' (ícone) dentro do botão
    const themeIcon = themeBtn ? themeBtn.querySelector('i') : null;
    const body = document.body;

    // Verifica preferência salva
    const savedTheme = localStorage.getItem('site_theme');
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        updateButtonState(true); 
        
        // --- CORREÇÃO: Garante que os gráficos carreguem pretos ---
        setTimeout(() => {
            if (typeof updateChartsTheme === 'function') updateChartsTheme(true);
            if (typeof fixChartPop === 'function') fixChartPop(true);
        }, 500); // Pequeno delay para dar tempo do gráfico ser criado
    } else {
        updateButtonState(false); 
    }

    // Evento de Clique
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            body.classList.toggle('light-theme');
            const isLight = body.classList.contains('light-theme');
            
            localStorage.setItem('site_theme', isLight ? 'light' : 'dark');
            updateButtonState(isLight);
            
            // Tenta atualizar os gráficos, mas não trava se der erro
            try {
                if (typeof updateChartsTheme === 'function') updateChartsTheme(isLight);
                if (typeof fixChartPop === 'function') fixChartPop(isLight);
            } catch (error) {
                console.log("Aguardando gráficos carregarem...", error);
            }
        });
    }

    // --- FUNÇÃO QUE TROCA O ÍCONE ---
    function updateButtonState(isLight) {
        if (!themeIcon) return;
        
        if (isLight) {
            // Se está CLARO, queremos a LUA (fa-moon)
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            // Se está ESCURO, queremos o SOL (fa-sun)
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }

    // Também adicione logo após verificar o tema salvo (para quando abrir o site)
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        updateButtonState(true);
        
        // ADICIONE AQUI TAMBÉM:
        setTimeout(() => updateChartsTheme(true), 100); // Pequeno delay para garantir que o gráfico carregou
    }
}

// --- FUNÇÃO PARA ATUALIZAR CORES DOS GRÁFICOS (DARK/LIGHT) ---
function updateChartsTheme(isLight) {
    // --- CONFIGURAÇÃO DE CORES ---
    
    // 1. TEXTO (Eixos X e Y):
    // Light: Preto Puro (#000000)
    // Dark:  Cinza Claro (#AAAAAA)
    const textColor = isLight ? '#000000' : '#AAAAAA';
    
    // 2. GRADE (Linhas de fundo):
    // Light: Cinza Escuro (#444444) - Para destacar no branco
    // Dark:  Transparente (rgba 255, 0.05) - Para ficar sutil no preto
    const gridColor = isLight ? '#444444' : 'rgba(255, 255, 255, 0.05)';
    
    // Aplica nos padrões globais
    if (window.Chart) {
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;
    }

    // Aplica em cada gráfico já criado
    chartInstances.forEach(chart => {
        if (chart.options) {
            chart.options.color = textColor; // Muda a cor geral do texto
            
            if (chart.options.scales) {
                Object.keys(chart.options.scales).forEach(scaleKey => {
                    const scale = chart.options.scales[scaleKey];
                    
                    // Atualiza a GRADE
                    if (scale.grid) scale.grid.color = gridColor;
                    
                    // Atualiza os VALORES X e Y (Ticks)
                    if (scale.ticks) {
                        scale.ticks.color = textColor; 
                        scale.ticks.backdropColor = 'transparent'; // Garante fundo limpo
                    }
                });
            }
        }
        chart.update(); 
    });
}

// Função Específica: Corrige o Gráfico de População
function fixChartPop(isLight) {
    const chartInstance = Chart.getChart("chartPop"); 

    if (chartInstance) {
        // --- MESMAS CORES DA FUNÇÃO ACIMA ---
        const novaCorTexto = isLight ? '#000000' : '#FFFFFF'; // Preto ou Branco
        const novaCorGrade = isLight ? '#444444' : 'rgba(255, 255, 255, 0.1)'; // Cinza ou Transparente

        // Eixo X (Horizontal)
        if (chartInstance.options.scales.x) {
            chartInstance.options.scales.x.ticks.color = novaCorTexto; // Muda cor dos números
            chartInstance.options.scales.x.grid.color = novaCorGrade;  // Muda cor da linha
        }
        
        // Eixo Y (Vertical)
        if (chartInstance.options.scales.y) {
            chartInstance.options.scales.y.ticks.color = novaCorTexto; // Muda cor dos números
            chartInstance.options.scales.y.grid.color = novaCorGrade;  // Muda cor da linha
        }

        // Legenda
        if (chartInstance.options.plugins.legend) {
            chartInstance.options.plugins.legend.labels.color = novaCorTexto;
        }

        chartInstance.update();
    }
}

// --- FUNÇÃO QUE ATUALIZA OS NÚMEROS NA TELA (KPIs) ---
function updateDashboardUI() {
    // 1. Atualiza População
    const kpiPop = document.getElementById('kpi-pop');
    if (kpiPop) {
        // Pega o valor de 2022 do nosso objeto de dados
        kpiPop.innerText = appData.populacao[2022].toLocaleString('pt-BR');
    }

    // 2. Atualiza PIB
    const kpiPib = document.getElementById('kpi-pib');
    if (kpiPib) {
        // Formata para "R$ X.XXX,XX Bi"
        kpiPib.innerText = "R$ " + appData.pib.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " Bi";
    }

    // 3. Atualiza Densidade (se existir o elemento)
    const kpiDens = document.getElementById('kpi-densidade');
    if (kpiDens) {
        kpiDens.innerText = appData.densidade.toLocaleString('pt-BR');
    }

    // 4. Atualiza Salário/Renda (se existir o elemento)
    const kpiRenda = document.getElementById('kpi-renda');
    if (kpiRenda) {
        kpiRenda.innerText = appData.salario.toLocaleString('pt-BR') + " salários";
    }
}